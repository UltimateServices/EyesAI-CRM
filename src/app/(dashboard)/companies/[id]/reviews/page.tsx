'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Download, ExternalLink, Loader2 } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  platform: 'google' | 'yelp' | 'facebook';
  url?: string;
}

interface Company {
  id: string;
  name: string;
  googleMapsUrl?: string;
  yelpUrl?: string;
  facebookUrl?: string;
  reviews?: Review[];
}

export default function ReviewsPage() {
  const params = useParams();
  const companyId = params.id as string;
  
  const companies = useStore((state) => state.companies);
  const updateCompany = useStore((state) => state.updateCompany);
  const company = companies.find(c => c.id === companyId);
  
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [searchLog, setSearchLog] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!company) {
    return <div className="p-8 text-center">Company not found</div>;
  }

  const handleImportReviews = async () => {
    if (!company) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportStatus('Starting AI search for review links...');
    setSearchLog([]);

    try {
      console.log('Starting import for company:', company.name);
      
      const response = await fetch('/api/import-reviews-complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: company.id,
          companyName: company.name,
          existingUrls: {
            google: company.googleMapsUrl || null,
            yelp: company.yelpUrl || null,
            facebook: company.facebookUrl || null,
          },
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

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
        console.log('Received chunk:', chunk);
        
        buffer += chunk;
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          console.log('Processing line:', line);
          
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            console.log('JSON string to parse:', jsonStr);
            
            if (jsonStr) {
              try {
                const data = JSON.parse(jsonStr);
                console.log('Parsed data:', data);

                if (data.progress !== undefined) setImportProgress(data.progress);
                if (data.status) setImportStatus(data.status);
                if (data.searchLog) setSearchLog(prev => [...prev, data.searchLog]);
                if (data.complete) {
                  setImportStatus('Import complete!');
                  
                  if (data.reviews && data.foundUrls) {
                    console.log('Saving to store:', data.reviews.length, 'reviews');
                    updateCompany(company.id, {
                      reviews: data.reviews,
                      googleMapsUrl: data.foundUrls.google || company.googleMapsUrl,
                      yelpUrl: data.foundUrls.yelp || company.yelpUrl,
                      facebookUrl: data.foundUrls.facebook || company.facebookUrl,
                    });
                  }
                  
                  setTimeout(() => setDialogOpen(false), 2000);
                }
              } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.error('Failed to parse:', jsonStr);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const reviews = company?.reviews || [];
  const googleReviews = reviews.filter(r => r.platform === 'google');
  const yelpReviews = reviews.filter(r => r.platform === 'yelp');
  const facebookReviews = reviews.filter(r => r.platform === 'facebook');

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderReviewCard = (review: Review) => (
    <Card key={review.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold">{review.author}</div>
            <div className="text-sm text-muted-foreground">{review.date}</div>
          </div>
          <div className="flex items-center gap-2">
            {renderStars(review.rating)}
            <Badge variant={review.platform === 'google' ? 'default' : review.platform === 'yelp' ? 'destructive' : 'secondary'}>
              {review.platform}
            </Badge>
          </div>
        </div>
        <p className="text-sm">{review.text}</p>
        {review.url && (
          <Button variant="link" size="sm" className="mt-2 p-0 h-auto" asChild>
            <a href={review.url} target="_blank" rel="noopener noreferrer">
              View on {review.platform} <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{company?.name} - Reviews</h1>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Import Reviews
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Reviews from All Platforms</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!isImporting && (
                  <>
                    <div className="text-sm text-muted-foreground">
                      This will use AI to search for review links across Google, Yelp, and Facebook, then import all available reviews.
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Current Review Links:</div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <div>Google: {company?.googleMapsUrl || 'Not set - AI will search'}</div>
                        <div>Yelp: {company?.yelpUrl || 'Not set - AI will search'}</div>
                        <div>Facebook: {company?.facebookUrl || 'Not set - AI will search'}</div>
                      </div>
                    </div>
                    <Button onClick={handleImportReviews} className="w-full">
                      Start AI Import
                    </Button>
                  </>
                )}
                
                {isImporting && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{importStatus}</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} />
                    </div>
                    
                    {searchLog.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">AI Search Log:</div>
                        <div className="bg-muted p-3 rounded-md text-xs space-y-1 max-h-48 overflow-y-auto">
                          {searchLog.map((log, i) => (
                            <div key={i}>{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Google Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{googleReviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Yelp Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yelpReviews.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="google">Google ({googleReviews.length})</TabsTrigger>
          <TabsTrigger value="yelp">Yelp ({yelpReviews.length})</TabsTrigger>
          <TabsTrigger value="facebook">Facebook ({facebookReviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No reviews yet. Import reviews to get started.
              </CardContent>
            </Card>
          ) : (
            reviews.map(renderReviewCard)
          )}
        </TabsContent>

        <TabsContent value="google" className="mt-6">
          {googleReviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No Google reviews yet.
              </CardContent>
            </Card>
          ) : (
            googleReviews.map(renderReviewCard)
          )}
        </TabsContent>

        <TabsContent value="yelp" className="mt-6">
          {yelpReviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No Yelp reviews yet.
              </CardContent>
            </Card>
          ) : (
            yelpReviews.map(renderReviewCard)
          )}
        </TabsContent>

        <TabsContent value="facebook" className="mt-6">
          {facebookReviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No Facebook reviews yet.
              </CardContent>
            </Card>
          ) : (
            facebookReviews.map(renderReviewCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}