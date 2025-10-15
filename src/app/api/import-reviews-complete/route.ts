import { NextRequest } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

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
        sendLog(`📋 Data: ${companyDetails?.address || 'No address'}, ${companyDetails?.phone || 'No phone'}`);

        const allReviews: Review[] = [];
        const foundUrls: any = {
          google: existingUrls?.google || null,
          yelp: existingUrls?.yelp || null,
          facebook: existingUrls?.facebook || null,
        };

        // ========================================
        // GOOGLE REVIEWS - Multi-Method Approach
        // ========================================
        sendLog('');
        sendLog('═══════════════════════════════════');
        sendLog('📍 GOOGLE MAPS SEARCH');
        sendLog('═══════════════════════════════════');

        const googleReviews = await fetchGoogleReviews(
          companyName,
          companyDetails,
          existingUrls?.google,
          sendLog
        );

        if (googleReviews.reviews.length > 0) {
          allReviews.push(...googleReviews.reviews);
          foundUrls.google = googleReviews.url;
          sendLog(`✅ SUCCESS: Found ${googleReviews.reviews.length} Google reviews`);
        } else {
          sendLog(`⚠️ No Google reviews found`);
        }

        // ========================================
        // YELP REVIEWS - Serper Search
        // ========================================
        if (SERPER_API_KEY) {
          sendLog('');
          sendLog('═══════════════════════════════════');
          sendLog('📍 YELP SEARCH');
          sendLog('═══════════════════════════════════');

          const yelpReviews = await fetchYelpReviews(
            companyName,
            companyDetails,
            sendLog
          );

          if (yelpReviews.reviews.length > 0) {
            allReviews.push(...yelpReviews.reviews);
            foundUrls.yelp = yelpReviews.url;
            sendLog(`✅ SUCCESS: Found ${yelpReviews.reviews.length} Yelp reviews`);
          } else {
            sendLog(`⚠️ No Yelp reviews found`);
          }
        }

        // ========================================
        // FACEBOOK REVIEWS - Serper Search
        // ========================================
        if (SERPER_API_KEY) {
          sendLog('');
          sendLog('═══════════════════════════════════');
          sendLog('📍 FACEBOOK SEARCH');
          sendLog('═══════════════════════════════════');

          const facebookReviews = await fetchFacebookReviews(
            companyName,
            companyDetails,
            sendLog
          );

          if (facebookReviews.reviews.length > 0) {
            allReviews.push(...facebookReviews.reviews);
            foundUrls.facebook = facebookReviews.url;
            sendLog(`✅ SUCCESS: Found ${facebookReviews.reviews.length} Facebook reviews`);
          } else {
            sendLog(`⚠️ No Facebook reviews found`);
          }
        }

        // ========================================
        // FINAL RESULTS
        // ========================================
        sendLog('');
        sendLog('═══════════════════════════════════');
        sendLog('🎉 IMPORT COMPLETE');
        sendLog('═══════════════════════════════════');
        sendLog(`📊 Total Reviews Found: ${allReviews.length}`);
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
        sendLog(`❌ CRITICAL ERROR: ${error.message}`);
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

