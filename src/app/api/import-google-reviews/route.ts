import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { googleMapsUrls, companyName, companyAddress, companyPhone } = await request.json();

    console.log('\n================================');
    console.log('🚀 STARTING COMPREHENSIVE REVIEW IMPORT');
    console.log('================================');
    console.log('Company:', companyName);
    console.log('Address:', companyAddress);
    console.log('Phone:', companyPhone);
    console.log('URLs provided:', googleMapsUrls?.length || 0);

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    const allLocationData = [];
    const processedPlaceIds = new Set<string>();
    let totalFiveStarReviews = 0;
    let totalAllReviews = 0;

    // STRATEGY 1: Process provided URLs
    if (googleMapsUrls && googleMapsUrls.length > 0) {
      console.log('\n📍 STRATEGY 1: Processing provided URLs');
      for (let i = 0; i < googleMapsUrls.length; i++) {
        const url = googleMapsUrls[i];
        console.log(`\n[${i + 1}/${googleMapsUrls.length}] Processing: ${url.substring(0, 80)}...`);
        
        const placeId = await findPlaceIdFromUrl(url);
        
        if (placeId && !processedPlaceIds.has(placeId)) {
          processedPlaceIds.add(placeId);
          const locationData = await fetchPlaceDetails(placeId);
          
          if (locationData) {
            allLocationData.push(locationData);
            totalFiveStarReviews += locationData.fiveStarReviews.length;
            totalAllReviews += locationData.allReviewsCount;
          }
        }
      }
    }

    // STRATEGY 2: Search by phone number
    if (companyPhone && processedPlaceIds.size < 5) {
      console.log('\n📞 STRATEGY 2: Searching by phone number');
      const phoneSearchResults = await searchByPhone(companyPhone);
      
      for (const placeId of phoneSearchResults) {
        if (!processedPlaceIds.has(placeId)) {
          processedPlaceIds.add(placeId);
          const locationData = await fetchPlaceDetails(placeId);
          
          if (locationData) {
            allLocationData.push(locationData);
            totalFiveStarReviews += locationData.fiveStarReviews.length;
            totalAllReviews += locationData.allReviewsCount;
          }
        }
      }
    }

    // STRATEGY 3: Search by name + address
    if (companyName && companyAddress && processedPlaceIds.size < 5) {
      console.log('\n🏢 STRATEGY 3: Searching by name + address');
      const addressSearchResults = await searchByNameAndAddress(companyName, companyAddress);
      
      for (const placeId of addressSearchResults) {
        if (!processedPlaceIds.has(placeId)) {
          processedPlaceIds.add(placeId);
          const locationData = await fetchPlaceDetails(placeId);
          
          if (locationData) {
            allLocationData.push(locationData);
            totalFiveStarReviews += locationData.fiveStarReviews.length;
            totalAllReviews += locationData.allReviewsCount;
          }
        }
      }
    }

    // STRATEGY 4: Search by name only (broader search)
    if (companyName && processedPlaceIds.size < 5) {
      console.log('\n🔍 STRATEGY 4: Searching by name only');
      const nameSearchResults = await searchByNameOnly(companyName);
      
      for (const placeId of nameSearchResults) {
        if (!processedPlaceIds.has(placeId)) {
          processedPlaceIds.add(placeId);
          const locationData = await fetchPlaceDetails(placeId);
          
          if (locationData) {
            allLocationData.push(locationData);
            totalFiveStarReviews += locationData.fiveStarReviews.length;
            totalAllReviews += locationData.allReviewsCount;
          }
        }
      }
    }

    // STRATEGY 5: Nearby search if we have address but still no results
    if (companyAddress && allLocationData.length === 0) {
      console.log('\n📍 STRATEGY 5: Nearby search from address');
      const nearbyResults = await searchNearby(companyAddress, companyName);
      
      for (const placeId of nearbyResults) {
        if (!processedPlaceIds.has(placeId)) {
          processedPlaceIds.add(placeId);
          const locationData = await fetchPlaceDetails(placeId);
          
          if (locationData) {
            allLocationData.push(locationData);
            totalFiveStarReviews += locationData.fiveStarReviews.length;
            totalAllReviews += locationData.allReviewsCount;
          }
        }
      }
    }

    console.log('\n================================');
    console.log('✅ IMPORT COMPLETE');
    console.log('================================');
    console.log('Locations found:', allLocationData.length);
    console.log('Total 5-star reviews:', totalFiveStarReviews);
    console.log('Total all reviews:', totalAllReviews);

    if (allLocationData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Could not find any Google Business listings for "${companyName}".\n\nTried:\n✓ URL extraction\n✓ Phone number search\n✓ Address search\n✓ Name search\n✓ Nearby search\n\nThe business may not have a Google Business Profile.` 
        },
        { status: 400 }
      );
    }

    const allFiveStarReviews = allLocationData.flatMap(location => location.fiveStarReviews);

    return NextResponse.json({
      success: true,
      data: {
        locations: allLocationData,
        totalLocations: allLocationData.length,
        totalFiveStarReviews,
        totalAllReviews,
        allFiveStarReviews,
      },
    });
  } catch (error: any) {
    console.error('❌ Critical error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// URL EXTRACTION - Handle ALL Google Maps URL formats
// ============================================================================

async function findPlaceIdFromUrl(url: string): Promise<string | null> {
  try {
    console.log('🔍 Analyzing URL...');

    // Resolve shortened links first
    if (url.includes('share.google') || url.includes('goo.gl') || url.includes('maps.app')) {
      console.log('🔄 Resolving shortened URL...');
      try {
        const response = await fetch(url, { 
          method: 'HEAD', 
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        url = response.url;
        console.log('✅ Resolved to:', url.substring(0, 100));
      } catch (e) {
        console.log('⚠️ Could not resolve, continuing with original URL');
      }
    }

    // Try all extraction methods
    let placeId = null;

    // Method 1: Direct place_id parameter
    placeId = url.match(/place_id=([A-Za-z0-9_-]+)/)?.[1];
    if (placeId) {
      console.log('✅ Found via place_id parameter');
      return placeId;
    }

    // Method 2: ChIJ format in data parameter
    placeId = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/)?.[1];
    if (placeId) {
      console.log('✅ Found via data parameter');
      return placeId;
    }

    // Method 3: ftid parameter
    placeId = url.match(/ftid=([A-Za-z0-9_:-]+)/)?.[1];
    if (placeId) {
      console.log('✅ Found via ftid parameter');
      return placeId;
    }

    // Method 4: ludocid (CID) - convert to place_id via search
    const cidMatch = url.match(/ludocid=(\d+)/);
    if (cidMatch) {
      console.log('✅ Found CID, searching for place...');
      return await searchByCID(cidMatch[1]);
    }

    // Method 5: Extract from ?q= query
    const queryMatch = url.match(/[?&]q=([^&)]+)/);
    if (queryMatch) {
      let query = decodeURIComponent(queryMatch[1]).replace(/\+/g, ' ').trim().replace(/\)$/, '');
      console.log('✅ Found query, searching:', query);
      return await searchByText(query);
    }

    // Method 6: Extract business name from /place/
    const placeNameMatch = url.match(/\/maps\/place\/([^/@?]+)/);
    if (placeNameMatch) {
      const placeName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
      console.log('✅ Extracted place name, searching:', placeName);
      return await searchByText(placeName);
    }

    // Method 7: g.page links
    const gpageMatch = url.match(/g\.page\/([^/?]+)/);
    if (gpageMatch) {
      const pageName = decodeURIComponent(gpageMatch[1]);
      console.log('✅ Found g.page, searching:', pageName);
      return await searchByText(pageName);
    }

    console.log('❌ Could not extract Place ID from URL');
    return null;
  } catch (error) {
    console.error('Error in URL extraction:', error);
    return null;
  }
}

// ============================================================================
// SEARCH STRATEGIES
// ============================================================================

async function searchByPhone(phone: string): Promise<string[]> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    console.log('🔍 Searching by phone:', phone);
    
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(phone)}&inputtype=phonenumber&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.candidates?.length > 0) {
      console.log(`✅ Found ${data.candidates.length} results by phone`);
      return data.candidates.map((c: any) => c.place_id);
    }
    
    console.log('❌ No results from phone search');
    return [];
  } catch (error) {
    console.error('Phone search error:', error);
    return [];
  }
}

async function searchByNameAndAddress(name: string, address: string): Promise<string[]> {
  try {
    const query = `${name} ${address}`;
    console.log('🔍 Searching by name + address:', query);
    
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.candidates?.length > 0) {
      console.log(`✅ Found ${data.candidates.length} results`);
      data.candidates.forEach((c: any) => {
        console.log(`   - ${c.name} (${c.formatted_address})`);
      });
      return data.candidates.map((c: any) => c.place_id);
    }
    
    console.log('❌ No results from name+address search');
    return [];
  } catch (error) {
    console.error('Name+address search error:', error);
    return [];
  }
}

async function searchByNameOnly(name: string): Promise<string[]> {
  try {
    console.log('🔍 Searching by name only:', name);
    
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(name)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.candidates?.length > 0) {
      console.log(`✅ Found ${data.candidates.length} potential matches`);
      return data.candidates.slice(0, 3).map((c: any) => c.place_id);
    }
    
    console.log('❌ No results from name-only search');
    return [];
  } catch (error) {
    console.error('Name search error:', error);
    return [];
  }
}

async function searchNearby(address: string, name?: string): Promise<string[]> {
  try {
    console.log('🔍 Geocoding address for nearby search:', address);
    
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_API_KEY}`;
    const geoResponse = await fetch(geocodeUrl);
    const geoData = await geoResponse.json();
    
    if (geoData.status !== 'OK' || !geoData.results[0]) {
      console.log('❌ Could not geocode address');
      return [];
    }
    
    const location = geoData.results[0].geometry.location;
    console.log(`✅ Geocoded to: ${location.lat}, ${location.lng}`);
    
    const keyword = name ? `&keyword=${encodeURIComponent(name)}` : '';
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=1000${keyword}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(nearbyUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.length > 0) {
      console.log(`✅ Found ${data.results.length} nearby places`);
      return data.results.slice(0, 3).map((r: any) => r.place_id);
    }
    
    console.log('❌ No nearby results');
    return [];
  } catch (error) {
    console.error('Nearby search error:', error);
    return [];
  }
}

