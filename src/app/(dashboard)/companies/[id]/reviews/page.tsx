'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  platform: string;
}

export default function ReviewsPage() {
  const params = useParams();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadData();
  }, [companyId]);

  async function loadData() {
    console.log('LOADING COMPANY:', companyId);
    
    const { data: comp } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    console.log('COMPANY:', comp);
    if (comp) setCompany(comp);

    const { data: revs } = await supabase
      .from('reviews')
      .select('*')
      .eq('company_id', companyId);
    
    console.log('REVIEWS:', revs);
    if (revs) setReviews(revs);
    
    setLoading(false);
  }

  async function handleImport() {
    if (!company) return;
    setImporting(true);

    const res = await fetch('/api/import-reviews-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: company.id,
        companyName: company.name,
        googleMapsUrl: company.google_maps_url,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.status) setStatus(data.status);
          if (data.complete) {
            await loadData();
            setTimeout(() => {
              setImporting(false);
              setStatus('');
            }, 2000);
          }
        }
      }
    }
  }

  if (loading) {
    return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">{company?.name} - Reviews</h1>
        <Button onClick={handleImport} disabled={importing}>
          {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {importing ? status || 'Importing...' : 'Smart Import'}
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <p>No reviews yet. Click Smart Import!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Showing {reviews.length} reviews</p>
          {reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex justify-between mb-2">
                <div className="font-semibold">{r.author}</div>
                <Badge>{r.platform}</Badge>
              </div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-sm">{r.text}</p>
              <p className="text-xs text-gray-500 mt-2">{r.date}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}