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
            let searchInput: any = null;
            
            // Check if we have a valid place URL (not a search URL)
            const hasValidPlaceUrl = existingUrls?.google && 
                                     (existingUrls.google.includes('/maps/place/') ||
                                      existingUrls.google.includes('maps.google.com/maps'));
            
            if (hasValidPlaceUrl) {
              sendLog(`✅ Valid place URL found in intake`);
              sendLog(`   ${existingUrls.google.substring(0, 100)}...`);
              foundUrls.google = existingUrls.google;
              searchInput = {
                startUrls: [{ url: existingUrls.google }],
              };
            } else {
              // Build comprehensive search query with ALL available data
              sendLog(`🔍 Building comprehensive search query...`);
              
              let searchQuery = companyName;
              const searchDetails = [];
              
              // Add address (BEST for accuracy)
              if (companyDetails?.address) {
                searchQuery = `${companyName}, ${companyDetails.address}`;
                searchDetails.push(`Address: ${companyDetails.address}`);
              }
              
              // Add phone (secondary identifier)
              if (companyDetails?.phone) {
                searchDetails.push(`Phone: ${companyDetails.phone}`);
              }
              
              // Add website (tertiary identifier)
              if (companyDetails?.website) {
                searchDetails.push(`Website: ${companyDetails.website}`);
              }
              
              sendLog(`   📝 Search Query: "${searchQuery}"`);
              if (searchDetails.length > 0) {
                searchDetails.forEach(detail => sendLog(`   📋 ${detail}`));
              }
              
              searchInput = {
                searchStringsArray: [searchQuery],
              };
            }
            
            if (searchInput) {
              sendLog('');
              sendLog(`🔑 Launching Apify Actor...`);
              sendLog(`🎯 Target: ${REVIEW_LIMITS.google} newest reviews`);
              
              const googleReviews = await scrapeGoogleWithApify(
                searchInput,
                companyName,
                companyDetails,
                REVIEW_LIMITS.google,
                sendLog
              );
              
              if (googleReviews.reviews.length > 0) {
                allReviews.push(...googleReviews.reviews);
                if (googleReviews.foundUrl) {
                  foundUrls.google = googleReviews.foundUrl;
                  sendLog(`   🔗 Captured URL: ${googleReviews.foundUrl.substring(0, 80)}...`);
                }
                sendLog(`✅ ${googleReviews.reviews.length} Google reviews imported`);
              } else {
                sendLog('⚠️ Apify returned 0 reviews - business may not have reviews or couldn\'t be found');
              }
            }
          } catch (error: any) {
            sendLog(`❌ Google error: ${error.message}`);
            console.error('Google Maps error:', error);
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
            sendLog(`✅ Found Yelp: ${yelpResults.url.substring(0, 60)}...`);
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
            sendLog(`✅ Found Facebook: ${fbResults.url.substring(0, 60)}...`);
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
  searchInput: any,
  companyName: string,
  companyDetails: any,
  limit: number,
  sendLog: (msg: string) => void
): Promise<{ reviews: Review[]; foundUrl: string | null }> {
  try {
    if (searchInput.startUrls) {
      sendLog(`   🔗 Mode: Direct URL`);
    } else if (searchInput.searchStringsArray) {
      sendLog(`   🔍 Mode: Search`);
      sendLog(`   📍 Query: "${searchInput.searchStringsArray[0]}"`);
    }

    // Build comprehensive input
    const apifyInput: any = {
      ...searchInput,
      maxCrawledPlaces: 3, // Get multiple results for verification
      language: 'en',
      maxReviews: limit,
      reviewsSort: 'newest',
      scrapeReviewerName: true,
      scrapeReviewId: true,
      scrapeReviewUrl: true,
      scrapeReviewDate: true,
      scrapeResponseFromOwnerText: true,
    };

    // Add location filter for better accuracy
    if (searchInput.searchStringsArray && companyDetails?.address) {
      const cityState = extractCityState(companyDetails.address);
      if (cityState) {
        apifyInput.location = cityState;
        sendLog(`   🌍 Location filter: ${cityState}`);
      }
    }

    sendLog('   ⏳ Starting Apify actor...');

    // Start Apify actor
    const actorRunResponse = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apifyInput),
      }
    );

    if (!actorRunResponse.ok) {
      const errorText = await actorRunResponse.text();
      throw new Error(`Apify API error ${actorRunResponse.status}: ${errorText}`);
    }

    const runData = await actorRunResponse.json();
    const runId = runData.data.id;

    sendLog(`   ✓ Actor started: ${runId}`);

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
        sendLog(`   ⏳ Scraping... ${attempts * 2}s elapsed`);
      }
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify actor ${status}`);
    }

    sendLog(`   ✓ Completed in ${attempts * 2}s`);

    // Get results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`
    );
    
    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
    }
    
    const results = await resultsResponse.json();
    
    if (!results || results.length === 0) {
      sendLog(`   ⚠️ Apify returned 0 items`);
      return { reviews: [], foundUrl: null };
    }

    sendLog(`   📦 Received ${results.length} business result(s)`);

    // ========================================
    // BUSINESS VERIFICATION - Find correct match
    // ========================================
    let matchedBusiness: any = null;
    
    if (results.length === 1) {
      // Only one result, use it
      matchedBusiness = results[0];
      sendLog(`   ✅ Single result - using: "${matchedBusiness.title}"`);
    } else {
      // Multiple results - verify which is correct
      sendLog(`   🔍 Verifying correct business from ${results.length} results...`);
      
      for (const item of results) {
        const score = calculateBusinessMatchScore(item, companyName, companyDetails, sendLog);
        
        if (score >= 70) {
          matchedBusiness = item;
          sendLog(`   ✅ Match found (score: ${score}%): "${item.title}"`);
          break;
        } else {
          sendLog(`   ❌ Rejected (score: ${score}%): "${item.title}"`);
        }
      }
      
      if (!matchedBusiness && results.length > 0) {
        sendLog(`   ⚠️ No high-confidence match found - using first result as fallback`);
        matchedBusiness = results[0];
      }
    }

    if (!matchedBusiness) {
      sendLog(`   ❌ No valid business found`);
      return { reviews: [], foundUrl: null };
    }

    const reviews: Review[] = [];
    let foundUrl: string | null = null;
    
    // Capture business details
    if (matchedBusiness.title) {
      sendLog(`   🏢 Business: "${matchedBusiness.title}"`);
    }
    if (matchedBusiness.totalScore) {
      sendLog(`   ⭐ Rating: ${matchedBusiness.totalScore} stars`);
    }
    if (matchedBusiness.reviewsCount) {
      sendLog(`   📊 Total reviews available: ${matchedBusiness.reviewsCount}`);
    }
    
    // Capture the Google Maps URL
    if (matchedBusiness.url) {
      foundUrl = matchedBusiness.url;
    }
    
    // Process reviews
    if (matchedBusiness.reviews && Array.isArray(matchedBusiness.reviews)) {
      sendLog(`   📝 Processing reviews...`);
      
      const reviewsToProcess = matchedBusiness.reviews.slice(0, limit);
      
      for (const review of reviewsToProcess) {
        if (reviews.length >= limit) break;
        
        reviews.push({
          id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          author: review.name || review.reviewerName || 'Google User',
          rating: review.stars || review.rating || 5,
          text: review.text || review.reviewText || review.textTranslated || '',
          date: review.publishedAtDate ? review.publishedAtDate.split('T')[0] : 
                review.date ? review.date.split('T')[0] : 
                new Date().toISOString().split('T')[0],
          platform: 'google',
          url: foundUrl || '',
        });
      }
      
      sendLog(`   ✅ Extracted ${reviews.length} reviews (limit: ${limit})`);
    } else {
      sendLog(`   ⚠️ No reviews found in result`);
    }

    return { reviews: reviews.slice(0, limit), foundUrl };
  } catch (error: any) {
    sendLog(`   ❌ Apify error: ${error.message}`);
    console.error('Apify error details:', error);
    return { reviews: [], foundUrl: null };
  }
}

