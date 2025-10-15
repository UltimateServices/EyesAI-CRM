import { NextRequest } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { companyId, companyName, existingUrls, companyDetails } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sendLog = (message: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ searchLog: message })}\n\n`));
        };

        sendLog(`🚀 Starting smart import for ${companyName}`);

        const allReviews: any[] = [];
        const foundUrls: any = {
          google: existingUrls?.google || null,
          yelp: existingUrls?.yelp || null,
          facebook: existingUrls?.facebook || null,
        };

        // ===== GOOGLE REVIEWS - Use Google Places API =====
        if (GOOGLE_PLACES_API_KEY) {
          sendLog('🔍 Searching Google Places for reviews...');
          try {
            let placeId = null;

            // Try to get place ID from URL first
            if (existingUrls?.google) {
              // Check if it's a share.google link and expand it
              let googleUrl = existingUrls.google;
              
              if (googleUrl.includes('share.google') || googleUrl.includes('goo.gl') || googleUrl.includes('maps.app.goo.gl')) {
                sendLog('🔗 Expanding shortened Google link...');
                const expandedUrl = await expandShortenedUrl(googleUrl);
                if (expandedUrl) {
                  googleUrl = expandedUrl;
                  foundUrls.google = expandedUrl; // Update with full URL
                  sendLog(`✅ Expanded to: ${expandedUrl.substring(0, 80)}...`);
                }
              }
              
              placeId = extractPlaceIdFromUrl(googleUrl);
              if (placeId) sendLog('✅ Extracted Place ID from URL');
            }

            // If no place ID, try multiple search methods
            if (!placeId) {
              // Method 1: Search by name only
              sendLog('🔍 Method 1: Searching by business name...');
              placeId = await searchGooglePlaces(companyName);
              
              // Method 2: Search by name + address
              if (!placeId && companyDetails?.address) {
                sendLog('🔍 Method 2: Searching by name + address...');
                placeId = await searchGooglePlaces(`${companyName} ${companyDetails.address}`);
              }
              
              // Method 3: Search by name + phone
              if (!placeId && companyDetails?.phone) {
                sendLog('🔍 Method 3: Searching by name + phone...');
                placeId = await searchGooglePlaces(`${companyName} ${companyDetails.phone}`);
              }
              
              // Method 4: Search by name + city/state
              if (!placeId && companyDetails?.address) {
                const cityState = extractCityState(companyDetails.address);
                if (cityState) {
                  sendLog(`🔍 Method 4: Searching by name + ${cityState}...`);
                  placeId = await searchGooglePlaces(`${companyName} ${cityState}`);
                }
              }

              // Method 5: Search by website domain
              if (!placeId && companyDetails?.website) {
                const domain = extractDomain(companyDetails.website);
                if (domain) {
                  sendLog(`🔍 Method 5: Searching by domain ${domain}...`);
                  placeId = await searchGooglePlaces(`${domain}`);
                }
              }
            }

            if (placeId) {
              sendLog('✅ Found Google Place! Fetching reviews...');
              
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,reviews,rating,user_ratings_total,url,formatted_address,formatted_phone_number&key=${GOOGLE_PLACES_API_KEY}`;
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();

              if (detailsData.status === 'OK' && detailsData.result) {
                foundUrls.google = detailsData.result.url || foundUrls.google;
                
                if (detailsData.result.reviews) {
                  const googleReviews = detailsData.result.reviews.map((review: any) => ({
                    id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    author: review.author_name || 'Google User',
                    rating: review.rating || 5,
                    text: review.text || '',
                    date: review.time ? new Date(review.time * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    platform: 'google',
                    url: review.author_url || foundUrls.google,
                  }));

                  allReviews.push(...googleReviews);
                  sendLog(`📊 Found ${googleReviews.length} Google reviews`);
                  sendLog(`📍 Verified: ${detailsData.result.name} - ${detailsData.result.formatted_address}`);
                } else {
                  sendLog('⚠️ Google Place found but no reviews available');
                }
              }
            } else {
              sendLog('⚠️ Could not find Google Place after trying all search methods');
            }
          } catch (error: any) {
            sendLog(`⚠️ Google Places API error: ${error.message}`);
          }
        } else {
          sendLog('⚠️ Google Places API key not configured');
        }

        // ===== YELP & FACEBOOK REVIEWS - Use Serper API =====
        if (SERPER_API_KEY) {
          // Search Yelp with fallbacks
          sendLog('🔍 Searching Yelp for reviews...');
          try {
            let yelpQuery = `"${companyName}" site:yelp.com`;
            
            // Add location to query if available
            if (companyDetails?.address) {
              const cityState = extractCityState(companyDetails.address);
              if (cityState) {
                yelpQuery = `"${companyName}" ${cityState} site:yelp.com`;
              }
            }

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

              const yelpReviews = extractReviewsFromSearch(yelpData, 'yelp');
              allReviews.push(...yelpReviews);
              sendLog(`📊 Extracted ${yelpReviews.length} Yelp reviews`);
            } else {
              sendLog('⚠️ Could not find Yelp listing');
            }
          } catch (error) {
            sendLog('⚠️ Could not fetch Yelp reviews');
          }

          // Search Facebook with fallbacks
          sendLog('🔍 Searching Facebook for reviews...');
          try {
            let facebookQuery = `"${companyName}" site:facebook.com`;
            
            // Add location to query if available
            if (companyDetails?.address) {
              const cityState = extractCityState(companyDetails.address);
              if (cityState) {
                facebookQuery = `"${companyName}" ${cityState} site:facebook.com`;
              }
            }

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

              const facebookReviews = extractReviewsFromSearch(facebookData, 'facebook');
              allReviews.push(...facebookReviews);
              sendLog(`📊 Extracted ${facebookReviews.length} Facebook reviews`);
            } else {
              sendLog('⚠️ Could not find Facebook page');
            }
          } catch (error) {
            sendLog('⚠️ Could not fetch Facebook reviews');
          }
        } else {
          sendLog('⚠️ Serper API key not configured - skipping Yelp/Facebook');
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

async function expandShortenedUrl(shortUrl: string): Promise<string | null> {
  try {
    // Use HEAD request to follow redirects without downloading content
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
    });
    
    // Return the final URL after all redirects
    return response.url || null;
  } catch (error) {
    console.error('Error expanding URL:', error);
    return null;
  }
}

