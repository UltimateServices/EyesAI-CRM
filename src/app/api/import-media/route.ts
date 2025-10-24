import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface MediaItem {
  url: string;
  type: 'logo' | 'photo' | 'video';
  source: string;
  confidence: number;
  description?: string;
}

interface ImportResult {
  logos: MediaItem[];
  photos: MediaItem[];
  videos: MediaItem[];
  missing: string[];
  socialProfiles: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
    linkedin?: string;
  };
}

// Helper to search Google and get HTML results
async function googleSearch(query: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );
    return await response.text();
  } catch (error) {
    console.error('Google search error:', error);
    return '';
  }
}

// Helper to fetch page content
async function fetchPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    if (!response.ok) return '';
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return '';
  }
}

// Find social media profiles using Claude
async function findSocialProfiles(
  companyName: string,
  city: string,
  website: string
): Promise<{ facebook?: string; youtube?: string; instagram?: string; linkedin?: string }> {
  const profiles: any = {};

  try {
    // Search for each platform
    const searches = [
      { platform: 'facebook', query: `${companyName} ${city} facebook page` },
      { platform: 'youtube', query: `${companyName} ${city} youtube channel` },
      { platform: 'instagram', query: `${companyName} ${city} instagram` },
      { platform: 'linkedin', query: `${companyName} linkedin company page` }
    ];

    for (const { platform, query } of searches) {
      const searchHtml = await googleSearch(query);
      if (!searchHtml) continue;

      const prompt = `Find the official ${platform} URL for "${companyName}" from these Google search results.

Search Results HTML:
${searchHtml.substring(0, 20000)}

Return ONLY the URL if found (e.g., https://www.facebook.com/businessname or https://www.youtube.com/@channelname).
If not found with high confidence, return: NOT_FOUND

URL:`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const url = content.text.trim();
        if (url && url.startsWith('http') && !url.includes('NOT_FOUND')) {
          profiles[platform] = url;
        }
      }
    }
  } catch (error) {
    console.error('Error finding social profiles:', error);
  }

  return profiles;
}

// Find logos using multiple sources
async function findLogos(
  companyName: string,
  website: string,
  socialProfiles: any
): Promise<MediaItem[]> {
  const logos: MediaItem[] = [];

  try {
    // Source 1: Google Image Search for logos
    const imageSearchHtml = await googleSearch(`"${companyName}" logo`);
    
    // Source 2: Company website
    const websiteHtml = await fetchPage(website);
    
    // Source 3: Facebook profile picture (if found)
    let facebookHtml = '';
    if (socialProfiles.facebook) {
      facebookHtml = await fetchPage(socialProfiles.facebook);
    }

    // Use Claude to analyze all sources and find logos
    const prompt = `Analyze these sources and extract logo image URLs for "${companyName}".

Source 1 - Google Image Search Results:
${imageSearchHtml.substring(0, 15000)}

Source 2 - Company Website:
${websiteHtml.substring(0, 15000)}

${facebookHtml ? `Source 3 - Facebook Page:\n${facebookHtml.substring(0, 10000)}` : ''}

Find ALL logo images and return them as a JSON array. For each logo:
- Extract the full image URL
- Confidence score (0.0-1.0) based on:
  * Is it actually a logo? (not a photo or random graphic)
  * Is it square or rectangular?
  * Is it high quality/resolution?
  * Does it appear to be the official company logo?
- Brief description

Return ONLY JSON array in this exact format:
[
  {
    "url": "full_image_url",
    "confidence": 0.95,
    "description": "Official logo from website header",
    "source": "website"
  }
]

Return top 10 highest confidence logos. CRITICAL: Return ONLY the JSON array, no other text.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        for (const item of parsed) {
          logos.push({
            url: item.url.startsWith('http') ? item.url : new URL(item.url, website).href,
            type: 'logo',
            source: item.source || 'unknown',
            confidence: item.confidence || 0.5,
            description: item.description
          });
        }
      }
    }
  } catch (error) {
    console.error('Error finding logos:', error);
  }

  // Sort by confidence and return top 5
  return logos.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

// Find photos using Google Business and website
async function findPhotos(
  companyName: string,
  website: string,
  googleUrl: string | undefined,
  socialProfiles: any
): Promise<MediaItem[]> {
  const photos: MediaItem[] = [];

  try {
    // Source 1: Google Business Photos
    if (GOOGLE_PLACES_API_KEY && googleUrl) {
      const googlePhotos = await fetchGooglePlacePhotos(companyName, googleUrl);
      photos.push(...googlePhotos);
    }

    // Source 2: Website gallery/portfolio
    const websiteHtml = await fetchPage(website);
    
    // Source 3: Facebook page photos
    let facebookHtml = '';
    if (socialProfiles.facebook) {
      facebookHtml = await fetchPage(socialProfiles.facebook);
    }

    // Use Claude to find photo gallery images
    const prompt = `Find high-quality business/service photos for "${companyName}".

Company Website:
${websiteHtml.substring(0, 20000)}

${facebookHtml ? `Facebook Page:\n${facebookHtml.substring(0, 15000)}` : ''}

Extract photo URLs that show:
- Actual business operations/services
- Products or work examples
- Facilities or locations
- Team members at work
- Customer interactions

EXCLUDE:
- Logos or brand graphics
- Icons or UI elements  
- Stock photos
- Screenshots
- Low quality images

Return JSON array:
[
  {
    "url": "full_image_url",
    "confidence": 0.85,
    "description": "Brief description",
    "source": "website" | "facebook"
  }
]

Return top 25 photos. CRITICAL: Return ONLY the JSON array.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        for (const item of parsed) {
          photos.push({
            url: item.url.startsWith('http') ? item.url : new URL(item.url, website).href,
            type: 'photo',
            source: item.source || 'website',
            confidence: item.confidence || 0.5,
            description: item.description
          });
        }
      }
    }
  } catch (error) {
    console.error('Error finding photos:', error);
  }

  // Sort by confidence and return top 20
  return photos.sort((a, b) => b.confidence - a.confidence).slice(0, 20);
}

