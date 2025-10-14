import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { companyId, companyName, googleMapsUrl, yelpUrl, facebookUrl } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: '🔍 Searching for business...' 
        })}\n\n`));
        
        if (!GOOGLE_PLACES_API_KEY) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: '❌ Google Places API key missing',
            error: true 
          })}\n\n`));
          controller.close();
          return;
        }

        // Try multiple methods to find the place
        let placeId = null;
        
        // Method 1: Extract from URL
        if (googleMapsUrl) {
          placeId = extractPlaceIdFromUrl(googleMapsUrl);
        }
        
        // Method 2: Search by business name
        if (!placeId) {
          placeId = await searchByText(companyName);
        }
        
        if (!placeId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: '❌ Could not find business on Google',
            error: true 
          })}\n\n`));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: '✅ Found business! Fetching reviews...' 
        })}\n\n`));

        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,reviews,rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(placeDetailsUrl);
        const data = await response.json();

        if (data.status !== 'OK') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: `❌ Google API Error: ${data.status}`,
            error: true 
          })}\n\n`));
          controller.close();
          return;
        }

        const placeDetails = data.result;
        const allReviews = placeDetails.reviews || [];

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: `📊 Found ${allReviews.length} reviews!` 
        })}\n\n`));

        const reviews = allReviews.map((review: any) => ({
          author: review.author_name,
          rating: review.rating,
          text: review.text,
          date: new Date(review.time * 1000).toISOString().split('T')[0],
          platform: 'google',
          url: review.author_url
        }));

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: '💾 Saving to database...' 
        })}\n\n`));

        // Ensure company exists
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('id', companyId)
          .single();

        if (!existingCompany) {
          await supabase.from('companies').insert({
            id: companyId,
            name: companyName,
            google_maps_url: googleMapsUrl,
            yelp_url: yelpUrl,
            facebook_url: facebookUrl
          });
        }

        // Delete old reviews and insert new ones
        await supabase.from('reviews').delete().eq('company_id', companyId);

        if (reviews.length > 0) {
          const reviewsToInsert = reviews.map((review: any) => ({
            company_id: companyId,
            author: review.author,
            rating: review.rating,
            text: review.text,
            date: review.date,
            platform: review.platform,
            url: review.url
          }));

          const { error } = await supabase.from('reviews').insert(reviewsToInsert);
          
          if (error) {
            console.error('DB error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              status: '❌ Database error',
              error: true 
            })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              status: `✅ Imported ${reviews.length} reviews successfully!`,
              complete: true,
              count: reviews.length 
            })}\n\n`));
          }
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: '⚠️ No reviews found',
            complete: true,
            count: 0 
          })}\n\n`));
        }

        controller.close();
      } catch (error) {
        console.error('Error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: '❌ Import failed',
          error: true 
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function extractPlaceIdFromUrl(url: string): string | null {
  // Method 1: place_id parameter
  const placeIdParam = url.match(/place_id=([^&]+)/);
  if (placeIdParam) return placeIdParam[1];
  
  // Method 2: !1s format
  const placeId1s = url.match(/!1s([A-Za-z0-9_-]+)/);
  if (placeId1s) return placeId1s[1];
  
  // Method 3: /data=!4m format
  const placeIdData = url.match(/data=.*?!1s([A-Za-z0-9_-]+)/);
  if (placeIdData) return placeIdData[1];
  
  return null;
}

async function searchByText(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.candidates?.[0]) {
      return data.candidates[0].place_id;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}