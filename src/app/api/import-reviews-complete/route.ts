import { NextRequest } from 'next/server';

const SERPER_API_KEY = process.env.SERPER_API_KEY;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { companyId, companyName, existingUrls } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sendLog = (message: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ searchLog: message })}\n\n`));
        };

        sendLog(`🚀 Starting smart import for ${companyName}`);

        if (!SERPER_API_KEY) {
          sendLog('❌ SERPER_API_KEY not configured');
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            complete: true, 
            reviews: [], 
            error: 'API key not configured' 
          })}\n\n`));
          controller.close();
          return;
        }

        const allReviews: any[] = [];
        const foundUrls: any = {
          google: existingUrls?.google || null,
          yelp: existingUrls?.yelp || null,
          facebook: existingUrls?.facebook || null,
        };

        // Search Google Reviews
        sendLog('🔍 Searching Google for reviews...');
        try {
          const googleQuery = existingUrls?.google 
            ? `site:google.com/maps "${companyName}" reviews`
            : `"${companyName}" site:google.com/maps reviews`;

          const googleResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: googleQuery,
              num: 10,
            }),
          });

          const googleData = await googleResponse.json();
          
          if (googleData.organic?.[0]?.link) {
            foundUrls.google = googleData.organic[0].link;
            sendLog(`✅ Found Google Maps listing`);

            // Extract reviews from snippets
            const googleReviews = extractGoogleReviews(googleData, companyName);
            allReviews.push(...googleReviews);
            sendLog(`📊 Extracted ${googleReviews.length} Google reviews from search results`);
          }
        } catch (error) {
          sendLog('⚠️ Could not fetch Google reviews');
        }

        // Search Yelp Reviews
        sendLog('🔍 Searching Yelp for reviews...');
        try {
          const yelpQuery = existingUrls?.yelp
            ? `site:yelp.com "${companyName}" reviews`
            : `"${companyName}" site:yelp.com reviews`;

          const yelpResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: yelpQuery,
              num: 10,
            }),
          });

          const yelpData = await yelpResponse.json();
          
          if (yelpData.organic?.[0]?.link) {
            foundUrls.yelp = yelpData.organic[0].link;
            sendLog(`✅ Found Yelp listing`);

            const yelpReviews = extractYelpReviews(yelpData, companyName);
            allReviews.push(...yelpReviews);
            sendLog(`📊 Extracted ${yelpReviews.length} Yelp reviews from search results`);
          }
        } catch (error) {
          sendLog('⚠️ Could not fetch Yelp reviews');
        }

        // Search Facebook Reviews
        sendLog('🔍 Searching Facebook for reviews...');
        try {
          const facebookQuery = existingUrls?.facebook
            ? `site:facebook.com "${companyName}" reviews`
            : `"${companyName}" site:facebook.com reviews`;

          const facebookResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: facebookQuery,
              num: 10,
            }),
          });

          const facebookData = await facebookResponse.json();
          
          if (facebookData.organic?.[0]?.link) {
            foundUrls.facebook = facebookData.organic[0].link;
            sendLog(`✅ Found Facebook page`);

            const facebookReviews = extractFacebookReviews(facebookData, companyName);
            allReviews.push(...facebookReviews);
            sendLog(`📊 Extracted ${facebookReviews.length} Facebook reviews from search results`);
          }
        } catch (error) {
          sendLog('⚠️ Could not fetch Facebook reviews');
        }

        sendLog(`🎉 Import complete! Found ${allReviews.length} total reviews`);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          complete: true,
          reviews: allReviews,
          foundUrls: foundUrls,
        })}\n\n`));

        controller.close();
      } catch (error: any) {
        console.error('Import error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          complete: true,
          reviews: [],
          error: error.message,
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

function extractGoogleReviews(data: any, companyName: string): any[] {
  const reviews: any[] = [];
  
  // Extract from organic results
  if (data.organic) {
    for (const result of data.organic) {
      if (result.snippet && result.snippet.length > 50) {
        // Try to extract rating from snippet
        const ratingMatch = result.snippet.match(/(\d)(?:\.\d)?\s*(?:star|★)/i);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

        reviews.push({
          id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          author: extractAuthorName(result.snippet) || 'Google User',
          rating: rating,
          text: cleanSnippet(result.snippet),
          date: extractDate(result.snippet) || new Date().toISOString().split('T')[0],
          platform: 'google',
          url: result.link,
        });
      }
    }
  }

  // Extract from reviews section
  if (data.reviews) {
    for (const review of data.reviews) {
      reviews.push({
        id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        author: review.author || 'Google User',
        rating: review.rating || 5,
        text: review.snippet || review.text || '',
        date: review.date || new Date().toISOString().split('T')[0],
        platform: 'google',
        url: review.link || '',
      });
    }
  }

  return reviews.slice(0, 20); // Limit to 20 reviews
}

function extractYelpReviews(data: any, companyName: string): any[] {
  const reviews: any[] = [];
  
  if (data.organic) {
    for (const result of data.organic) {
      if (result.snippet && result.snippet.length > 50) {
        const ratingMatch = result.snippet.match(/(\d)(?:\.\d)?\s*star/i);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

        reviews.push({
          id: `yelp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          author: extractAuthorName(result.snippet) || 'Yelp User',
          rating: rating,
          text: cleanSnippet(result.snippet),
          date: extractDate(result.snippet) || new Date().toISOString().split('T')[0],
          platform: 'yelp',
          url: result.link,
        });
      }
    }
  }

  return reviews.slice(0, 20);
}

function extractFacebookReviews(data: any, companyName: string): any[] {
  const reviews: any[] = [];
  
  if (data.organic) {
    for (const result of data.organic) {
      if (result.snippet && result.snippet.length > 50) {
        const ratingMatch = result.snippet.match(/(\d)(?:\.\d)?\s*(?:star|★)/i);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

        reviews.push({
          id: `facebook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          author: extractAuthorName(result.snippet) || 'Facebook User',
          rating: rating,
          text: cleanSnippet(result.snippet),
          date: extractDate(result.snippet) || new Date().toISOString().split('T')[0],
          platform: 'facebook',
          url: result.link,
        });
      }
    }
  }

  return reviews.slice(0, 20);
}

function extractAuthorName(text: string): string | null {
  // Try to extract name patterns
  const patterns = [
    /(?:by|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|wrote|reviewed)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractDate(text: string): string | null {
  // Try to extract date patterns
  const patterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\w+\s+\d{1,2},\s+\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

function cleanSnippet(snippet: string): string {
  // Remove common patterns
  let cleaned = snippet
    .replace(/\d+\s*(?:star|★).*?(?:\.|$)/gi, '')
    .replace(/^.*?(?:said|wrote|reviewed):\s*/i, '')
    .replace(/^["""]|["""]$/g, '')
    .trim();

  // Limit length
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500) + '...';
  }

  return cleaned || snippet;
}