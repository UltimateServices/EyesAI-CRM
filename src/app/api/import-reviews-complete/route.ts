import { NextRequest } from 'next/server';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  platform: string;
  url: string;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { companyId, companyName, existingUrls, companyDetails } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (message: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ searchLog: message })}\n\n`));
      };

      try {
        sendLog(`🚀 Starting Smart Import for: ${companyName}`);

        const allReviews: Review[] = [];
        const foundUrls: any = {
          google: null,
          yelp: null,
          facebook: null,
        };

        if (!SERPER_API_KEY) {
          sendLog('❌ SERPER_API_KEY not found!');
          throw new Error('Serper API key not configured. Please add SERPER_API_KEY to .env.local');
        }

        sendLog(`✅ Serper API key detected`);

        // ========================================
        // GOOGLE - Just search like a human would
        // ========================================
        sendLog('');
        sendLog('🔍 GOOGLE: Searching...');
        
        const googleSearchQuery = `${companyName} ${companyDetails?.address || ''} Google Maps`.trim();
        sendLog(`   Query: "${googleSearchQuery}"`);

        try {
          const googleSearch = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: googleSearchQuery,
              num: 10,
            }),
          });

          if (!googleSearch.ok) {
            throw new Error(`Serper returned ${googleSearch.status}`);
          }

          const googleData = await googleSearch.json();
          sendLog(`   ✓ Serper response received`);

          // Find Google Maps URL
          let googleMapsUrl = null;
          if (googleData.organic) {
            for (const result of googleData.organic) {
              if (result.link && (result.link.includes('google.com/maps') || result.link.includes('maps.google.com'))) {
                googleMapsUrl = result.link;
                foundUrls.google = googleMapsUrl;
                sendLog(`   ✅ Found Google Maps URL!`);
                break;
              }
            }
          }

          // If we have a Google Maps URL, try to get reviews via Places API
          if (googleMapsUrl) {
            const placeId = extractPlaceId(googleMapsUrl);
            
            if (placeId && GOOGLE_PLACES_API_KEY) {
              sendLog(`   🔑 Extracted Place ID, fetching reviews...`);
              
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,reviews,rating,user_ratings_total,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();

              if (detailsData.status === 'OK' && detailsData.result?.reviews) {
                sendLog(`   ✅ ${detailsData.result.name}`);
                sendLog(`   ✅ ${detailsData.result.formatted_address}`);
                sendLog(`   ✅ Found ${detailsData.result.reviews.length} reviews via Places API`);

                const googleReviews = detailsData.result.reviews.map((review: any) => ({
                  id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  author: review.author_name || 'Google User',
                  rating: review.rating || 5,
                  text: review.text || '',
                  date: review.time ? new Date(review.time * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  platform: 'google',
                  url: googleMapsUrl,
                }));

                allReviews.push(...googleReviews);
              } else {
                sendLog(`   ⚠️ Places API: ${detailsData.status}`);
              }
            }
          }

          // Scrape reviews from search results as backup
          if (allReviews.filter(r => r.platform === 'google').length === 0) {
            sendLog(`   🌐 Extracting reviews from search results...`);
            const scrapedReviews = extractReviewsFromSerper(googleData, 'google', googleMapsUrl);
            if (scrapedReviews.length > 0) {
              allReviews.push(...scrapedReviews);
              sendLog(`   ✅ Extracted ${scrapedReviews.length} reviews from snippets`);
            }
          }

        } catch (error: any) {
          sendLog(`   ❌ Error: ${error.message}`);
        }

        // ========================================
        // YELP - Search like a human
        // ========================================
        sendLog('');
        sendLog('🔍 YELP: Searching...');
        
        const cityState = companyDetails?.address ? extractCityState(companyDetails.address) : '';
        const yelpSearchQuery = `${companyName} ${cityState} Yelp`.trim();
        sendLog(`   Query: "${yelpSearchQuery}"`);

        try {
          const yelpSearch = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: yelpSearchQuery,
              num: 10,
            }),
          });

          const yelpData = await yelpSearch.json();

          // Find Yelp URL
          if (yelpData.organic) {
            for (const result of yelpData.organic) {
              if (result.link && result.link.includes('yelp.com')) {
                foundUrls.yelp = result.link;
                sendLog(`   ✅ Found Yelp URL!`);
                break;
              }
            }
          }

          // Extract reviews
          const yelpReviews = extractReviewsFromSerper(yelpData, 'yelp', foundUrls.yelp);
          if (yelpReviews.length > 0) {
            allReviews.push(...yelpReviews);
            sendLog(`   ✅ Extracted ${yelpReviews.length} reviews`);
          } else {
            sendLog(`   ⚠️ No reviews found`);
          }

        } catch (error: any) {
          sendLog(`   ❌ Error: ${error.message}`);
        }

        // ========================================
        // FACEBOOK - Search like a human
        // ========================================
        sendLog('');
        sendLog('🔍 FACEBOOK: Searching...');
        
        const fbSearchQuery = `${companyName} ${cityState} Facebook`.trim();
        sendLog(`   Query: "${fbSearchQuery}"`);

        try {
          const fbSearch = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: fbSearchQuery,
              num: 10,
            }),
          });

          const fbData = await fbSearch.json();

          // Find Facebook URL
          if (fbData.organic) {
            for (const result of fbData.organic) {
              if (result.link && result.link.includes('facebook.com')) {
                foundUrls.facebook = result.link;
                sendLog(`   ✅ Found Facebook URL!`);
                break;
              }
            }
          }

          // Extract reviews
          const fbReviews = extractReviewsFromSerper(fbData, 'facebook', foundUrls.facebook);
          if (fbReviews.length > 0) {
            allReviews.push(...fbReviews);
            sendLog(`   ✅ Extracted ${fbReviews.length} reviews`);
          } else {
            sendLog(`   ⚠️ No reviews found`);
          }

        } catch (error: any) {
          sendLog(`   ❌ Error: ${error.message}`);
        }

        // ========================================
        // RESULTS
        // ========================================
        sendLog('');
        sendLog('═══════════════════════════════════');
        sendLog('🎉 IMPORT COMPLETE');
        sendLog('═══════════════════════════════════');
        sendLog(`📊 Total: ${allReviews.length} reviews`);
        sendLog(`   - Google: ${allReviews.filter(r => r.platform === 'google').length}`);
        sendLog(`   - Yelp: ${allReviews.filter(r => r.platform === 'yelp').length}`);
        sendLog(`   - Facebook: ${allReviews.filter(r => r.platform === 'facebook').length}`);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          complete: true,
          reviews: allReviews,
          foundUrls: foundUrls,
        })}\n\n`));

        controller.close();
      } catch (error: any) {
        sendLog(`❌ FATAL ERROR: ${error.message}`);
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

function extractPlaceId(url: string): string | null {
  const patterns = [
    /place_id=([A-Za-z0-9_-]+)/,
    /!1s([A-Za-z0-9_-]+)(?:!|$)/,
    /ftid=([A-Za-z0-9_:]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractReviewsFromSerper(data: any, platform: string, url: string | null): Review[] {
  const reviews: Review[] = [];

  // Check knowledge graph
  if (data.knowledgeGraph?.reviews) {
    for (const review of data.knowledgeGraph.reviews) {
      reviews.push({
        id: `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        author: review.author || `${capitalize(platform)} User`,
        rating: review.rating || 5,
        text: review.snippet || review.text || '',
        date: review.date || new Date().toISOString().split('T')[0],
        platform: platform,
        url: url || '',
      });
    }
  }

  // Extract from organic results
  if (data.organic) {
    for (const result of data.organic) {
      if (result.snippet && result.snippet.length > 50) {
        const ratingMatch = result.snippet.match(/(\d)(?:\.\d)?\s*(?:star|★|stars)/i);
        
        if (ratingMatch) {
          const rating = parseInt(ratingMatch[1]);
          const text = cleanReviewText(result.snippet);
          
          if (text.length > 30) {
            reviews.push({
              id: `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              author: extractAuthorName(result.snippet) || `${capitalize(platform)} User`,
              rating: rating,
              text: text,
              date: extractDate(result.snippet) || new Date().toISOString().split('T')[0],
              platform: platform,
              url: url || result.link,
            });
          }
        }
      }
    }
  }

  return reviews.slice(0, 20);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function extractCityState(address: string): string {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  return '';
}

function extractAuthorName(text: string): string | null {
  const patterns = [
    /(?:by|from|—)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?)/,
    /^([A-Z][a-z]+(?:\s+[A-Z]\.?)?)\s+(?:said|wrote|reviewed|says)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractDate(text: string): string | null {
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

  return new Date().toISOString().split('T')[0];
}

function cleanReviewText(text: string): string {
  let cleaned = text
    .replace(/\d+\s*(?:star|★|stars).*?(?:\.|$)/gi, '')
    .replace(/^.*?(?:said|wrote|reviewed|says):\s*/i, '')
    .replace(/Rating:\s*\d+/gi, '')
    .replace(/^["""]|["""]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 497) + '...';
  }

  return cleaned;
}