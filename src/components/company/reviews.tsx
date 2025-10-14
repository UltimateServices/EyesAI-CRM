'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Company, Review } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, X, ExternalLink, Filter, Calendar, Download, Loader2 } from 'lucide-react';

interface ReviewsProps {
  company: Company;
}

export function Reviews({ company }: ReviewsProps) {
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const saveIntake = useStore((state) => state.saveIntake);
  const intake = getIntakeByCompanyId(company.id);
  
  const [reviews, setReviews] = useState<Review[]>(intake?.reviews || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterFiveStarOnly, setFilterFiveStarOnly] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const [formData, setFormData] = useState({
    rating: 5 as 1 | 2 | 3 | 4 | 5,
    reviewerName: '',
    reviewText: '',
    date: new Date().toISOString().split('T')[0],
    platform: 'Google' as 'Google' | 'Yelp' | 'Facebook' | 'TripAdvisor' | 'Other',
    reviewUrl: '',
  });

  const handleAddReview = () => {
    if (!formData.reviewerName.trim() || !formData.reviewText.trim()) {
      alert('Please fill in reviewer name and review text');
      return;
    }

    const newReview: Review = {
      id: 'review-' + Date.now().toString(),
      companyId: company.id,
      rating: formData.rating,
      reviewerName: formData.reviewerName.trim(),
      reviewText: formData.reviewText.trim(),
      date: formData.date,
      platform: formData.platform,
      reviewUrl: formData.reviewUrl.trim() || undefined,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    
    const intakeData = intake || {
      id: 'intake-' + company.id,
      companyId: company.id,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveIntake({
      ...intakeData,
      reviews: updatedReviews,
      updatedAt: new Date().toISOString(),
    });

    setFormData({
      rating: 5,
      reviewerName: '',
      reviewText: '',
      date: new Date().toISOString().split('T')[0],
      platform: 'Google',
      reviewUrl: '',
    });
    
    setShowAddForm(false);
    alert('Review added successfully!');
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      const updatedReviews = reviews.filter(r => r.id !== reviewId);
      setReviews(updatedReviews);
      
      const intakeData = intake || {
        id: 'intake-' + company.id,
        companyId: company.id,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveIntake({
        ...intakeData,
        reviews: updatedReviews,
        updatedAt: new Date().toISOString(),
      });
      
      alert('Review deleted!');
    }
  };

  const handleImportGoogleReviews = async () => {
    const googleMapsUrls: string[] = [];
    
    const fieldsToCheck = [
      intake?.directProfiles,
      intake?.reviewLinks,
      intake?.mapLink,
      intake?.website,
      intake?.socialMediaLinks,
      intake?.physicalAddress,
      company.website,
      company.address,
    ];

    for (const field of fieldsToCheck) {
      if (!field) continue;
      
      const urlMatches = field.match(/https?:\/\/[^\s,)]+/gi);
      if (urlMatches) {
        const googleUrls = urlMatches.filter(url => 
          url.includes('google.com/maps') || 
          url.includes('maps.google.com') ||
          url.includes('goo.gl/maps') ||
          url.includes('maps.app.goo.gl')
        );
        googleMapsUrls.push(...googleUrls);
      }
    }

    const uniqueUrls = Array.from(new Set(googleMapsUrls));

    if (uniqueUrls.length === 0) {
      alert('❌ No Google Maps URLs found.\n\nPlease add Google Maps links in the intake form:\n• Part 2: Physical Address/Map Link\n• Part 7: Direct Profiles or Review Links');
      return;
    }

    const locationText = uniqueUrls.length === 1 ? '1 location' : `${uniqueUrls.length} locations`;

    const confirmMsg = `Import 5-star reviews from Google?\n\n` +
      `Found: ${locationText}\n\n` +
      `This will:\n` +
      `✓ Fetch all 5-star reviews\n` +
      `✓ Import from all locations\n` +
      `✓ Skip duplicates automatically\n\n` +
      `Continue?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      console.log('Starting import with URLs:', uniqueUrls);

      const response = await fetch('/api/import-google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          googleMapsUrls: uniqueUrls,
          companyName: company.name,
          companyAddress: company.address || intake?.physicalAddress,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to import reviews');
      }

      const { locations, totalLocations, totalFiveStarReviews, totalAllReviews, allFiveStarReviews } = result.data;

      const importedReviews: Review[] = allFiveStarReviews.map((review: any, index: number) => ({
        id: 'review-google-' + Date.now() + '-' + index,
        companyId: company.id,
        rating: 5 as 5,
        reviewerName: review.reviewerName,
        reviewText: review.reviewText,
        date: review.date,
        platform: 'Google' as const,
        reviewUrl: review.reviewUrl,
        source: 'intake' as const,
        createdAt: new Date().toISOString(),
      }));

      const existingTexts = new Set(reviews.map(r => r.reviewText.toLowerCase().trim()));
      const newReviews = importedReviews.filter(r => !existingTexts.has(r.reviewText.toLowerCase().trim()));
      
      if (newReviews.length === 0) {
        alert('ℹ️ No new reviews to import.\n\nAll 5-star reviews are already in the system.');
        setIsImporting(false);
        return;
      }

      const updatedReviews = [...reviews, ...newReviews];
      setReviews(updatedReviews);

      const intakeData = intake || {
        id: 'intake-' + company.id,
        companyId: company.id,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveIntake({
        ...intakeData,
        reviews: updatedReviews,
        updatedAt: new Date().toISOString(),
      });

      let summaryText = `✅ Successfully imported ${newReviews.length} new 5-star reviews!\n\n`;
      summaryText += `📊 Summary:\n`;
      summaryText += `• Locations Processed: ${totalLocations}\n`;
      summaryText += `• Total Reviews Found: ${totalAllReviews}\n`;
      summaryText += `• 5-Star Reviews: ${totalFiveStarReviews}\n`;
      summaryText += `• New Reviews Added: ${newReviews.length}\n`;
      summaryText += `• Duplicates Skipped: ${totalFiveStarReviews - newReviews.length}\n\n`;
      summaryText += `📍 Locations:\n`;
      
      locations.forEach((loc: any, index: number) => {
        summaryText += `\n${index + 1}. ${loc.locationName}\n`;
        summaryText += `   ${loc.locationAddress}\n`;
        summaryText += `   ⭐ ${loc.overallRating} rating • ${loc.fiveStarReviews.length} 5-star reviews\n`;
      });

      alert(summaryText);
    } catch (error: any) {
      console.error('Import error:', error);
      setImportError(error.message);
      alert('❌ Failed to import reviews:\n\n' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredReviews = filterFiveStarOnly ? reviews.filter(r => r.rating === 5) : reviews;
  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <span className="text-4xl font-bold text-slate-900">{averageRating}</span>
              </div>
              <p className="text-sm text-slate-600">Average Rating</p>
            </div>
            <div className="h-16 w-px bg-slate-300" />
            <div>
              <p className="text-3xl font-bold text-slate-900">{reviews.length}</p>
              <p className="text-sm text-slate-600">Total Reviews</p>
            </div>
            <div className="h-16 w-px bg-slate-300" />
            <div>
              <p className="text-3xl font-bold text-yellow-600">{fiveStarCount}</p>
              <p className="text-sm text-slate-600">5-Star Reviews</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleImportGoogleReviews} 
              variant="outline" 
              className="gap-2"
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Import from Google
                </>
              )}
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Review
            </Button>
          </div>
        </div>
      </Card>

      {importError ? (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700 whitespace-pre-wrap">{importError}</p>
        </Card>
      ) : null}

      {showAddForm ? (
        <Card className="p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Review</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button key={rating} type="button" onClick={() => setFormData({ ...formData, rating: rating as 1 | 2 | 3 | 4 | 5 })}>
                    <Star className={rating <= formData.rating ? 'w-8 h-8 text-yellow-500 fill-yellow-500' : 'w-8 h-8 text-slate-300'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Platform</label>
              <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="Google">Google</option>
                <option value="Yelp">Yelp</option>
                <option value="Facebook">Facebook</option>
                <option value="TripAdvisor">TripAdvisor</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reviewer Name</label>
              <input type="text" value={formData.reviewerName} onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Review Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Review URL (optional)</label>
              <input type="url" value={formData.reviewUrl} onChange={(e) => setFormData({ ...formData, reviewUrl: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://google.com/maps" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Review Text</label>
              <textarea value={formData.reviewText} onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={4} placeholder="Great service! Highly recommend..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button onClick={handleAddReview}>Add Review</Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filter:</span>
          </div>
          <div className="flex gap-2">
            <Button variant={filterFiveStarOnly ? 'default' : 'outline'} size="sm" onClick={() => setFilterFiveStarOnly(true)}>
              5-Star Only ({fiveStarCount})
            </Button>
            <Button variant={!filterFiveStarOnly ? 'default' : 'outline'} size="sm" onClick={() => setFilterFiveStarOnly(false)}>
              All Reviews ({reviews.length})
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {review.reviewerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{review.reviewerName}</h4>
                      <Badge variant="secondary" className="text-xs">{review.platform}</Badge>
                      {review.source === 'intake' ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Imported</Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={star <= review.rating ? 'w-4 h-4 text-yellow-500 fill-yellow-500' : 'w-4 h-4 text-slate-300'} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">•</span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(review.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {review.reviewUrl ? (
                    <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : null}
                  {review.source === 'manual' ? (
                    <button type="button" onClick={() => handleDeleteReview(review.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="text-slate-700">{review.reviewText}</p>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filterFiveStarOnly ? 'No 5-Star Reviews Yet' : 'No Reviews Yet'}
            </h3>
            <p className="text-slate-600 mb-4">Import from Google or add reviews manually</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleImportGoogleReviews} variant="outline" disabled={isImporting}>
                <Download className="w-4 h-4 mr-2" />
                Import from Google
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-slate-900 mb-3">💡 Review Import Tips</h4>
        <ul className="text-sm text-slate-700 space-y-2">
          <li>• <strong>Automatic Detection:</strong> System scans all intake fields for Google Maps URLs</li>
          <li>• <strong>Multi-Location:</strong> Imports reviews from all locations automatically</li>
          <li>• <strong>5-Star Only:</strong> Only fetches 5-star reviews for marketing use</li>
          <li>• <strong>Smart Deduplication:</strong> Skips reviews already in the system</li>
          <li>• <strong>Multiple Formats:</strong> Handles various Google Maps URL formats</li>
        </ul>
      </Card>
    </div>
  );
}