// ========================================
// GOOGLE REVIEWS FETCHER
// ========================================
async function fetchGoogleReviews(
  companyName: string,
  companyDetails: any,
  existingUrl: string | null,
  sendLog: (msg: string) => void
): Promise<{ reviews: Review[]; url: string | null }> {
  
  let googleMapUrl = existingUrl;
  let placeId = null;

  // STEP 1: Handle existing URL
  if (googleMapUrl) {
    sendLog(`📎 Existing URL provided: ${googleMapUrl.substring(0, 60)}...`);

    // Expand share links
    if (googleMapUrl.includes('share.google') || googleMapUrl.includes('goo.gl') || googleMapUrl.includes('maps.app.goo.gl')) {
      sendLog('🔗 Expanding shortened link...');
      const expanded = await expandUrl(googleMapUrl);
      if (expanded && expanded !== googleMapUrl) {
        googleMapUrl = expanded;
        sendLog(`✅ Expanded to: ${expanded.substring(0, 60)}...`);
      } else {
        sendLog('⚠️ Could not expand link, using original');
      }
    }

    // Extract place_id
    placeId = extractPlaceId(googleMapUrl);
    if (placeId) {
      sendLog(`✅ Extracted Place ID: ${placeId}`);
    }
  }

  // STEP 2: Try Google Places API with place_id
  if (placeId && GOOGLE_PLACES_API_KEY) {
    sendLog('🔑 Method 1: Google Places API with Place ID...');
    const reviews = await getPlaceDetails(placeId, googleMapUrl, sendLog);
    if (reviews.length > 0) {
      return { reviews, url: googleMapUrl };
    }
  }

  // STEP 3: Try Google Places API Text Search with address
  if (GOOGLE_PLACES_API_KEY && companyDetails?.address) {
    sendLog('🔍 Method 2: Google Places Text Search (name + address)...');
    const searchQuery = `${companyName} ${companyDetails.address}`;
    placeId = await textSearchPlaces(searchQuery, sendLog);
    
    if (placeId) {
      const reviews = await getPlaceDetails(placeId, googleMapUrl, sendLog);
      if (reviews.length > 0) {
        return { reviews, url: googleMapUrl };
      }
    }
  }

  // STEP 4: Try Geocoding + Location-based search
  if (GOOGLE_PLACES_API_KEY && companyDetails?.address) {
    sendLog('🗺️ Method 3: Geocoding + Location-based search...');
    const coords = await geocodeAddress(companyDetails.address, sendLog);
    
    if (coords) {
      placeId = await nearbySearch(companyName, coords, sendLog);
      
      if (placeId) {
        const reviews = await getPlaceDetails(placeId, googleMapUrl, sendLog);
        if (reviews.length > 0) {
          return { reviews, url: googleMapUrl };
        }
      }
    }
  }

  // STEP 5: Try phone number search
  if (GOOGLE_PLACES_API_KEY && companyDetails?.phone) {
    sendLog('📞 Method 4: Phone number search...');
    placeId = await findPlaceByPhone(companyDetails.phone, sendLog);
    
    if (placeId) {
      const reviews = await getPlaceDetails(placeId, googleMapUrl, sendLog);
      if (reviews.length > 0) {
        return { reviews, url: googleMapUrl };
      }
    }
  }

  // STEP 6: Use Serper to search and scrape
  if (SERPER_API_KEY) {
    sendLog('🌐 Method 5: Serper web search...');
    
    const searchQuery = companyDetails?.address
      ? `"${companyName}" ${companyDetails.address} site:google.com/maps`
      : `"${companyName}" site:google.com/maps`;
    
    sendLog(`   Query: ${searchQuery}`);
    
    const serperResults = await serperSearch(searchQuery, sendLog);
    
    if (serperResults.url) {
      googleMapUrl = serperResults.url;
      sendLog(`✅ Found Google Maps URL via Serper`);
      
      // Try to get place_id from this URL
      placeId = extractPlaceId(googleMapUrl);
      if (placeId && GOOGLE_PLACES_API_KEY) {
        const reviews = await getPlaceDetails(placeId, googleMapUrl, sendLog);
        if (reviews.length > 0) {
          return { reviews, url: googleMapUrl };
        }
      }
    }
    
    // Use reviews from Serper search results
    if (serperResults.reviews.length > 0) {
      sendLog(`✅ Extracted ${serperResults.reviews.length} reviews from search results`);
      return { reviews: serperResults.reviews, url: googleMapUrl };
    }
  }

  sendLog('❌ All Google search methods exhausted');
  return { reviews: [], url: googleMapUrl };
}

// ========================================
// YELP REVIEWS FETCHER
// ========================================
async function fetchYelpReviews(
  companyName: string,
  companyDetails: any,
  sendLog: (msg: string) => void
): Promise<{ reviews: Review[]; url: string | null }> {
  
  if (!SERPER_API_KEY) {
    sendLog('⚠️ Serper API key not configured');
    return { reviews: [], url: null };
  }

  const cityState = companyDetails?.address ? extractCityState(companyDetails.address) : '';
  const searchQuery = cityState
    ? `"${companyName}" ${cityState} site:yelp.com`
    : `"${companyName}" site:yelp.com`;

  sendLog(`🔍 Searching: ${searchQuery}`);

  const results = await serperSearch(searchQuery, sendLog);
  
  if (results.url) {
    sendLog(`✅ Found Yelp URL: ${results.url.substring(0, 60)}...`);
  }

  return { reviews: results.reviews, url: results.url };
}

// ========================================
// FACEBOOK REVIEWS FETCHER
// ========================================
async function fetchFacebookReviews(
  companyName: string,
  companyDetails: any,
  sendLog: (msg: string) => void
): Promise<{ reviews: Review[]; url: string | null }> {
  
  if (!SERPER_API_KEY) {
    sendLog('⚠️ Serper API key not configured');
    return { reviews: [], url: null };
  }

  const cityState = companyDetails?.address ? extractCityState(companyDetails.address) : '';
  const searchQuery = cityState
    ? `"${companyName}" ${cityState} site:facebook.com`
    : `"${companyName}" site:facebook.com`;

  sendLog(`🔍 Searching: ${searchQuery}`);

  const results = await serperSearch(searchQuery, sendLog);
  
  if (results.url) {
    sendLog(`✅ Found Facebook URL: ${results.url.substring(0, 60)}...`);
  }

  return { reviews: results.reviews, url: results.url };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function expandUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });
    return response.url;
  } catch (error) {
    return null;
  }
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

