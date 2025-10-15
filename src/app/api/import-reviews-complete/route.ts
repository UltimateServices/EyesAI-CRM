import { NextRequest } from 'next/server';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

// Configurable limits - STRICTLY ENFORCED
const REVIEW_LIMITS = {
  google: 20,      // Premium Apify scraping
  yelp: 10,        // Free Serper scraping
  facebook: 10,    // Free Serper scraping
};

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
        sendLog(`🚀 Hybrid Import for: ${companyName}`);
        sendLog(`📊 Strategy: Premium Google + Free Yelp/Facebook`);
        sendLog(`🔒 Limits: Google=${REVIEW_LIMITS.google}, Yelp=${REVIEW_LIMITS.yelp}, Facebook=${REVIEW_LIMITS.facebook}`);

        if (!SERPER_API_KEY) {
          throw new Error('Serper API key required');
        }

        const allReviews: Review[] = [];
        const foundUrls: any = {
          google: null,
          yelp: null,
          facebook: null,
        };

        // ========================================
        // GOOGLE REVIEWS - PREMIUM APIFY
        // ========================================
        sendLog('');
        sendLog('═══════════════════════════════════');
        sendLog('📍 GOOGLE MAPS (Premium Apify)');
        sendLog('═══════════════════════════════════');

        if (APIFY_API_TOKEN) {
          try {
            // STEP 1: Find and validate Google Maps URL
            const googleUrl = await findGoogleMapsUrl(
              companyName,
              companyDetails,
              existingUrls?.google,
              sendLog
            );

            if (googleUrl) {
              foundUrls.google = googleUrl;
              
              sendLog('');
              sendLog(`🔑 Launching Apify scraper...`);
              sendLog(`🎯 Requesting ${REVIEW_LIMITS.google} newest reviews`);

              // STEP 2: Use Apify to scrape reviews from the URL
              const googleReviews = await scrapeGoogleWithApify(
                googleUrl,
                REVIEW_LIMITS.google,
                sendLog
              );

              if (googleReviews.length > 0) {
                allReviews.push(...googleReviews);
                sendLog(`✅ ${googleReviews.length} Google reviews scraped`);
              } else {
                sendLog('⚠️ Apify returned 0 reviews');
              }
            } else {
              sendLog('⚠️ Could not find Google Maps listing after all search methods');
            }
          } catch (error: any) {
            sendLog(`❌ Google error: ${error.message}`);
          }
        } else {
          sendLog('⚠️ Apify token not configured - skipping Google');
        }

        // ========================================
        // YELP REVIEWS - FREE SERPER SCRAPING
        // ========================================
        sendLog('');
        sendLog('═══════════════════════════════════');
        sendLog('📍 YELP (Free Serper Scraping)');
        sendLog('═══════════════════════════════════');

        try {
          const cityState = companyDetails?.address ? extractCityState(companyDetails.address) : '';
          const yelpQuery = cityState
            ? `${companyName} ${cityState} Yelp reviews`
            : `${companyName} Yelp reviews`;

          sendLog(`🔍 Searching: "${yelpQuery}"`);

          const yelpResults = await scrapeWithSerper(yelpQuery, 'yelp', REVIEW_LIMITS.yelp, sendLog);

          if (yelpResults.url) {
            foundUrls.yelp = yelpResults.url;
            sendLog(`✅ Found Yelp: ${yelpResults.url.substring(0, 50)}...`);
          }

          if (yelpResults.reviews.length > 0) {
            allReviews.push(...yelpResults.reviews);
            sendLog(`✅ ${yelpResults.reviews.length} Yelp reviews extracted`);
          } else {
            sendLog('⚠️ No Yelp reviews found');
          }
        } catch (error: any) {
          sendLog(`❌ Yelp error: ${error.message}`);
        }

        // ========================================
        // FACEBOOK REVIEWS - FREE SERPER SCRAPING
        // ========================================
        sendLog('');
        sendLog('═══════════════════════════════════');
        sendLog('📍 FACEBOOK (Free Serper Scraping)');
        sendLog('═══════════════════════════════════');

        try {
          const cityState = companyDetails?.address ? extractCityState(companyDetails.address) : '';
          const fbQuery = cityState
            ? `${companyName} ${cityState} Facebook reviews`
            : `${companyName} Facebook reviews`;

          sendLog(`🔍 Searching: "${fbQuery}"`);

          const fbResults = await scrapeWithSerper(fbQuery, 'facebook', REVIEW_LIMITS.facebook, sendLog);

          if (fbResults.url) {
            foundUrls.facebook = fbResults.url;
            sendLog(`✅ Found Facebook: ${fbResults.url.substring(0, 50)}...`);
          }

          if (fbResults.reviews.length > 0) {
            allReviews.push(...fbResults.reviews);
            sendLog(`✅ ${fbResults.reviews.length} Facebook reviews extracted`);
          } else {
            sendLog('⚠️ No Facebook reviews found');
          }
        } catch (error: any) {
          sendLog(`❌ Facebook error: ${error.message}`);
        }

        // ========================================
        // RESULTS
        // ========================================
        sendLog('');
        sendLog('═══════════════════════════════════');
        sendLog('🎉 HYBRID IMPORT COMPLETE');
        sendLog('═══════════════════════════════════');
        sendLog(`📊 Total: ${allReviews.length} reviews`);
        sendLog(`   - Google: ${allReviews.filter(r => r.platform === 'google').length} (Premium)`);
        sendLog(`   - Yelp: ${allReviews.filter(r => r.platform === 'yelp').length} (Free)`);
        sendLog(`   - Facebook: ${allReviews.filter(r => r.platform === 'facebook').length} (Free)`);

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

