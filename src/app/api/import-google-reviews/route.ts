import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { googleMapsUrls, companyName, companyAddress } = await request.json();

    console.log('📍 Starting import process');
    console.log('Company:', companyName);
    console.log('Total URLs to process:', googleMapsUrls.length);

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

    // Process each URL
    for (let i = 0; i < googleMapsUrls.length; i++) {
      const url = googleMapsUrls[i];
      console.log(`\n[${i + 1}/${googleMapsUrls.length}] Processing: ${url}`);
      
      const placeId = await extractPlaceIdFromUrl(url);
      
      if (!placeId) {
        console.log('❌ Could not extract Place ID from:', url);
        continue;
      }

      // Skip duplicates
      if (processedPlaceIds.has(placeId)) {
        console.log('⚠️ Duplicate Place ID, skipping');
        continue;
      }
      processedPlaceIds.add(placeId);

      console.log('✅ Place ID:', placeId);
      console.log('🔍 Fetching details...');

      const locationData = await fetchPlaceDetails(placeId);
      
      if (locationData) {
        allLocationData.push(locationData);
        totalFiveStarReviews += locationData.fiveStarReviews.length;
        totalAllReviews += locationData.allReviewsCount;
        console.log(`✅ ${locationData.locationName}: ${locationData.fiveStarReviews.length} 5-star reviews`);
      }
    }

    // Fallback: Try company name + address if nothing found
    if (allLocationData.length === 0 && companyName && companyAddress) {
      console.log('\n🔍 No results from URLs, trying company name + address...');
      const searchQuery = `${companyName} ${companyAddress}`;
      const placeId = await searchByText(searchQuery);
      
      if (placeId && !processedPlaceIds.has(placeId)) {
        const locationData = await fetchPlaceDetails(placeId);
        if (locationData) {
          allLocationData.push(locationData);
          totalFiveStarReviews += locationData.fiveStarReviews.length;
          totalAllReviews += locationData.allReviewsCount;
        }
      }
    }

    if (allLocationData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Could not find any businesses to import reviews from.\n\nTry:\n1. Make sure the business has a Google Business Profile\n2. Use direct Google Maps share links\n3. Check that the URLs are correct' 
        },
        { status: 400 }
      );
    }

    const allFiveStarReviews = allLocationData.flatMap(location => location.fiveStarReviews);

    console.log(`\n✅ SUCCESS: Imported ${totalFiveStarReviews} 5-star reviews from ${allLocationData.length} locations`);

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
    console.error('❌ Import error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function extractPlaceIdFromUrl(url: string): Promise<string | null> {
  try {
    // Method 1: Handle ?q= query format
    // Example: https://maps.google.com/?q=Carpet+Depot+3080+Hempstead+Tpke+Levittown+NY
    if (url.includes('?q=') || url.includes('&q=')) {
      const queryMatch = url.match(/[?&]q=([^&)]+)/);
      if (queryMatch) {
        let query = decodeURIComponent(queryMatch[1]);
        query = query.replace(/\+/g, ' ').trim();
        // Remove trailing parenthesis if present
        query = query.replace(/\)$/, '');
        console.log('🔍 Extracted query:', query);
        return await searchByText(query);
      }
    }

    // Method 2: Direct place_id parameter
    const placeIdMatch = url.match(/place_id=([A-Za-z0-9_-]+)/);
    if (placeIdMatch) {
      console.log('✅ Found place_id parameter');
      return placeIdMatch[1];
    }

    // Method 3: Extract from !1s in data parameter
    const dataMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
    if (dataMatch) {
      console.log('✅ Extracted from data parameter');
      return dataMatch[1];
    }

    // Method 4: Extract business name from /place/ URL
    const placeNameMatch = url.match(/\/maps\/place\/([^/@?]+)/);
    if (placeNameMatch) {
      const placeName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
      console.log('🔍 Extracted place name:', placeName);
      return await searchByText(placeName);
    }

    // Method 5: Handle shortened URLs
    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      console.log('🔄 Attempting to resolve shortened URL...');
      try {
        const response = await fetch(url, { 
          method: 'HEAD', 
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const resolvedUrl = response.url;
        console.log('✅ Resolved to:', resolvedUrl.substring(0, 80));
        return await extractPlaceIdFromUrl(resolvedUrl);
      } catch (e) {
        console.log('❌ Failed to resolve shortened URL');
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting Place ID:', error);
    return null;
  }
}

async function searchByText(query: string): Promise<string | null> {
  try {
    console.log('🔍 Searching Places API for:', query);
    
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
      const result = data.candidates[0];
      console.log('✅ Found:', result.name, '-', result.formatted_address);
      return result.place_id;
    } else {
      console.log('❌ No results from text search. Status:', data.status);
    }
    
    return null;
  } catch (error) {
    console.error('Text search error:', error);
    return null;
  }
}

async function fetchPlaceDetails(placeId: string): Promise<any | null> {
  try {
    const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,reviews,rating,user_ratings_total,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(placeDetailsUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.log('❌ Place details error:', data.status, data.error_message || '');
      return null;
    }

    const placeDetails = data.result;
    const allReviews = placeDetails.reviews || [];

    if (allReviews.length === 0) {
      console.log('⚠️ No reviews found for this location');
    }

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
        locationName: placeDetails.name,
        locationAddress: placeDetails.formatted_address,
      }));

    return {
      locationName: placeDetails.name,
      locationAddress: placeDetails.formatted_address,
      overallRating: placeDetails.rating,
      totalReviews: placeDetails.user_ratings_total,
      fiveStarReviews,
      allReviewsCount: allReviews.length,
    };
  } catch (error) {
    console.error('Fetch place details error:', error);
    return null;
  }
}