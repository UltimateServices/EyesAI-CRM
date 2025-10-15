import { NextRequest } from 'next/server';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

// Configurable limits - gets NEWEST reviews
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
            let googleUrl = existingUrls?.google;

            // Find Google Maps URL if not provided
            if (!googleUrl) {
              sendLog('🔍 Finding Google Maps listing...');
              const searchQuery = companyDetails?.address
                ? `${companyName} ${companyDetails.address} Google Maps`
                : `${companyName} Google Maps`;

              const searchResponse = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                  'X-API-KEY': SERPER_API_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ q: searchQuery, num: 5 }),
              });

              const searchData = await searchResponse.json();

              if (searchData.organic) {
                for (const result of searchData.organic) {
                  if (result.link && (result.link.includes('google.com/maps') || result.link.includes('maps.google.com'))) {
                    googleUrl = result.link;
                    foundUrls.google = googleUrl;
                    sendLog(`✅ Found: ${googleUrl.substring(0, 60)}...`);
                    break;
                  }
                }
              }
            }

            if (googleUrl) {
              sendLog(`🔑 Launching Apify scraper (${REVIEW_LIMITS.google} newest reviews)...`);

              const googleReviews = await scrapeGoogleWithApify(
                companyName,
                googleUrl,
                REVIEW_LIMITS.google,
                sendLog
              );

              if (googleReviews.length > 0) {
                allReviews.push(...googleReviews);
                sendLog(`✅ ${googleReviews.length} Google reviews scraped`);
              } else {
                sendLog('⚠️ No Google reviews found');
              }
            } else {
              sendLog('⚠️ Could not find Google Maps listing');
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
// APIFY GOOGLE MAPS SCRAPER
// ========================================
async function scrapeGoogleWithApify(
  businessName: string,
  url: string,
  limit: number,
  sendLog: (msg: string) => void
): Promise<Review[]> {
  try {
    // Start Apify actor
    const actorRunResponse = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchStringsArray: [businessName],
          maxCrawledPlaces: 1,
          language: 'en',
          maxReviews: limit,
          reviewsSort: 'newest',  // Get newest reviews first
          scrapeReviewerName: true,
          scrapeReviewId: true,
          scrapeReviewUrl: true,
          scrapeReviewDate: true,
        }),
      }
    );

    if (!actorRunResponse.ok) {
      throw new Error(`Apify API returned ${actorRunResponse.status}`);
    }

    const runData = await actorRunResponse.json();
    const runId = runData.data.id;

    sendLog(`   ⏳ Run ID: ${runId}`);

    // Wait for completion
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
        sendLog(`   ⏳ Scraping... ${attempts * 2}s`);
      }
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Scraping ${status}`);
    }

    sendLog(`   ✓ Completed in ${attempts * 2}s`);

    // Get results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`
    );
    const results = await resultsResponse.json();

    const reviews: Review[] = [];
    
    for (const item of results) {
      if (item.reviews) {
        // Strictly enforce limit - only take first N reviews (already sorted by newest)
        const reviewsToProcess = item.reviews.slice(0, limit);
        
        for (const review of reviewsToProcess) {
          reviews.push({
            id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            author: review.name || 'Google User',
            rating: review.stars || 5,
            text: review.text || review.textTranslated || '',
            date: review.publishedAtDate ? review.publishedAtDate.split('T')[0] : new Date().toISOString().split('T')[0],
            platform: 'google',
            url: url,
          });
        }
        
        // Break after first business (we only want 1)
        break;
      }
    }

    // Final safeguard - ensure we never exceed limit
    const finalReviews = reviews.slice(0, limit);
    sendLog(`   ✓ Returning ${finalReviews.length} reviews (limit: ${limit})`);
    
    return finalReviews;
  } catch (error: any) {
    sendLog(`   ✗ ${error.message}`);
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
        if (result.snippet && result.snippet.length > 50 && reviews.length < limit) {
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