// Find videos from YouTube and website
async function findVideos(
  companyName: string,
  website: string,
  socialProfiles: any
): Promise<MediaItem[]> {
  const videos: MediaItem[] = [];

  try {
    // Source 1: YouTube channel/videos
    let youtubeHtml = '';
    if (socialProfiles.youtube) {
      youtubeHtml = await fetchPage(socialProfiles.youtube);
    } else {
      // Search for YouTube videos
      const searchHtml = await googleSearch(`${companyName} youtube`);
      youtubeHtml = searchHtml;
    }

    // Source 2: Website embedded videos
    const websiteHtml = await fetchPage(website);

    // Use Claude to find video URLs
    const prompt = `Find video URLs for "${companyName}".

${socialProfiles.youtube ? `YouTube Channel:\n${youtubeHtml.substring(0, 15000)}` : `YouTube Search Results:\n${youtubeHtml.substring(0, 15000)}`}

Company Website:
${websiteHtml.substring(0, 15000)}

Extract video URLs (YouTube, Vimeo, direct video links).
Look for:
- YouTube video IDs or URLs
- Vimeo URLs
- Embedded videos on website
- Direct .mp4 or video file links

Return JSON array:
[
  {
    "url": "video_url_or_youtube_embed",
    "confidence": 0.9,
    "description": "Brief description",
    "source": "youtube" | "website" | "vimeo"
  }
]

For YouTube, return embeddable format: https://www.youtube.com/embed/VIDEO_ID

Return top 10 videos. CRITICAL: Return ONLY the JSON array.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        for (const item of parsed) {
          videos.push({
            url: item.url,
            type: 'video',
            source: item.source || 'unknown',
            confidence: item.confidence || 0.5,
            description: item.description
          });
        }
      }
    }
  } catch (error) {
    console.error('Error finding videos:', error);
  }

  // Sort by confidence and return top 5
  return videos.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

// Google Business Photos (existing function)
async function fetchGooglePlacePhotos(companyName: string, googleUrl?: string): Promise<MediaItem[]> {
  try {
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

    const detailsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_PLACES_API_KEY}`
    );
    const detailsData = await detailsResponse.json();

    if (detailsData.result && detailsData.result.photos) {
      return detailsData.result.photos.slice(0, 10).map((photo: any) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
        type: 'photo' as const,
        source: 'google_business',
        confidence: 0.9,
        description: 'Google Business photo'
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
    const { companyName, website, city, googleUrl } = body;

    if (!companyName || !website) {
      return NextResponse.json(
        { error: 'Company name and website required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting media import for: ${companyName}`);

    // Step 1: Find social media profiles
    console.log('📱 Finding social media profiles...');
    const socialProfiles = await findSocialProfiles(companyName, city || '', website);
    console.log('✅ Social profiles found:', socialProfiles);

    // Step 2: Find media in parallel
    console.log('🖼️  Finding logos, photos, and videos...');
    const [logos, photos, videos] = await Promise.all([
      findLogos(companyName, website, socialProfiles),
      findPhotos(companyName, website, googleUrl, socialProfiles),
      findVideos(companyName, website, socialProfiles)
    ]);

    // Determine what's missing
    const missing: string[] = [];
    if (logos.length === 0) missing.push('logos');
    if (photos.length === 0) missing.push('photos');
    if (videos.length === 0) missing.push('videos');

    const result: ImportResult = {
      logos,
      photos,
      videos,
      missing,
      socialProfiles
    };

    console.log(`✅ Import complete: ${logos.length} logos, ${photos.length} photos, ${videos.length} videos`);
    if (missing.length > 0) {
      console.log(`⚠️  Missing: ${missing.join(', ')}`);
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Import media error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}