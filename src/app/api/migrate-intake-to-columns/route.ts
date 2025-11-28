import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/migrate-intake-to-columns - Extract intake romaData to company columns
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Fetch all companies for this organization
    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('organization_id', membership.organization_id);

    if (fetchError) {
      console.error('Error fetching companies:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch companies', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No companies to migrate',
        migrated: 0,
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ companyId: string; companyName: string; error: string }>,
    };

    for (const company of companies) {
      try {
        // Get intake data for this company
        const { data: intake, error: intakeError } = await supabase
          .from('intakes')
          .select('roma_data, gallery_links')
          .eq('company_id', company.id)
          .single();

        if (intakeError || !intake?.roma_data) {
          console.log(`No intake data for ${company.name}, skipping`);
          results.skipped++;
          continue;
        }

        const romaData = intake.roma_data;

        // Helper to safely get nested values
        const safeGet = (obj: any, path: string, fallback: any = null) => {
          try {
            return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? fallback;
          } catch {
            return fallback;
          }
        };

        // Helper to safely get array values
        const safeArray = (value: any): any[] => {
          if (Array.isArray(value)) return value;
          if (value && typeof value === 'object') return Object.values(value);
          return [];
        };

        // Extract data from romaData
        const updates: any = {};

        // 1. AI Summary (from ai_overview.overview_line)
        const aiOverview = safeGet(romaData, 'ai_overview.overview_line');
        if (aiOverview && aiOverview !== '<>') {
          updates.ai_summary = aiOverview;
        }

        // 2. About (from about_and_badges.ai_summary_120w)
        const about = safeGet(romaData, 'about_and_badges.ai_summary_120w');
        if (about && about !== '<>') {
          updates.about = about;
        }

        // 3. Tagline (from hero.tagline)
        const tagline = safeGet(romaData, 'hero.tagline');
        if (tagline && tagline !== '<>') {
          updates.tagline = tagline;
        }

        // 4. Tags/Badges (from about_and_badges.company_badges)
        const badges = safeArray(safeGet(romaData, 'about_and_badges.company_badges'));
        if (badges.length > 0) {
          badges.slice(0, 4).forEach((badge: any, idx: number) => {
            const badgeText = typeof badge === 'string' ? badge :
                            (badge?.text || badge?.icon || JSON.stringify(badge));
            if (badgeText && badgeText !== '<>') {
              updates[`tag${idx + 1}`] = badgeText;
            }
          });
        }

        // 5. Contact Information
        const locations = safeGet(romaData, 'locations_and_hours');

        // Phone (try multiple locations)
        const phone = safeGet(locations, 'primary_location.phone') ||
                     safeGet(romaData, 'hero.quick_actions.call_tel') ||
                     safeGet(romaData, 'footer.phone_e164');
        if (phone && phone !== '<>' && phone !== 'tel:<>') {
          updates.phone = phone.replace('tel:', '');
        }

        // Email
        const email = safeGet(romaData, 'hero.quick_actions.email_mailto') ||
                     safeGet(romaData, 'footer.email');
        if (email && email !== '<>' && email !== 'mailto:<>') {
          updates.email = email.replace('mailto:', '');
        }

        // Address
        const address = safeGet(locations, 'primary_location.full_address') ||
                       safeGet(locations, 'full_address') ||
                       safeGet(locations, 'primary_location.address_line_1') ||
                       safeGet(locations, 'address_line_1');
        if (address && address !== '<>') {
          updates.address = address;
        }

        // City
        const city = safeGet(locations, 'primary_location.city') ||
                    safeGet(locations, 'city');
        if (city && city !== '<>') {
          updates.city = city;
        }

        // State
        const state = safeGet(locations, 'primary_location.state') ||
                     safeGet(locations, 'state');
        if (state && state !== '<>') {
          updates.state = state;
        }

        // ZIP
        const zip = safeGet(locations, 'primary_location.zip') ||
                   safeGet(locations, 'zip') ||
                   safeGet(locations, 'primary_location.postalCode');
        if (zip && zip !== '<>') {
          updates.zip = zip;
        }

        // Google Maps URL
        const mapsUrl = safeGet(romaData, 'hero.quick_actions.maps_link') ||
                       safeGet(romaData, 'footer.get_directions_url');
        if (mapsUrl && mapsUrl !== '<>' && mapsUrl !== 'https://maps.google.com/?q=<>') {
          updates.google_maps_url = mapsUrl;
        }

        // 6. Pricing Information (from pricing_information.summary_line)
        const pricingInfo = safeGet(romaData, 'pricing_information.summary_line');
        if (pricingInfo && pricingInfo !== '<>') {
          updates.pricing_info = pricingInfo;
        }

        // 7. Social Media URLs
        const socialLinks = safeGet(romaData, 'footer.social') || {};

        if (socialLinks.facebook && socialLinks.facebook !== '<>') {
          updates.facebook_url = socialLinks.facebook;
        }
        if (socialLinks.instagram && socialLinks.instagram !== '<>') {
          updates.instagram_url = socialLinks.instagram;
        }
        if (socialLinks.youtube && socialLinks.youtube !== '<>') {
          updates.youtube_url = socialLinks.youtube;
        }

        // If we have any updates, apply them
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', company.id);

          if (updateError) {
            console.error(`Failed to update ${company.name}:`, updateError);
            results.failed++;
            results.errors.push({
              companyId: company.id,
              companyName: company.name,
              error: updateError.message
            });
          } else {
            console.log(`✅ Migrated data for ${company.name}:`, Object.keys(updates));
            results.successful++;
          }
        } else {
          console.log(`No usable data to migrate for ${company.name}`);
          results.skipped++;
        }

      } catch (error) {
        console.error(`Error migrating ${company.name}:`, error);
        results.failed++;
        results.errors.push({
          companyId: company.id,
          companyName: company.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migrated ${results.successful} of ${companies.length} companies`,
      migrated: results.successful,
      skipped: results.skipped,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Migration failed',
        details: 'Could not migrate intake data to company columns'
      },
      { status: 500 }
    );
  }
}
