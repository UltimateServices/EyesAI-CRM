'use client';

import { useState } from 'react';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload, ExternalLink } from 'lucide-react';

interface MediaGalleryProps {
  company: Company;
}

export function MediaGallery({ company }: MediaGalleryProps) {
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    alert('Logo URL saved! (This would update the company in the store)');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Company Logo</h3>
        </div>

        <div className="space-y-4">
          {/* Current Logo */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Current Logo</p>
            <div className="w-48 h-48 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
              {company.logoUrl ? (
                <img 
                  src={company.logoUrl} 
                  alt={`${company.name} logo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No logo uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Logo URL Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="https://example.com/logo.png"
                disabled={!isEditing}
              />
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave}>
                    Save
                  </Button>
                  <Button 
                    onClick={() => {
                      setLogoUrl(company.logoUrl || '');
                      setIsEditing(false);
                    }} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Paste a direct URL to an image (must end in .jpg, .png, .svg, etc.)
            </p>
          </div>

          {/* Logo URL Preview */}
          {logoUrl && logoUrl.trim() && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-slate-700">
                <strong>Preview URL:</strong>
              </p>
              <a 
                href={logoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
              >
                {logoUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Additional Media Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Additional Media</h3>
        </div>

        <div className="text-center py-12">
          <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 mb-2">Coming Soon</h4>
          <p className="text-slate-600 mb-4">
            Upload and manage additional images, videos, and documents
          </p>
        </div>
      </Card>

      {/* Media Instructions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Media Instructions</h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">📸 How to Add Images:</p>
            <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>Upload your image to a hosting service (Imgur, Cloudinary, etc.)</li>
              <li>Copy the direct image URL (must end in .jpg, .png, .svg, etc.)</li>
              <li>Paste the URL in the "Logo URL" field above</li>
              <li>Click "Save" to update</li>
            </ol>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-900 mb-1">⚠️ Important:</p>
            <p className="text-sm text-amber-700">
              Make sure the image URL is publicly accessible and points directly to an image file.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}