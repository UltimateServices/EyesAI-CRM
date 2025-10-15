'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useHydration } from '@/hooks/useHydration';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, X, ExternalLink, Filter, Calendar, Download, Loader2, AlertCircle, ArrowUpDown } from 'lucide-react';

interface ReviewsProps {
  company: Company;
}

export function Reviews({ company }: ReviewsProps) {
  const hydrated = useHydration();
  const allReviews = useStore((state) => state.reviews);
  const fetchReviews = useStore((state) => state.fetchReviews);
  const addReview = useStore((state) => state.addReview);
  const deleteReview = useStore((state) => state.deleteReview);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const saveIntake = useStore((state) => state.saveIntake);
  const intake = getIntakeByCompanyId(company.id);
  
  // Filter reviews for this company only
  const reviews = allReviews.filter(r => r.companyId === company.id);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterFiveStarOnly, setFilterFiveStarOnly] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [formData, setFormData] = useState({
    rating: 5 as 1 | 2 | 3 | 4 | 5,
    reviewerName: '',
    reviewText: '',
    reviewDate: new Date().toISOString().split('T')[0],
    platform: 'Google' as 'Google' | 'Yelp' | 'Facebook' | 'TripAdvisor' | 'Other',
    reviewUrl: '',
  });

  // Fetch reviews on mount
  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      await fetchReviews();
      setLoading(false);
    };
    loadReviews();
  }, [fetchReviews]);

  // Wait for hydration to complete
  if (!hydrated || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleAddReview = async () => {
    if (!formData.reviewerName.trim() || !formData.reviewText.trim()) {
      alert('Please fill in reviewer name and review text');
      return;
    }

    await addReview({
      companyId: company.id,
      rating: formData.rating,
      reviewerName: formData.reviewerName.trim(),
      reviewText: formData.reviewText.trim(),
      reviewDate: formData.reviewDate,
      platform: formData.platform,
      reviewUrl: formData.reviewUrl.trim() || '',
      response: '',
      responseDate: '',
    });

    setFormData({
      rating: 5,
      reviewerName: '',
      reviewText: '',
      reviewDate: new Date().toISOString().split('T')[0],
      platform: 'Google',
      reviewUrl: '',
    });
    
    setShowAddForm(false);
    alert('✅ Review added successfully!');
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      await deleteReview(reviewId);
      alert('✅ Review deleted!');
    }
  };

  const handleImportGoogleReviews = async () => {
    setIsImporting(true);
    setImportError('');

    try {
      console.log('🚀 Starting import for:', company.name);

      const response = await fetch('/api/import-reviews-complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: company.id,
          companyName: company.name,
          existingUrls: {
            google: intake?.googleMapsLink1 || null,
            yelp: intake?.yelpUrl || null,
            facebook: intake?.facebookUrl || null,
          },
          companyDetails: {
            address: intake?.physicalAddress || company.address || '',
            phone: intake?.mainPhone || company.phone || '',
            website: intake?.website || company.website || '',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream complete');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              try {
                const data = JSON.parse(jsonStr);

                if (data.searchLog) {
                  console.log(data.searchLog);
                }
                
                if (data.complete && data.reviews) {
                  console.log('Import complete! Converting reviews...', data.reviews);
                  
                  const existingTexts = new Set(reviews.map(r => r.reviewText.toLowerCase().trim()));
                  let importedCount = 0;

                  // Add each new review to Supabase
                  for (const r of data.reviews) {
                    if (!existingTexts.has(r.text.toLowerCase().trim())) {
                      await addReview({
                        companyId: company.id,
                        rating: r.rating as 1 | 2 | 3 | 4 | 5,
                        reviewerName: r.author,
                        reviewText: r.text,
                        reviewDate: r.date,
                        platform: (r.platform.charAt(0).toUpperCase() + r.platform.slice(1)) as 'Google' | 'Yelp' | 'Facebook',
                        reviewUrl: r.url || '',
                        response: '',
                        responseDate: '',
                      });
                      importedCount++;
                    }
                  }

                  // Update intake with found URLs
                  if (data.foundUrls && intake) {
                    await saveIntake({
                      ...intake,
                      googleMapsLink1: data.foundUrls.google || intake.googleMapsLink1,
                      yelpUrl: data.foundUrls.yelp || intake.yelpUrl,
                      facebookUrl: data.foundUrls.facebook || intake.facebookUrl,
                      updatedAt: new Date().toISOString(),
                    });
                  }

                  // Refresh reviews to update UI
                  await fetchReviews();

                  if (importedCount === 0) {
                    alert('ℹ️ No new reviews to import.\n\nAll reviews are already in the system.');
                  } else {
                    alert(`🎉 Successfully imported ${importedCount} new reviews!\n\n` +
                          `✓ Google: ${data.reviews.filter((r: any) => r.platform === 'google').length}\n` +
                          `✓ Yelp: ${data.reviews.filter((r: any) => r.platform === 'yelp').length}\n` +
                          `✓ Facebook: ${data.reviews.filter((r: any) => r.platform === 'facebook').length}`);
                  }
                }
              } catch (parseError) {
                console.error('Parse error:', parseError);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Import error:', error);
      setImportError(error.message);
      alert('❌ Import Failed\n\n' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Filter and sort reviews
  const filteredReviews = filterFiveStarOnly ? reviews.filter(r => r.rating === 5) : reviews;
  
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const dateA = new Date(a.reviewDate).getTime();
    const dateB = new Date(b.reviewDate).getTime();
    
    if (sortOrder === 'newest') {
      return dateB - dateA; // Newest first
    } else {
      return dateA - dateB; // Oldest first
    }
  });

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
                  Smart Import
                </>
              )}
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Manually
            </Button>
          </div>
        </div>
      </Card>

      {importError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Import Failed</p>
              <p className="text-sm text-red-700 whitespace-pre-wrap">{importError}</p>
            </div>
          </div>
        </Card>
      )}

      {showAddForm && (
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
              <input type="date" value={formData.reviewDate} onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
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
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Sort:</span>
            <div className="flex gap-2">
              <Button 
                variant={sortOrder === 'newest' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setSortOrder('newest')}
              >
                Newest First
              </Button>
              <Button 
                variant={sortOrder === 'oldest' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setSortOrder('oldest')}
              >
                Oldest First
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => (
            <Card key={review.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {(review.reviewerName || 'Unknown').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{review.reviewerName || 'Unknown'}</h4>
                      <Badge variant="secondary" className="text-xs">{review.platform}</Badge>
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
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {review.reviewUrl && (
                    <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button type="button" onClick={() => handleDeleteReview(review.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
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
        <h4 className="font-semibold text-slate-900 mb-3">🚀 Hybrid Import Technology</h4>
        <p className="text-sm text-slate-700 mb-3">
          Our system uses premium Apify for Google reviews and free Serper scraping for Yelp/Facebook.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">✓</span>
            <span><strong>Premium Google:</strong> 20 newest reviews via Apify</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">✓</span>
            <span><strong>Free Yelp:</strong> 10 reviews via Serper</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">✓</span>
            <span><strong>Free Facebook:</strong> 10 reviews via Serper</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Auto-Dedupe:</strong> Skips duplicate reviews</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <p className="text-xs text-slate-600">
            <strong>💰 Cost:</strong> ~$0.015 per company (1.5 cents!) for all 3 platforms
          </p>
        </div>
      </Card>
    </div>
  );
}