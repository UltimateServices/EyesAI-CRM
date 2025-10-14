'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload, X, Video, ExternalLink, Trash2 } from 'lucide-react';

interface MediaGalleryProps {
  company: Company;
}

export function MediaGallery({ company }: MediaGalleryProps) {
  const updateCompany = useStore((state) => state.updateCompany);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const saveIntake = useStore((state) => state.saveIntake);

  const intake = getIntakeByCompanyId(company.id);

  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(company.logoUrl || '');

  const [photos, setPhotos] = useState<string[]>(intake?.galleryImages || []);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);

  const [videos, setVideos] = useState<string[]>([]);
  const [isDraggingVideos, setIsDraggingVideos] = useState(false);

  // Logo Upload/URL Handler
  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    setLogoPreview(url);
    setLogoFile(null);
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        setLogoUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSave = () => {
    // Update company with new logo
    updateCompany(company.id, {
      ...company,
      logoUrl: logoPreview,
    });

    alert('✅ Logo saved successfully!');
  };

  // Photo Gallery Handlers
  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhotos(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUrlAdd = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      setPhotos(prev => [...prev, url]);
    }
  };

  const handlePhotoDelete = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotosSave = () => {
    // Save photos to intake
    const intakeData = intake || {
      id: `intake-${company.id}`,
      companyId: company.id,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveIntake({
      ...intakeData,
      galleryImages: photos,
      updatedAt: new Date().toISOString(),
    });

    alert('✅ Photos saved to gallery!');
  };

  // Video Gallery Handlers
  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideos(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));

    videoFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setVideos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));

    videoFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setVideos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUrlAdd = () => {
    const url = prompt('Enter video URL (YouTube, Vimeo, or direct video link):');
    if (url && url.trim()) {
      setVideos(prev => [...prev, url]);
    }
  };

  const handleVideoDelete = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Company Logo</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Preview */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Current Logo</p>
            <div className="w-full h-48 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No logo uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Logo Upload/URL Input */}
          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Option 1: Paste Image URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-slate-500 mt-1">
                Direct link to image (jpg, png, svg, etc.)
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Option 2: Upload Image File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileSelect}
                  className="hidden"
                  id="logo-file-input"
                />
                <label
                  htmlFor="logo-file-input"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {logoFile ? logoFile.name : 'Click to upload or drag & drop'}
                  </span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, SVG up to 10MB
              </p>
            </div>

            {/* Save Button */}
            <Button onClick={handleLogoSave} className="w-full">
              Save Logo
            </Button>
          </div>
        </div>
      </Card>

      {/* Photo Gallery */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Photo Gallery</h3>
            <Badge className="bg-slate-100 text-slate-700">{photos.length} photos</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePhotoUrlAdd}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Add URL
            </Button>
            <label htmlFor="photo-file-input">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </span>
              </Button>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoFileSelect}
              className="hidden"
              id="photo-file-input"
            />
            {photos.length > 0 && (
              <Button size="sm" onClick={handlePhotosSave}>
                Save Gallery
              </Button>
            )}
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDrop={handlePhotoDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingPhotos(true);
          }}
          onDragLeave={() => setIsDraggingPhotos(false)}
          className={`border-2 border-dashed rounded-lg p-8 mb-4 transition-colors ${
            isDraggingPhotos
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-300 bg-slate-50'
          }`}
        >
          <div className="text-center">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Drag and drop photos here
            </p>
            <p className="text-xs text-slate-500">
              or click "Upload" button above to select files
            </p>
          </div>
        </div>

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img 
                    src={photo} 
                    alt={`Gallery photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => handlePhotoDelete(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            No photos in gallery yet
          </div>
        )}
      </Card>

      {/* Video Gallery */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Video Gallery</h3>
            <Badge className="bg-slate-100 text-slate-700">{videos.length} videos</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleVideoUrlAdd}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Add URL
            </Button>
            <label htmlFor="video-file-input">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </span>
              </Button>
            </label>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoFileSelect}
              className="hidden"
              id="video-file-input"
            />
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDrop={handleVideoDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingVideos(true);
          }}
          onDragLeave={() => setIsDraggingVideos(false)}
          className={`border-2 border-dashed rounded-lg p-8 mb-4 transition-colors ${
            isDraggingVideos
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-300 bg-slate-50'
          }`}
        >
          <div className="text-center">
            <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Drag and drop videos here
            </p>
            <p className="text-xs text-slate-500">
              Supports MP4, MOV, AVI, or YouTube/Vimeo URLs
            </p>
          </div>
        </div>

        {/* Video Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
                  {video.startsWith('data:') ? (
                    <video 
                      src={video}
                      controls
                      className="w-full h-full"
                    />
                  ) : (
                    <iframe
                      src={video}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  )}
                </div>
                <button
                  onClick={() => handleVideoDelete(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            No videos in gallery yet
          </div>
        )}
      </Card>

      {/* Media Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-slate-900 mb-3">💡 Media Tips</h4>
        <ul className="text-sm text-slate-700 space-y-2">
          <li>• <strong>Logo:</strong> Upload directly or paste URL. Supports PNG, JPG, SVG</li>
          <li>• <strong>Photos:</strong> Drag & drop multiple images or add via URL</li>
          <li>• <strong>Videos:</strong> Upload video files or paste YouTube/Vimeo URLs</li>
          <li>• <strong>Storage:</strong> All media is saved in browser localStorage</li>
          <li>• <strong>Export/Import:</strong> Use dashboard export to backup all media</li>
        </ul>
      </Card>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${className}`}>
      {children}
    </span>
  );
}