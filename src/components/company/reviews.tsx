'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Company, Review } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, X, ExternalLink, Filter, Calendar, Download, Loader2, AlertCircle } from 'lucide-react';

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
    alert('✅ Review added successfully!');
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
      
      alert('✅ Review deleted!');
    }
  };

  const handleImportGoogleReviews = async () => {
    const googleMapsUrls: string[] = [];
    
    const fieldsToCheck = [
      intake?.directProfiles,
      intake?.reviewLinks,
      intake?.googleReviewsTotal,
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
          url.toLowerCase().includes('google') || 
          url.includes('goo.gl') ||
          url.includes('g.page') ||
          url.includes('maps.app')
        );
        googleMapsUrls.push(...googleUrls);
      }
    }

    const uniqueUrls = Array.from(new Set(googleMapsUrls));

    const confirmMsg = `🔍 Import Reviews from Google?\n\n` +
      `This will use multiple strategies to find reviews:\n\n` +
      `✓ ${uniqueUrls.length > 0 ? `Process ${uniqueUrls.length} Google URLs` : 'Search by business info'}\n` +
      `✓ Search by phone number\n` +
      `✓ Search by address\n` +
      `✓ Search by business name\n` +
      `✓ Nearby location search\n\n` +
      `The system will try every method to find your reviews.\n\n` +
      `Continue?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      console.log('🚀 Starting comprehensive import...');

      const response = await fetch('/api/import-google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          googleMapsUrls: uniqueUrls,
          companyName: company.name,
          companyAddress: company.address || intake?.physicalAddress,
          companyPhone: company.phone || intake?.mainPhone,
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

      let summaryText = `🎉 Successfully imported ${newReviews.length} new 5-star reviews!\n\n`;
      summaryText += `📊 Import Summary:\n`;
      summaryText += `━━━━━━━━━━━━━━━━━━━━\n`;
      summaryText += `✓ Locations Found: ${totalLocations}\n`;
      summaryText += `✓ Total Reviews: ${totalAllReviews}\n`;
      summaryText += `✓ 5-Star Reviews: ${totalFiveStarReviews}\n`;
      summaryText += `✓ New Added: ${newReviews.length}\n`;
      summaryText += `✓ Duplicates Skipped: ${totalFiveStarReviews - newReviews.length}\n\n`;
      summaryText += `📍 Locations:\n`;
      summaryText += `━━━━━━━━━━━━━━━━━━━━\n`;
      
      locations.forEach((loc: any, index: number) => {
        summaryText += `\n${index + 1}. ${loc.locationName}\n`;
        summaryText += `   📍 ${loc.locationAddress}\n`;
        summaryText += `   ⭐ ${loc.overallRating} rating\n`;
        summaryText += `   💬 ${loc.fiveStarReviews.length} 5-star reviews imported\n`;
        if (loc.phone) summaryText += `   📞 ${loc.phone}\n`;
      });

      alert(summaryText);
    } catch (error: any) {
      console.error('❌ Import error:', error);
      setImportError(error.message);
      alert('❌ Import Failed\n\n' + error.message);
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
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Import Failed</p>
              <p className="text-sm text-red-700 whitespace-pre-wrap">{importError}</p>
            </div>
          </div>
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
            <Card key={review.id} className="p-6 hover:shadow-lg transition-shadow">
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
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Auto-Imported</Badge>
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
                    <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : null}
                  {review.source === 'manual' ? (
                    <button type="button" onClick={() => handleDeleteReview(review.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed">{review.reviewText}</p>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filterFiveStarOnly ? 'No 5-Star Reviews Yet' : 'No Reviews Yet'}
            </h3>
            <p className="text-slate-600 mb-4">Import reviews automatically or add them manually</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleImportGoogleReviews} variant="outline" disabled={isImporting}>
                <Download className="w-4 h-4 mr-2" />
                Smart Import
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Manually
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h4 className="font-semibold text-slate-900 mb-3">🚀 Smart Import Technology</h4>
        <p className="text-sm text-slate-700 mb-3">
          Our system uses 5 advanced strategies to find your reviews:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span><strong>URL Analysis:</strong> Handles all Google Maps URL formats</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span><strong>Phone Search:</strong> Finds listings by phone number</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span><strong>Address Match:</strong> Locates by business address</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span><strong>Name Search:</strong> Discovers by business name</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">5.</span>
            <span><strong>Nearby Scan:</strong> Checks nearby locations</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Auto-Dedupe:</strong> Skips duplicate reviews</span>
          </div>
        </div>
      </Card>
    </div>
  );
}