async function getPlaceDetails(placeId: string, url: string | null, sendLog: (msg: string) => void): Promise<Review[]> {
  try {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,reviews,rating,user_ratings_total,url,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      sendLog(`   ✓ Found: ${data.result.name}`);
      sendLog(`   ✓ Address: ${data.result.formatted_address || 'N/A'}`);
      sendLog(`   ✓ Rating: ${data.result.rating || 'N/A'} (${data.result.user_ratings_total || 0} reviews)`);

      if (data.result.reviews && data.result.reviews.length > 0) {
        return data.result.reviews.map((review: any) => ({
          id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          author: review.author_name || 'Google User',
          rating: review.rating || 5,
          text: review.text || '',
          date: review.time ? new Date(review.time * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          platform: 'google',
          url: review.author_url || url || data.result.url || '',
        }));
      } else {
        sendLog('   ⚠️ Place found but has 0 reviews');
      }
    } else {
      sendLog(`   ✗ API returned: ${data.status}`);
    }
  } catch (error) {
    sendLog(`   ✗ Error: ${error}`);
  }

  return [];
}

async function textSearchPlaces(query: string, sendLog: (msg: string) => void): Promise<string | null> {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]) {
      sendLog(`   ✓ Found place via text search`);
      return data.results[0].place_id;
    } else {
      sendLog(`   ✗ Text search returned: ${data.status}`);
    }
  } catch (error) {
    sendLog(`   ✗ Text search error: ${error}`);
  }

  return null;
}

async function geocodeAddress(address: string, sendLog: (msg: string) => void): Promise<{ lat: number; lng: number } | null> {
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const location = data.results[0].geometry.location;
      sendLog(`   ✓ Geocoded to: ${location.lat}, ${location.lng}`);
      return location;
    } else {
      sendLog(`   ✗ Geocoding failed: ${data.status}`);
    }
  } catch (error) {
    sendLog(`   ✗ Geocoding error: ${error}`);
  }

  return null;
}

async function nearbySearch(name: string, location: { lat: number; lng: number }, sendLog: (msg: string) => void): Promise<string | null> {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=500&keyword=${encodeURIComponent(name)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]) {
      sendLog(`   ✓ Found via nearby search`);
      return data.results[0].place_id;
    } else {
      sendLog(`   ✗ Nearby search returned: ${data.status}`);
    }
  } catch (error) {
    sendLog(`   ✗ Nearby search error: ${error}`);
  }

  return null;
}

async function findPlaceByPhone(phone: string, sendLog: (msg: string) => void): Promise<string | null> {
  try {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(cleanPhone)}&inputtype=phonenumber&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.candidates?.[0]) {
      sendLog(`   ✓ Found via phone number`);
      return data.candidates[0].place_id;
    } else {
      sendLog(`   ✗ Phone search returned: ${data.status}`);
    }
  } catch (error) {
    sendLog(`   ✗ Phone search error: ${error}`);
  }

  return null;
}

async function serperSearch(query: string, sendLog: (msg: string) => void): Promise<{ reviews: Review[]; url: string | null }> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 20,
      }),
    });

    const data = await response.json();
    const reviews: Review[] = [];
    let url: string | null = null;

    // Get URL from first result
    if (data.organic?.[0]?.link) {
      url = data.organic[0].link;
    }

    // Extract reviews from search results
    const platform = query.includes('yelp.com') ? 'yelp' : query.includes('facebook.com') ? 'facebook' : 'google';

    if (data.organic) {
      for (const result of data.organic) {
        if (result.snippet && result.snippet.length > 50) {
          const ratingMatch = result.snippet.match(/(\d)(?:\.\d)?\s*(?:star|★|stars)/i);
          
          if (ratingMatch) {
            const rating = parseInt(ratingMatch[1]);
            const text = cleanReviewText(result.snippet);
            
            if (text.length > 20) {
              reviews.push({
                id: `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                author: extractAuthorName(result.snippet) || `${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
                rating: rating,
                text: text,
                date: extractDate(result.snippet) || new Date().toISOString().split('T')[0],
                platform: platform,
                url: result.link || url || '',
              });
            }
          }
        }
      }
    }

    // Check knowledge graph for reviews
    if (data.knowledgeGraph?.reviews) {
      for (const review of data.knowledgeGraph.reviews) {
        reviews.push({
          id: `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          author: review.author || 'User',
          rating: review.rating || 5,
          text: review.snippet || review.text || '',
          date: review.date || new Date().toISOString().split('T')[0],
          platform: platform,
          url: url || '',
        });
      }
    }

    sendLog(`   ✓ Serper returned ${reviews.length} reviews`);
    return { reviews: reviews.slice(0, 20), url };
  } catch (error) {
    sendLog(`   ✗ Serper error: ${error}`);
    return { reviews: [], url: null };
  }
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
    /(\d+)\s+(?:day|week|month|year)s?\s+ago/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        if (match[0].includes('ago')) {
          return new Date().toISOString().split('T')[0];
        }
        
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

function cleanReviewText(text: string): string {
  let cleaned = text
    .replace(/\d+\s*(?:star|★|stars).*?(?:\.|$)/gi, '')
    .replace(/^.*?(?:said|wrote|reviewed|says):\s*/i, '')
    .replace(/Rating:\s*\d+/gi, '')
    .replace(/^["""]|["""]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500) + '...';
  }

  return cleaned;
}