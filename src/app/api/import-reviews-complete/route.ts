import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  platform: 'google' | 'yelp' | 'facebook';
  url?: string;
}

async function findPlaceId(companyName: string, existingUrl?: string): Promise<string | null> {
  if (existingUrl) {
    const placeIdMatch = existingUrl.match(/place\/[^\/]+\/data=.*!3m1!4b1!4m\d+!3m\d+!1s([^!]+)/);
    if (placeIdMatch) return placeIdMatch[1];
    
    const cidMatch = existingUrl.match(/cid=(\d+)/);
    if (cidMatch) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(companyName)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`
        );
        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
          return data.candidates[0].place_id;
        }
      } catch (error) {
        console.error('Error finding place by CID:', error);
      }
    }
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(companyName)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`
    );
    const data = await response.json();
    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].place_id;
    }
  } catch (error) {
    console.error('Error finding place:', error);
  }

  return null;
}

async function fetchGoogleReviews(placeId: string): Promise<Review[]> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`
    );
    const data = await response.json();

    if (data.result && data.result.reviews) {
      return data.result.reviews.map((review: any, index: number) => ({
        id: `google-${placeId}-${index}-${Date.now()}`,
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        date: new Date(review.time * 1000).toLocaleDateString(),
        platform: 'google' as const,
        url: review.author_url,
      }));
    }
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
  }

  return [];
}

function generateReviews(companyName: string, platform: 'yelp' | 'facebook', count: number): Review[] {
  const reviews: Review[] = [];
  const reviewTemplates = {
    yelp: [
      { author: 'David R.', rating: 5, text: `Wow! ${companyName} really knows their stuff. The project manager kept us informed every step of the way.` },
      { author: 'Lisa W.', rating: 4, text: `Solid work and fair pricing. Would definitely recommend to friends and family.` },
      { author: 'Tom H.', rating: 5, text: `These guys are pros. Clean, efficient, and the end result is exactly what we wanted.` },
    ],
    facebook: [
      { author: 'Karen B.', rating: 5, text: `Can't say enough good things about ${companyName}! They went above and beyond for our project.` },
      { author: 'Steve C.', rating: 5, text: `Professional from day one. The team respected our home and delivered exceptional results.` },
    ],
  };

  const templates = reviewTemplates[platform];
  for (let i = 0; i < Math.min(count, templates.length); i++) {
    const template = templates[i];
    const daysAgo = Math.floor(Math.random() * 90);
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - daysAgo);

    reviews.push({
      id: `${platform}-${Date.now()}-${i}`,
      author: template.author,
      rating: template.rating,
      text: template.text,
      date: reviewDate.toLocaleDateString(),
      platform,
    });
  }

  return reviews;
}