// ========================================
// VALIDATE AND CONVERT GOOGLE MAPS URL
// ========================================
async function validateAndConvertGoogleMapsUrl(
  url: string,
  companyName: string,
  sendLog: (msg: string) => void
): Promise<string | null> {
  
  // Check if it's already a proper place URL
  if (url.includes('/maps/place/')) {
    sendLog('   ✓ Valid place URL format');
    return url;
  }
  
  if (url.includes('maps.google.com')) {
    sendLog('   ✓ Valid maps.google.com URL');
    return url;
  }
  
  // If it's a search URL (?q=), convert it to a place URL
  if (url.includes('?q=') || url.includes('&q=')) {
    sendLog('   ⚠️ Search URL detected (not a place URL)');
    sendLog('   🔄 Converting to place URL...');
    
    // Extract search query from URL
    const queryMatch = url.match(/[?&]q=([^&]+)/);
    if (queryMatch) {
      const searchQuery = decodeURIComponent(queryMatch[1].replace(/\+/g, ' '));
      sendLog(`   🔍 Query: "${searchQuery}"`);
      
      // Search for the proper place URL
      try {
        const searchResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': SERPER_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: `${searchQuery} site:google.com/maps/place`,
            num: 3,
          }),
        });

        const searchData = await searchResponse.json();

        if (searchData.organic) {
          for (const result of searchData.organic) {
            if (result.link && result.link.includes('/maps/place/')) {
              sendLog(`   ✅ Converted successfully!`);
              return result.link;
            }
          }
        }
      } catch (error) {
        sendLog(`   ✗ Conversion failed: ${error}`);
      }
    }
  }
  
  sendLog('   ✗ Could not validate/convert URL');
  return null;
}

// ========================================
// COMPREHENSIVE GOOGLE MAPS URL FINDER
// ========================================
async function findGoogleMapsUrl(
  companyName: string,
  companyDetails: any,
  existingUrl: string | null,
  sendLog: (msg: string) => void
): Promise<string | null> {
  
  // Method 0: Validate existing URL if provided
  if (existingUrl) {
    sendLog(`📋 Checking URL from intake...`);
    
    const validatedUrl = await validateAndConvertGoogleMapsUrl(
      existingUrl,
      companyName,
      sendLog
    );
    
    if (validatedUrl) {
      sendLog(`✅ URL validated and ready`);
      sendLog('');
      return validatedUrl;
    } else {
      sendLog(`❌ URL validation failed - will search for correct URL`);
      sendLog('');
    }
  } else {
    sendLog('🔍 No Google URL in intake - running comprehensive search...');
    sendLog('');
  }

  const searchMethods = [];

  // Method 1: Business Name + Full Address (BEST)
  if (companyDetails?.address) {
    searchMethods.push({
      name: 'Name + Address',
      query: `"${companyName}" ${companyDetails.address} site:google.com/maps/place`,
    });
  }

  // Method 2: Phone Number (VERY ACCURATE)
  if (companyDetails?.phone) {
    const cleanPhone = companyDetails.phone.replace(/[\s\-\(\)]/g, '');
    searchMethods.push({
      name: 'Phone Number',
      query: `${cleanPhone} site:google.com/maps/place`,
    });
  }

  // Method 3: Business Name + Phone
  if (companyDetails?.phone) {
    searchMethods.push({
      name: 'Name + Phone',
      query: `"${companyName}" ${companyDetails.phone} site:google.com/maps/place`,
    });
  }

  // Method 4: Business Name + City/State
  if (companyDetails?.address) {
    const cityState = extractCityState(companyDetails.address);
    if (cityState) {
      searchMethods.push({
        name: 'Name + City/State',
        query: `"${companyName}" ${cityState} site:google.com/maps/place`,
      });
    }
  }

  // Method 5: Website Domain
  if (companyDetails?.website) {
    const domain = extractDomain(companyDetails.website);
    if (domain) {
      searchMethods.push({
        name: 'Website Domain',
        query: `${domain} site:google.com/maps/place`,
      });
    }
  }

  // Method 6: Business Name Only (LAST RESORT)
  searchMethods.push({
    name: 'Name Only',
    query: `"${companyName}" site:google.com/maps/place`,
  });

  // Try each method until we find a valid Google Maps URL
  for (let i = 0; i < searchMethods.length; i++) {
    const method = searchMethods[i];
    sendLog(`🔍 Method ${i + 1}: ${method.name}`);

    try {
      const searchResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: method.query,
          num: 5,
        }),
      });

      const searchData = await searchResponse.json();

      if (searchData.organic) {
        for (const result of searchData.organic) {
          if (result.link && result.link.includes('/maps/place/')) {
            sendLog(`   ✅ FOUND!`);
            return result.link;
          }
        }
      }

      sendLog(`   ✗ No results`);
    } catch (error) {
      sendLog(`   ✗ Search failed: ${error}`);
    }

    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  sendLog('❌ Could not find Google Maps URL after all methods');
  return null;
}

