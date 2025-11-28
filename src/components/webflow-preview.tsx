'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Globe,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  ExternalLink,
  CheckCircle2,
  Crown
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface WebflowPreviewProps {
  companyId: string;
}

export function WebflowPreview({ companyId }: WebflowPreviewProps) {
  const [intake, setIntake] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadIntake();
  }, [companyId]);

  const loadIntake = async () => {
    try {
      const { data, error } = await supabase
        .from('intakes')
        .select(`
          business_name,
          display_name,
          tagline,
          short_description_webflow,
          about,
          ai_summary,
          social_handle,
          phone,
          email,
          address,
          city,
          state,
          zip,
          website,
          tag1,
          tag2,
          tag3,
          tag4,
          pricing_info,
          facebook_url,
          instagram_url,
          youtube_url,
          logo_url,
          google_maps_url,
          yelp_url,
          package_type,
          spotlight
        `)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      setIntake(data);
    } catch (error) {
      console.error('Error loading intake:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!intake) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600">No intake data found. Please complete the AI Intake step first.</p>
      </Card>
    );
  }

  const businessName = intake.display_name || intake.business_name || 'Business Name';
  const tags = [intake.tag1, intake.tag2, intake.tag3, intake.tag4].filter(Boolean);
  const hasLocation = intake.city && intake.state;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Preview Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <ExternalLink className="w-5 h-5 text-blue-600" />
        <div>
          <p className="font-semibold text-slate-900">Webflow Profile Preview</p>
          <p className="text-sm text-slate-600">This is how your profile will appear on the live website</p>
        </div>
      </div>

      {/* Hero Section */}
      <Card className="p-8 bg-gradient-to-br from-white to-slate-50">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-slate-900">{businessName}</h1>
              {intake.package_type === 'verified' && (
                <Badge className="bg-blue-600 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {intake.spotlight && (
                <Badge className="bg-yellow-500 text-white">
                  Spotlight
                </Badge>
              )}
            </div>
            {intake.tagline && (
              <p className="text-xl text-slate-600">{intake.tagline}</p>
            )}
            {intake.social_handle && (
              <p className="text-sm text-slate-500 mt-1">{intake.social_handle}</p>
            )}
          </div>
          {intake.logo_url && (
            <div className="w-24 h-24 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
              <img src={intake.logo_url} alt={businessName} className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* AI Summary */}
        {intake.ai_summary && (
          <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">AI Summary</h3>
                <p className="text-slate-700">{intake.ai_summary}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {intake.phone && (
            <Button asChild variant="outline" className="w-full">
              <a href={`tel:${intake.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </a>
            </Button>
          )}
          {intake.website && (
            <Button asChild variant="outline" className="w-full">
              <a href={intake.website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Visit Website
              </a>
            </Button>
          )}
          {intake.email && (
            <Button asChild variant="outline" className="w-full">
              <a href={`mailto:${intake.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </a>
            </Button>
          )}
          {intake.google_maps_url && (
            <Button asChild variant="outline" className="w-full">
              <a href={intake.google_maps_url} target="_blank" rel="noopener noreferrer">
                <MapPin className="w-4 h-4 mr-2" />
                Directions
              </a>
            </Button>
          )}
        </div>
      </Card>

      {/* About Section */}
      {intake.about && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">About {businessName}</h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{intake.about}</p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Pricing Information */}
      {intake.pricing_info && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">💰 Pricing Information</h2>
          <p className="text-slate-700">{intake.pricing_info}</p>
        </Card>
      )}

      {/* Location & Contact */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Location & Contact</h2>

        <div className="space-y-4">
          {(intake.address || hasLocation) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                {intake.address && <p className="text-slate-700">{intake.address}</p>}
                {hasLocation && (
                  <p className="text-slate-700">
                    {intake.city}, {intake.state} {intake.zip}
                  </p>
                )}
              </div>
            </div>
          )}

          {intake.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-600" />
              <a href={`tel:${intake.phone}`} className="text-blue-600 hover:underline">
                {intake.phone}
              </a>
            </div>
          )}

          {intake.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-600" />
              <a href={`mailto:${intake.email}`} className="text-blue-600 hover:underline">
                {intake.email}
              </a>
            </div>
          )}

          {intake.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-600" />
              <a href={intake.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {intake.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Social Media */}
        {(intake.facebook_url || intake.instagram_url || intake.youtube_url) && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-slate-900 mb-3">Follow Us</h3>
            <div className="flex gap-3">
              {intake.facebook_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={intake.facebook_url} target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </a>
                </Button>
              )}
              {intake.instagram_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={intake.instagram_url} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4 mr-2" />
                    Instagram
                  </a>
                </Button>
              )}
              {intake.youtube_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={intake.youtube_url} target="_blank" rel="noopener noreferrer">
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Additional Links */}
      {intake.yelp_url && (
        <Card className="p-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 text-slate-600" />
            <a href={intake.yelp_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              View on Yelp
            </a>
          </div>
        </Card>
      )}

      {/* Footer Note */}
      <div className="text-center text-sm text-slate-500 py-4">
        <p>👁️ Powered by Eyes AI</p>
      </div>
    </div>
  );
}