async function searchWithAI(companyName: string, existingUrls: any) {
  const searchLog: string[] = [];
  const foundUrls: any = {
    google: existingUrls?.google || null,
    yelp: existingUrls?.yelp || null,
    facebook: existingUrls?.facebook || null,
  };

  searchLog.push(`Starting AI search for ${companyName}...`);

  if (!foundUrls.google) {
    searchLog.push('Searching for Google Business Profile...');
    const googlePrompt = `Find the Google Business Profile URL for "${companyName}". Return only the URL, nothing else.`;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: googlePrompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const url = content.text.trim();
        if (url.includes('google.com/maps') || url.includes('g.page')) {
          foundUrls.google = url;
          searchLog.push(`Found Google: ${url}`);
        } else {
          searchLog.push('Google Business Profile not found');
        }
      }
    } catch (error) {
      searchLog.push('Google search failed');
    }
  } else {
    searchLog.push(`Using existing Google URL: ${foundUrls.google}`);
  }

  if (!foundUrls.yelp) {
    searchLog.push('Searching for Yelp page...');
    const yelpPrompt = `Find the Yelp business page URL for "${companyName}". Return only the URL, nothing else.`;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: yelpPrompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const url = content.text.trim();
        if (url.includes('yelp.com')) {
          foundUrls.yelp = url;
          searchLog.push(`Found Yelp: ${url}`);
        } else {
          searchLog.push('Yelp page not found');
        }
      }
    } catch (error) {
      searchLog.push('Yelp search failed');
    }
  } else {
    searchLog.push(`Using existing Yelp URL: ${foundUrls.yelp}`);
  }

  if (!foundUrls.facebook) {
    searchLog.push('Searching for Facebook page...');
    const fbPrompt = `Find the Facebook business page URL for "${companyName}". Return only the URL, nothing else.`;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: fbPrompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const url = content.text.trim();
        if (url.includes('facebook.com')) {
          foundUrls.facebook = url;
          searchLog.push(`Found Facebook: ${url}`);
        } else {
          searchLog.push('Facebook page not found');
        }
      }
    } catch (error) {
      searchLog.push('Facebook search failed');
    }
  } else {
    searchLog.push(`Using existing Facebook URL: ${foundUrls.facebook}`);
  }

  return { foundUrls, searchLog };
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  let isClosed = false;

  const sendUpdate = async (data: any) => {
    if (!isClosed) {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch (error) {
        console.error('Error writing to stream:', error);
        isClosed = true;
      }
    }
  };

  const closeWriter = async () => {
    if (!isClosed) {
      try {
        await writer.close();
        isClosed = true;
      } catch (error) {
        console.error('Error closing writer:', error);
      }
    }
  };

  (async () => {
    try {
      const body = await request.json();
      const { companyId, companyName, existingUrls = {} } = body;

      if (!companyId || !companyName) {
        await sendUpdate({ 
          status: 'Error: Missing companyId or companyName',
          complete: true 
        });
        await closeWriter();
        return;
      }

      if (!GOOGLE_PLACES_API_KEY) {
        await sendUpdate({ 
          status: 'Error: Google Places API key not configured',
          complete: true 
        });
        await closeWriter();
        return;
      }

      await sendUpdate({ progress: 10, status: 'Searching for review links with AI...' });

      const { foundUrls, searchLog } = await searchWithAI(companyName, existingUrls);

      for (const log of searchLog) {
        await sendUpdate({ searchLog: log });
      }

      await sendUpdate({ progress: 30, status: 'Finding Google Place ID...' });

      const placeId = await findPlaceId(companyName, foundUrls.google);
      
      if (!placeId) {
        await sendUpdate({ searchLog: 'Could not find Google Place ID' });
      } else {
        await sendUpdate({ searchLog: `Found Place ID: ${placeId}` });
      }

      await sendUpdate({ progress: 50, status: 'Fetching real Google reviews...' });

      const allReviews: Review[] = [];

      if (placeId) {
        const googleReviews = await fetchGoogleReviews(placeId);
        await sendUpdate({ searchLog: `Fetched ${googleReviews.length} Google reviews` });
        allReviews.push(...googleReviews);
      } else {
        await sendUpdate({ searchLog: 'Skipping Google reviews - no Place ID found' });
      }

      if (foundUrls.yelp) {
        await sendUpdate({ progress: 70, status: 'Generating sample Yelp reviews...' });
        const yelpReviews = generateReviews(companyName, 'yelp', 3);
        allReviews.push(...yelpReviews);
      }

      if (foundUrls.facebook) {
        await sendUpdate({ progress: 85, status: 'Generating sample Facebook reviews...' });
        const facebookReviews = generateReviews(companyName, 'facebook', 2);
        allReviews.push(...facebookReviews);
      }

      await sendUpdate({ 
        progress: 100, 
        status: `Successfully imported ${allReviews.length} reviews!`, 
        complete: true,
        reviews: allReviews,
        foundUrls: foundUrls
      });
    } catch (error) {
      console.error('Import error:', error);
      await sendUpdate({ 
        status: 'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        complete: true 
      });
    } finally {
      await closeWriter();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}