async function searchGooglePlaces(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData.status === 'OK' && searchData.candidates?.[0]) {
      return searchData.candidates[0].place_id;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function extractPlaceIdFromUrl(url: string): string | null {
  const placeIdParam = url.match(/place_id=([^&]+)/);
  if (placeIdParam) return placeIdParam[1];
  
  const placeId1s = url.match(/!1s([A-Za-z0-9_-]+)/);
  if (placeId1s) return placeId1s[1];
  
  const placeIdData = url.match(/data=.*?!1s([A-Za-z0-9_-]+)/);
  if (placeIdData) return placeIdData[1];
  
  return null;
}

function extractCityState(address: string): string | null {
  // Extract city and state from address
  // Format: "123 Main St, New York, NY 10001"
  const parts = address.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    // Get last two parts (city and state/zip)
    const cityState = parts.slice(-2).join(', ');
    return cityState;
  }
  
  return null;
}

function extractDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

function extractReviewsFromSearch(data: any, platform: string): any[] {
  const reviews: any[] = [];
  
  if (data.organic) {
    for (const result of data.organic) {
      if (result.snippet && result.snippet.length > 50) {
        const ratingMatch = result.snippet.match(/(\d)(?:\.\d)?\s*(?:star|★)/i);
        const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

        reviews.push({
          id: `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          author: extractAuthorName(result.snippet) || `${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
          rating: rating,
          text: cleanSnippet(result.snippet),
          date: extractDate(result.snippet) || new Date().toISOString().split('T')[0],
          platform: platform,
          url: result.link,
        });
      }
    }
  }

  return reviews.slice(0, 15);
}

function extractAuthorName(text: string): string | null {
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
  let cleaned = snippet
    .replace(/\d+\s*(?:star|★).*?(?:\.|$)/gi, '')
    .replace(/^.*?(?:said|wrote|reviewed):\s*/i, '')
    .replace(/^["""]|["""]$/g, '')
    .trim();

  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500) + '...';
  }

  return cleaned || snippet;
}