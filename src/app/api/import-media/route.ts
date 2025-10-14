import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface MediaItem {
  url: string;
  type: 'logo' | 'photo';
  source: 'website' | 'google';
  confidence: number;
}

async function scrapeWebsiteForImages(websiteUrl: string): Promise<MediaItem[]> {
  try {
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();
    
    // Use Claude to analyze the HTML and find images
    const prompt = `Analyze this website HTML and extract ALL image URLs. Categorize each as either 'logo' or 'photo'.

For logos, look for:
- Images in header/nav with names containing: logo, brand, icon
- Small square images (likely logos)
- Images linked multiple times (header logos)

For photos, look for:
- Gallery images
- Background images in CSS
- Large images in main content
- Portfolio/work images

Return ONLY a JSON array of objects with this exact format:
[
  {"url": "full_image_url", "type": "logo", "confidence": 0.9},
  {"url": "full_image_url", "type": "photo", "confidence": 0.8}
]

Website HTML (first 50000 chars):
${html.substring(0, 50000)}

CRITICAL: Return ONLY the JSON array, no other text.`;

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = aiResponse.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const images = JSON.parse(jsonMatch[0]);
        return images.map((img: any) => ({
          url: img.url.startsWith('http') ? img.url : new URL(img.url, websiteUrl).href,
          type: img.type,
          source: 'website' as const,
          confidence: img.confidence || 0.5,
        }));
      }
    }
  } catch (error) {
    console.error('Error scraping website:', error);
  }

  return [];
}

async function fetchGooglePlacePhotos(companyName: string, googleUrl?: string): Promise<MediaItem[]> {
  try {
    // Find Place ID
    let placeId = null;
    
    if (googleUrl) {
      const placeIdMatch = googleUrl.match(/place\/[^\/]+\/data=.*!3m1!4b1!4m\d+!3m\d+!1s([^!]+)/);
      if (placeIdMatch) placeId = placeIdMatch[1];
    }

    if (!placeId) {
      const searchResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(companyName)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`
      );
      const searchData = await searchResponse.json();
      if (searchData.candidates && searchData.candidates[0]) {
        placeId = searchData.candidates[0].place_id;
      }
    }

    if (!placeId) return [];

    // Get place details with photos
    const detailsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_PLACES_API_KEY}`
    );
    const detailsData = await detailsResponse.json();

    if (detailsData.result && detailsData.result.photos) {
      return detailsData.result.photos.map((photo: any) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
        type: 'photo' as const,
        source: 'google' as const,
        confidence: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error fetching Google photos:', error);
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, websiteUrl, googleUrl } = body;

    if (!companyName) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 });
    }

    const allMedia: MediaItem[] = [];

    // Scrape website for images
    if (websiteUrl) {
      const websiteImages = await scrapeWebsiteForImages(websiteUrl);
      allMedia.push(...websiteImages);
    }

    // Fetch Google Business photos
    if (GOOGLE_PLACES_API_KEY) {
      const googlePhotos = await fetchGooglePlacePhotos(companyName, googleUrl);
      allMedia.push(...googlePhotos);
    }

    // Sort by confidence
    allMedia.sort((a, b) => b.confidence - a.confidence);

    // Separate logos and photos
    const logos = allMedia.filter(m => m.type === 'logo').slice(0, 5);
    const photos = allMedia.filter(m => m.type === 'photo').slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        logos,
        photos,
        total: allMedia.length,
      },
    });
  } catch (error) {
    console.error('Import media error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}