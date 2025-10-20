'use client';

import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Star,
  ExternalLink,
  Camera,
  Calendar,
  CheckCircle,
  Building2,
  Users,
  Shield,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface CompanyOverviewProps {
  company: Company;
}

export function CompanyOverview({ company }: CompanyOverviewProps) {
  const [expandedService, setExpandedService] = useState<number | null>(null);

  // Determine service section title based on business type
  const getServiceTitle = (businessName: string, category?: string) => {
    const name = businessName.toLowerCase();
    const cat = category?.toLowerCase() || '';
    
    if (name.includes('restaurant') || name.includes('cafe') || name.includes('bar') || 
        name.includes('bakery') || cat.includes('food') || cat.includes('restaurant')) {
      return 'Our Menu';
    }
    if (name.includes('spa') || name.includes('salon') || name.includes('medical') || 
        name.includes('dental') || cat.includes('beauty') || cat.includes('wellness')) {
      return 'Treatments';
    }
    if (name.includes('store') || name.includes('shop') || name.includes('retail') ||
        cat.includes('retail') || cat.includes('store')) {
      return 'Products';
    }
    if (name.includes('tech') || name.includes('software') || name.includes('consulting') ||
        cat.includes('technology') || cat.includes('b2b')) {
      return 'Solutions';
    }
    if (name.includes('photography') || name.includes('event') || name.includes('travel') ||
        cat.includes('photography') || cat.includes('events')) {
      return 'Packages';
    }
    if (name.includes('fitness') || name.includes('education') || name.includes('training') ||
        cat.includes('fitness') || cat.includes('education')) {
      return 'Programs';
    }
    
    return 'Our Services'; // Default for 90% of businesses
  };

  // Mock ROMA-PDF structure data matching the PDF exactly
  const profileData = {
    metadata: {
      template: "EyesAI-Roma-PDF",
      profile_layout_version: "Roma-v10.3",
      slug: company.name.toLowerCase().replace(/\s+/g, '-'),
      category: "Beauty Salon"
    },
    ai_overview: {
      overview_line: `${company.name} is a full-service beauty salon serving Long Beach, NY. This Eyes AI verified profile includes services, reviews, and verified data for search and AI assistants.`,
      last_verified: "October 2025"
    },
    hero: {
      logo_url: company.logoUrl || "<>",
      company_name: company.name,
      eyes_handle: `@${company.name.toLowerCase().replace(/\s+/g, '-')}`,
      descriptor_line: "Chic, Glamorous & Family-Oriented Beauty Salon",
      quick_actions: {
        call_tel: company.phone ? `tel:${company.phone}` : "tel:+15164312959",
        website_url: company.website || "https://salonapp.com",
        email_mailto: company.contactEmail ? `mailto:${company.contactEmail}` : "mailto:info@salonapp.com",
        maps_link: "https://maps.google.com/?q=174+W+Park+Ave,+Long+Beach,+NY+11561"
      },
      badges: [
        "Verified Oct 2025",
        "Google Indexed", 
        "AI-Discoverable",
        "Updated Monthly"
      ]
    },
    about_and_badges: {
      ai_summary_120w: `${company.name} is Long Beach's premier beauty destination, reinvented as a chic, glamorous, stylish, and family-oriented salon located in the heart of Park Avenue. Our group of skilled professionals specializes in enhancing the inner and outer beauty of our clients through service excellence, constant innovation, and continuous education.`,
      company_badges: ["Chic", "Glamorous", "Stylish", "Family-Oriented"]
    },
    services: [
      {
        emoji: "✂️",
        title: "Haircuts & Styling",
        summary_1line: "Professional cuts and styling for all hair types",
        whats_included: ["Consultation", "Wash & Cut", "Style & Finish", "Product Recommendations"],
        whats_not_included: ["Color services", "Chemical treatments", "Extensions"],
        duration: "45-60 minutes",
        pricing_label: "$65-$85",
        learn_more_url: company.website || "<>"
      },
      {
        emoji: "🎨",
        title: "Color Services",
        summary_1line: "Full color, highlights, and color correction",
        whats_included: ["Color consultation", "Application", "Gloss treatment", "Style"],
        whats_not_included: ["Cut (additional)", "Deep conditioning treatment"],
        duration: "2-4 hours",
        pricing_label: "$95-$250",
        learn_more_url: company.website || "<>"
      },
      {
        emoji: "💅",
        title: "Nail Services",
        summary_1line: "Manicures, pedicures, and nail art",
        whats_included: ["Nail shaping", "Cuticle care", "Polish application", "Hand massage"],
        whats_not_included: ["Gel removal from other salons", "Nail repairs"],
        duration: "30-45 minutes",
        pricing_label: "$30-$75",
        learn_more_url: company.website || "<>"
      },
      {
        emoji: "✨",
        title: "Facial Treatments",
        summary_1line: "Rejuvenating facial treatments for all skin types",
        whats_included: ["Skin analysis", "Deep cleansing", "Treatment mask", "Moisturizing"],
        whats_not_included: ["Chemical peels", "Advanced treatments"],
        duration: "60-75 minutes",
        pricing_label: "$85-$150",
        learn_more_url: company.website || "<>"
      },
      {
        emoji: "👰",
        title: "Bridal Packages",
        summary_1line: "Complete bridal beauty packages for your special day",
        whats_included: ["Trial session", "Wedding day service", "Touch-up kit", "Photography"],
        whats_not_included: ["Travel beyond 10 miles", "Additional attendants"],
        duration: "3-5 hours",
        pricing_label: "Starting at $250",
        learn_more_url: company.website || "<>"
      }
    ],
    quick_reference_guide: {
      columns: [
        {
          title: "Service Type",
          rows: ["Haircuts & Styling", "Color Services", "Nail Services", "Facial Treatments", "Bridal Packages"]
        },
        {
          title: "Duration", 
          rows: ["45-60 min", "2-4 hours", "30-45 min", "60-75 min", "3-5 hours"]
        },
        {
          title: "Complexity",
          rows: ["Low", "Medium-High", "Low", "Medium", "High"]
        },
        {
          title: "Best For",
          rows: ["Regular maintenance", "Color changes", "Special occasions", "Skin care", "Weddings"]
        },
        {
          title: "Price Range",
          rows: ["$65-$85", "$95-$250", "$30-$75", "$85-$150", "$250+"]
        }
      ]
    },
    pricing_information: {
      summary_line: "Haircuts $65-$85. Color services $95-$250. Nails $30-$75. Facials $85-$150. Bridal packages start at $250. Call (516) 431-2959 for custom quotes and package pricing.",
      currency_symbol: "$",
      cta_buttons: [
        { label: `Go to ${company.name} Website`, url: company.website || "<>" },
        { label: `Call ${company.name}`, url: "tel:+15164312959" }
      ]
    },
    what_to_expect: [
      {
        emoji: "📞",
        title: "Initial Consultation",
        recommended_for: "All new clients",
        whats_involved: ["Discuss your vision", "Hair/skin analysis", "Service recommendation"],
        pro_tip: "Bring photos of styles you love to help communicate your vision clearly."
      },
      {
        emoji: "📋", 
        title: "Service Preparation",
        recommended_for: "All appointments",
        whats_involved: ["Gown and prep", "Product selection", "Final consultation"],
        pro_tip: "Arrive with clean, dry hair for most services to ensure best results."
      },
      {
        emoji: "✂️",
        title: "Service Execution",
        recommended_for: "All services", 
        whats_involved: ["Professional application", "Step-by-step process", "Quality checks"],
        pro_tip: "Feel free to ask questions during your service - we love educating our clients."
      },
      {
        emoji: "🎯",
        title: "Styling & Finishing",
        recommended_for: "Hair services",
        whats_involved: ["Professional styling", "Product application", "Final touches"],
        pro_tip: "Pay attention to styling techniques - we'll teach you to recreate the look at home."
      },
      {
        emoji: "📸",
        title: "Final Reveal",
        recommended_for: "All transformations",
        whats_involved: ["Mirror reveal", "Photo opportunities", "Service review"],
        pro_tip: "Take photos in natural light to see your true color and style results."
      },
      {
        emoji: "🏠",
        title: "Home Care Guidance",
        recommended_for: "All clients",
        whats_involved: ["Product recommendations", "Maintenance tips", "Next appointment"],
        pro_tip: "Book your next appointment before leaving to maintain your gorgeous results."
      }
    ],
    locations_and_hours: {
      locations: [
        {
          label: "📍 Primary Location",
          address: {
            line1: "174 W Park Ave",
            city: "Long Beach",
            state: "NY",
            zip: "11561"
          },
          maps_link: "https://maps.google.com/?q=174+W+Park+Ave,+Long+Beach,+NY+11561",
          opening_hours: [
            { day: "Monday", open: "10:00 AM", close: "7:00 PM", status: "Open" },
            { day: "Tuesday", open: "10:00 AM", close: "7:00 PM", status: "Open" },
            { day: "Wednesday", open: "10:00 AM", close: "7:00 PM", status: "Open" },
            { day: "Thursday", open: "10:00 AM", close: "8:00 PM", status: "Open" },
            { day: "Friday", open: "10:00 AM", close: "8:00 PM", status: "Open" },
            { day: "Saturday", open: "9:00 AM", close: "6:00 PM", status: "Open" },
            { day: "Sunday", open: "10:00 AM", close: "5:00 PM", status: "Open" }
          ],
          hours_note: "Holiday hours may vary",
          service_area_text: "Serving Long Beach, Oceanside, Island Park, Lido Beach, and surrounding Nassau County communities"
        }
      ]
    },
    faqs: {
      all_questions: [
        {
          category: "Appointments",
          items: [
            { q: "How far in advance should I book?", a: "We recommend booking 1-2 weeks in advance, especially for weekends and special events." },
            { q: "What is your cancellation policy?", a: "Please give us 24 hours notice for cancellations to avoid a fee." },
            { q: "Do you accept walk-ins?", a: "We accept walk-ins based on availability, but appointments are recommended." }
          ]
        },
        {
          category: "Services", 
          items: [
            { q: "Do you offer consultations?", a: "Yes, we offer complimentary consultations for all color and major cut services." },
            { q: "What products do you use?", a: "We use professional-grade products including Redken, Olaplex, and OPI." },
            { q: "Do you do men's cuts?", a: "Absolutely! We welcome clients of all genders and ages." }
          ]
        },
        {
          category: "Pricing",
          items: [
            { q: "Do you offer package deals?", a: "Yes, we have bridal packages and seasonal promotions throughout the year." },
            { q: "What payment methods do you accept?", a: "We accept cash, all major credit cards, and digital payments." },
            { q: "Do you offer student discounts?", a: "Yes, students receive 10% off with valid ID on Tuesday-Thursday." }
          ]
        },
        {
          category: "Policies",
          items: [
            { q: "What is your tipping policy?", a: "Tips are appreciated but never required. Standard is 18-20% for exceptional service." },
            { q: "Do you have parking?", a: "Yes, we have dedicated parking spaces behind the salon." },
            { q: "Are you family-friendly?", a: "Absolutely! We welcome families and have special accommodations for children." }
          ]
        },
        {
          category: "Special Services",
          items: [
            { q: "Do you do weddings?", a: "Yes! We offer on-site bridal services and bridal party packages." },
            { q: "Can you match a color from a photo?", a: "Our colorists are experts at color matching - bring your inspiration photos!" },
            { q: "Do you offer hair extensions?", a: "Yes, we offer several types of extensions including tape-in and clip-in options." }
          ]
        }
      ],
      whats_new: {
        month_label: "October 2025",
        items: [
          { q: "What's new this month at the salon?", a: "We've added new fall color trends and introduced scalp treatment services." },
          { q: "Any October specials?", a: "Book any color service and receive 20% off a deep conditioning treatment." },
          { q: "New team members?", a: "Please welcome Sarah, our new nail technician specializing in nail art and gel services." }
        ]
      }
    },
    featured_reviews: {
      section_heading: "Featured Reviews",
      items: [
        {
          reviewer: "Jennifer M.",
          stars: 5,
          date: "September 2025",
          excerpt: "Amazing experience! The team really listened to what I wanted and delivered exactly that. My hair has never looked better!",
          source: "Google",
          platform_icon: "⭐",
          url: "<>"
        },
        {
          reviewer: "Maria S.", 
          stars: 5,
          date: "August 2025",
          excerpt: "Best salon on Long Island! Professional, clean, and the results are always perfect. Highly recommend!",
          source: "Yelp",
          platform_icon: "⭐",
          url: "<>"
        },
        {
          reviewer: "Lisa K.",
          stars: 5,
          date: "September 2025", 
          excerpt: "The bridal package was phenomenal. They made my wedding day so special and stress-free. Thank you!",
          source: "Google",
          platform_icon: "⭐",
          url: "<>"
        }
      ]
    },
    photo_gallery: {
      layout: "horizontal_strip",
      images: [
        { image_url: "<>", alt: "Salon on Park modern interior with styling stations in Long Beach NY" },
        { image_url: "<>", alt: "Professional hair coloring service at Salon on Park" },
        { image_url: "<>", alt: "Luxury nail station and pedicure area" },
        { image_url: "<>", alt: "Facial treatment room with relaxing ambiance" },
        { image_url: "<>", alt: "Bridal styling preparation area" },
        { image_url: "<>", alt: "Reception and product display area" }
      ]
    },
    eyes_ai_monthly_activity: {
      discover: ["1 Blog", "1 Facebook", "1 YouTube", "1 X Post"],
      verified: ["1 Blog", "1 Facebook", "1 YouTube", "1 X", "1 TikTok (verified)", "1 Instagram (verified)", "1 YouTube Short (verified)"],
      note: "Additional activities including citations, backlinks, and performance metrics are detailed in your Monthly Report"
    },
    get_in_touch: {
      company_name: company.name,
      city_state: "Long Beach, NY",
      buttons: [
        { label: "Call Now", url: "tel:+15164312959" },
        { label: "Visit Website", url: company.website || "<>" },
        { label: "Send Message", url: company.contactEmail ? `mailto:${company.contactEmail}` : "<>" }
      ]
    },
    footer: {
      company: company.name,
      phone_e164: "+15164312959",
      email: company.contactEmail || "info@salonapp.com",
      website: company.website || "https://salonapp.com",
      visit_us_address: "174 W Park Ave, Long Beach, NY 11561",
      hours_recap: "Mon–Wed 10–7 • Thu–Fri 10–8 • Sat 9–6 • Sun 10–5",
      social: {
        facebook: "<>",
        instagram: "<>", 
        tiktok: "<>",
        youtube: "<>",
        linkedin: "<>"
      }
    },
    audit: {
      phase: "complete",
      last_updated: "October 2025",
      va_tasks_grouped: {
        Media: ["Confirm logo + 6 photos"],
        Content: ["Verify 3 reviews, pricing"],
        Contact: ["Verify phone/email/hours/address"]
      },
      resume_token: "ROMA-OK"
    }
  };

  const serviceTitle = getServiceTitle(company.name, profileData.metadata.category);

  return (
    <div className="space-y-8">
      {/* Section 1: AI Overview Bar */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-blue-800 font-medium flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <strong>AI Summary:</strong> {profileData.ai_overview.overview_line}
        </p>
      </Card>

      {/* Section 2: Hero Section */}
      <Card className="p-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
            {profileData.hero.logo_url === "<>" ? 
              company.name.charAt(0).toUpperCase() : 
              <img src={profileData.hero.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            }
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{profileData.hero.company_name}</h1>
            <p className="text-blue-600 font-medium text-lg mb-2">{profileData.hero.eyes_handle}</p>
            <p className="text-slate-700 text-lg">{profileData.hero.descriptor_line}</p>
          </div>
        </div>

        {/* Quick Actions - 4 buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Phone className="w-4 h-4 mr-2" />
            Call Now
          </Button>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Globe className="w-4 h-4 mr-2" />
            Visit Website
          </Button>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <MapPin className="w-4 h-4 mr-2" />
            Directions
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {profileData.hero.badges.map((badge, index) => (
            <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              {badge}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Section 3: About & Badges */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">About {profileData.hero.company_name}</h2>
        <div className="border-l-4 border-orange-500 pl-6 mb-6">
          <p className="text-slate-700 leading-relaxed text-lg">{profileData.about_and_badges.ai_summary_120w}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {profileData.about_and_badges.company_badges.map((badge, index) => (
            <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1">
              {badge}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Section 4: Services */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">{serviceTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profileData.services.map((service, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-5 hover:shadow-lg transition-shadow relative">
              {/* Pricing Badge - Top Right */}
              <Badge className="absolute top-4 right-4 bg-blue-600 text-white">
                {service.pricing_label}
              </Badge>
              
              <div className="flex items-center gap-3 mb-4 pr-20">
                <span className="text-3xl">{service.emoji}</span>
                <h3 className="font-bold text-slate-900 text-lg">{service.title}</h3>
              </div>
              
              <p className="text-slate-600 mb-4 leading-relaxed">{service.summary_1line}</p>
              
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">What's Included:</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  {service.whats_included.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {service.duration}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setExpandedService(expandedService === index ? null : index)}
                  className="text-blue-600 hover:text-blue-700 p-0"
                >
                  {expandedService === index ? 'Hide Details' : 'Show Details'}
                  {expandedService === index ? 
                    <ChevronUp className="w-4 h-4 ml-1" /> : 
                    <ChevronDown className="w-4 h-4 ml-1" />
                  }
                </Button>
              </div>
              
              {expandedService === index && (
                <div className="bg-slate-50 rounded-md p-4 mb-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-700 mb-2">What's Included:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {service.whats_included.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Not Included:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {service.whats_not_included.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-slate-300 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600 hover:text-blue-700"
                disabled={service.learn_more_url === "<>"}
              >
                Learn More →
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 5: Quick Reference Guide */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Quick Reference Guide</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                {profileData.quick_reference_guide.columns.map((column, index) => (
                  <th key={index} className="border border-slate-300 p-4 text-left font-semibold text-slate-800">
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profileData.quick_reference_guide.columns[0].rows.map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {profileData.quick_reference_guide.columns.map((column, colIndex) => (
                    <td key={colIndex} className="border border-slate-300 p-4 text-slate-700">
                      {column.rows[rowIndex]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 6: Pricing Information */}
      <Card className="p-6 bg-orange-50 border-orange-200">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💰</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-orange-900 mb-4">Pricing Information</h2>
            <p className="text-orange-800 mb-6 leading-relaxed">{profileData.pricing_information.summary_line}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {profileData.pricing_information.cta_buttons.map((button, index) => (
                <Button 
                  key={index}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={button.url === "<>"}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Section 7: What to Expect - 6 Cards */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">What to Expect: Common Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profileData.what_to_expect.map((step, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{step.emoji}</span>
                <h3 className="font-bold text-slate-900">{step.title}</h3>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-blue-600 font-medium mb-2">
                  <strong>Recommended:</strong> {step.recommended_for}
                </p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">What's Involved:</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  {step.whats_involved.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">💡 Pro Tip:</span> {step.pro_tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 8: Location & Hours */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Location(s)</h2>
        
        {profileData.locations_and_hours.locations.map((location, index) => (
          <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Location Info */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{location.label}</h3>
              <div className="text-slate-700 space-y-2 mb-4">
                <p className="font-medium">{location.address.line1}</p>
                <p>{location.address.city}, {location.address.state} {location.address.zip}</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-700"
                  disabled={location.maps_link === "<>"}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Get Directions →
                </Button>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Service Area</h4>
                <p className="text-slate-700 text-sm">{location.service_area_text}</p>
              </div>
            </div>
            
            {/* Hours */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Hours of Operation</h3>
              <div className="space-y-3">
                {location.opening_hours.map((hour, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                    <span className="font-medium text-slate-700">{hour.day}</span>
                    <span className={hour.status === 'Open' ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                      {hour.status === 'Open' ? 
                        `${hour.open} - ${hour.close}` : 
                        'Closed'
                      }
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-4 italic">{location.hours_note}</p>
            </div>
          </div>
        ))}
      </Card>

      {/* Section 9: FAQs with Tabs */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">❓ Frequently Asked Questions</h2>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">All Questions</TabsTrigger>
            <TabsTrigger value="new">What's New?</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            {profileData.faqs.all_questions.map((category, index) => (
              <div key={index}>
                <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                  {category.category}
                </h3>
                <div className="space-y-4">
                  {category.items.map((faq, idx) => (
                    <div key={idx} className="border-l-3 border-blue-300 pl-4">
                      <p className="font-semibold text-slate-900 mb-2">{faq.q}</p>
                      <p className="text-slate-700">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="new">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4 text-lg">{profileData.faqs.whats_new.month_label}</h3>
              <div className="space-y-4">
                {profileData.faqs.whats_new.items.map((item, idx) => (
                  <div key={idx} className="border-l-3 border-blue-400 pl-4">
                    <p className="font-semibold text-blue-900 mb-2">{item.q}</p>
                    <p className="text-blue-800">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Section 10: Featured Reviews */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Featured Reviews</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {profileData.featured_reviews.items.map((review, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(review.stars)].map((_, idx) => (
                  <Star key={idx} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-4 leading-relaxed italic">"{review.excerpt}"</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">- {review.reviewer}</span>
                <div className="flex items-center gap-1 text-slate-500">
                  <span>{review.source}</span>
                  <span>{review.platform_icon}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">{review.date}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 11: Photo Gallery */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Photo Gallery</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {profileData.photo_gallery.images.map((image, index) => (
            <div key={index} className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
              {image.image_url === "<>" ? (
                <div className="text-center text-slate-500">
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs font-medium">Photo {index + 1}</p>
                </div>
              ) : (
                <img src={image.image_url} alt={image.alt} className="w-full h-full object-cover rounded-lg" />
              )}
            </div>
          ))}
        </div>
        
        <p className="text-sm text-slate-600 mt-4 text-center italic">
          Additional activities including citations, backlinks, and performance metrics are detailed in your Monthly Report
        </p>
      </Card>

      {/* Section 12: Eyes AI Monthly Activity - 2 Separate Cards */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Monthly Activity Section</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discover Card */}
          <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">Discover Package</Badge>
            </h3>
            <div className="space-y-3">
              {profileData.eyes_ai_monthly_activity.discover.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Verified Card */}
          <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-800">Verified Package</Badge>
            </h3>
            <div className="space-y-3">
              {profileData.eyes_ai_monthly_activity.verified.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-600 mt-6 text-center italic bg-slate-100 rounded-lg p-3">
          {profileData.eyes_ai_monthly_activity.note}
        </p>
      </Card>

      {/* Section 13: Get In Touch */}
      <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h2 className="text-2xl font-bold mb-2 text-center">Get in Touch with {profileData.get_in_touch.company_name}</h2>
        <p className="text-center mb-6 text-blue-100 text-lg">
          {profileData.get_in_touch.city_state}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {profileData.get_in_touch.buttons.map((button, index) => (
            <Button 
              key={index}
              size="lg"
              variant="outline" 
              className="bg-white text-blue-600 border-white hover:bg-blue-50 font-semibold"
              disabled={button.url === "<>"}
            >
              {button.label}
            </Button>
          ))}
        </div>
        
        <p className="text-center mt-6 text-blue-100 text-sm">
          Eyes AI connects you directly to the business. No middleman, no fees.
        </p>
      </Card>

      {/* Section 14: Footer */}
      <Card className="p-6 bg-slate-900 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-3">{profileData.footer.company}</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {profileData.footer.phone_e164}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {profileData.footer.email}
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {profileData.footer.website}
              </p>
            </div>
          </div>
          
          {/* Visit Us */}
          <div>
            <h4 className="font-semibold mb-3">Visit Us</h4>
            <p className="text-sm text-slate-300 mb-3">{profileData.footer.visit_us_address}</p>
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
          </div>
          
          {/* Hours Recap */}
          <div>
            <h4 className="font-semibold mb-3">Hours</h4>
            <p className="text-sm text-slate-300">{profileData.footer.hours_recap}</p>
            
            {/* Social Links - Only show if provided */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-sm">Follow Us</h4>
              <div className="flex gap-2">
                {Object.entries(profileData.footer.social).map(([platform, url]) => {
                  if (url !== "<>") {
                    return (
                      <Button key={platform} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        {platform.charAt(0).toUpperCase()}
                      </Button>
                    );
                  }
                  return null;
                })}
                {Object.values(profileData.footer.social).every(url => url === "<>") && (
                  <p className="text-xs text-slate-500">Social links coming soon</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-6 pt-4 text-center text-sm text-slate-400">
          <p>© 2025 {profileData.footer.company} • Verified by Eyes AI • Last Updated: {profileData.audit.last_updated}</p>
        </div>
      </Card>
    </div>
  );
}