// ========================================
// BUSINESS MATCH VERIFICATION
// ========================================
function calculateBusinessMatchScore(
  item: any,
  companyName: string,
  companyDetails: any,
  sendLog: (msg: string) => void
): number {
  let score = 0;
  const maxScore = 100;
  
  // Name matching (50 points max)
  const itemName = (item.title || '').toLowerCase().trim();
  const searchName = companyName.toLowerCase().trim();
  
  if (itemName === searchName) {
    score += 50;
  } else if (itemName.includes(searchName) || searchName.includes(itemName)) {
    score += 35;
  } else {
    // Calculate similarity
    const similarity = calculateStringSimilarity(itemName, searchName);
    score += Math.floor(similarity * 50);
  }
  
  // Website matching (25 points)
  if (companyDetails?.website && item.website) {
    const normalizedItemWebsite = normalizeUrl(item.website);
    const normalizedSearchWebsite = normalizeUrl(companyDetails.website);
    
    if (normalizedItemWebsite === normalizedSearchWebsite) {
      score += 25;
    }
  }
  
  // Phone matching (15 points)
  if (companyDetails?.phone && item.phone) {
    const normalizedItemPhone = normalizePhone(item.phone);
    const normalizedSearchPhone = normalizePhone(companyDetails.phone);
    
    if (normalizedItemPhone === normalizedSearchPhone) {
      score += 15;
    }
  }
  
  // Address matching (10 points)
  if (companyDetails?.address && item.address) {
    const itemAddr = item.address.toLowerCase();
    const searchAddr = companyDetails.address.toLowerCase();
    
    // Check if key parts match (city, zip)
    const zipMatch = /\d{5}/.exec(searchAddr);
    if (zipMatch && itemAddr.includes(zipMatch[0])) {
      score += 10;
    } else if (itemAddr.includes(searchAddr) || searchAddr.includes(itemAddr)) {
      score += 5;
    }
  }
  
  return Math.min(score, maxScore);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
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
        if (reviews.length >= limit) break;
        
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