async function searchByText(query: string): Promise<string | null> {
  try {
    console.log('🔍 Text search for:', query);
    
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.candidates?.length > 0) {
      const result = data.candidates[0];
      console.log(`✅ Found: ${result.name}`);
      return result.place_id;
    }
    
    return null;
  } catch (error) {
    console.error('Text search error:', error);
    return null;
  }
}

async function searchByCID(cid: string): Promise<string | null> {
  try {
    console.log('🔍 Converting CID to Place ID:', cid);
    return await searchByText(cid);
  } catch (error) {
    console.error('CID search error:', error);
    return null;
  }
}

// ============================================================================
// PLACE DETAILS FETCHING
// ============================================================================

async function fetchPlaceDetails(placeId: string): Promise<any | null> {
  try {
    console.log('📥 Fetching details for Place ID:', placeId);
    
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,reviews,rating,user_ratings_total,formatted_address,formatted_phone_number,website&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.log('❌ Place details error:', data.status);
      return null;
    }

    const place = data.result;
    const allReviews = place.reviews || [];

    console.log(`✅ ${place.name}`);
    console.log(`   Address: ${place.formatted_address}`);
    console.log(`   Rating: ${place.rating} (${place.user_ratings_total} reviews)`);
    console.log(`   Found: ${allReviews.length} reviews in API response`);

    const fiveStarReviews = allReviews
      .filter((review: any) => review.rating === 5)
      .map((review: any) => ({
        reviewerName: review.author_name,
        reviewText: review.text,
        rating: review.rating,
        date: new Date(review.time * 1000).toISOString().split('T')[0],
        platform: 'Google',
        reviewUrl: review.author_url || undefined,
        profilePhotoUrl: review.profile_photo_url || undefined,
        relativeTime: review.relative_time_description,
        locationName: place.name,
        locationAddress: place.formatted_address,
      }));

    console.log(`   5-star: ${fiveStarReviews.length} reviews`);

    return {
      locationName: place.name,
      locationAddress: place.formatted_address,
      overallRating: place.rating,
      totalReviews: place.user_ratings_total,
      fiveStarReviews,
      allReviewsCount: allReviews.length,
      phone: place.formatted_phone_number,
      website: place.website,
    };
  } catch (error) {
    console.error('Fetch details error:', error);
    return null;
  }
}