// ========================================
// APIFY GOOGLE MAPS SCRAPER (20 REVIEWS MAX)
// ========================================
async function scrapeGoogleWithApify(
  url: string,
  limit: number,
  sendLog: (msg: string) => void
): Promise<Review[]> {
  try {
    sendLog(`   🔗 URL: ${url.substring(0, 80)}...`);
    sendLog(`   🎯 Limit: ${limit} reviews`);

    // Start Apify actor with STRICT limit
    const actorRunResponse = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: url }],
          maxCrawledPlaces: 1,
          language: 'en',
          maxReviews: limit,  // LIMIT 1: API parameter
          reviewsSort: 'newest',
          scrapeReviewerName: true,
          scrapeReviewId: true,
          scrapeReviewUrl: true,
          scrapeReviewDate: true,
        }),
      }
    );

    if (!actorRunResponse.ok) {
      const errorText = await actorRunResponse.text();
      throw new Error(`Apify API error ${actorRunResponse.status}: ${errorText}`);
    }

    const runData = await actorRunResponse.json();
    const runId = runData.data.id;

    sendLog(`   ⏳ Run ID: ${runId}`);

    // Wait for completion (max 2 minutes)
    let status = 'RUNNING';
    let attempts = 0;
    
    while (status === 'RUNNING' && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
      );
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      
      attempts++;
      if (attempts % 5 === 0) {
        sendLog(`   ⏳ Still scraping... ${attempts * 2}s`);
      }
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify status: ${status}`);
    }

    sendLog(`   ✓ Scraping completed in ${attempts * 2}s`);

    // Get results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`
    );
    
    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
    }
    
    const results = await resultsResponse.json();
    sendLog(`   📦 Received ${results.length} result items from Apify`);

    const reviews: Review[] = [];
    
    // Process results
    for (const item of results) {
      if (item.reviews && Array.isArray(item.reviews)) {
        sendLog(`   📝 Processing ${item.reviews.length} reviews from data...`);
        
        // LIMIT 2: Slice to exact limit
        const reviewsToProcess = item.reviews.slice(0, limit);
        
        for (const review of reviewsToProcess) {
          if (reviews.length >= limit) break; // LIMIT 3: Safety check
          
          reviews.push({
            id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            author: review.name || review.reviewerName || 'Google User',
            rating: review.stars || review.rating || 5,
            text: review.text || review.reviewText || review.textTranslated || '',
            date: review.publishedAtDate ? review.publishedAtDate.split('T')[0] : 
                  review.date ? review.date.split('T')[0] : 
                  new Date().toISOString().split('T')[0],
            platform: 'google',
            url: url,
          });
        }
        
        break; // Only process first business
      }
    }

    // LIMIT 4: Final enforcement
    const finalReviews = reviews.slice(0, limit);
    sendLog(`   ✅ Returning ${finalReviews.length} reviews (enforced limit: ${limit})`);
    
    return finalReviews;
  } catch (error: any) {
    sendLog(`   ❌ Error: ${error.message}`);
    console.error('Apify error details:', error);
    return [];
  }
}

// ========================================
// SERPER SCRAPING (Yelp & Facebook)
// ========================================
async function scrapeWithSerper(
  query: string,
  platform: string,
  limit: number,
  sendLog: (msg: string) => void
): Promise<{ reviews: Review[]; url: string | null }> {
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
      const link = data.organic[0].link;
      if ((platform === 'yelp' && link.includes('yelp.com')) ||
          (platform === 'facebook' && link.includes('facebook.com'))) {
        url = link;
      }
    }

    // Extract reviews from snippets
    if (data.organic) {
      for (const result of data.organic) {
        if (reviews.length >= limit) break; // Enforce limit
        
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

    return { reviews: reviews.slice(0, limit), url };
  } catch (error: any) {
    sendLog(`   ✗ ${error.message}`);
    return { reviews: [], url: null };
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function extractCityState(address: string): string {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  return '';
}

function extractDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
    cleaned = cleaned.substring(0, 497) + '...';
  }

  return cleaned;
}