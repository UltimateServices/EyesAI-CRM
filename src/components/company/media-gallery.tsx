'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Upload, X, Video, Loader2, Trash2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface MediaGalleryProps {
  company: Company;
}

export default function MediaGallery({ company }: MediaGalleryProps) {
  const updateCompany = useStore((state) => state.updateCompany);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const saveIntake = useStore((state) => state.saveIntake);

  const intake = getIntakeByCompanyId(company.id);

  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);

  const [videos, setVideos] = useState<string[]>([]);
  const [videosUploading, setVideosUploading] = useState(false);
  const [isDraggingVideos, setIsDraggingVideos] = useState(false);

  useEffect(() => {
    // Load logo from company
    if (company.logoUrl) {
      setLogoPreview(company.logoUrl);
    }
    
    // Load photos from intake
    if (intake?.galleryLinks) {
      setPhotos(intake.galleryLinks);
    }
    
    // Load videos from intake
    if (intake?.embeddedVideos) {
      setVideos(intake.embeddedVideos);
    }
  }, [company, intake]);

  const uploadToSupabase = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileName = `${folder}/${company.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Upload failed: ' + uploadError.message);
        return null;
      }

      const { data } = supabase.storage
        .from('company-media')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Upload exception:', error);
      alert('Upload failed: ' + error.message);
      return null;
    }
  };

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setLogoUploading(true);
    const url = await uploadToSupabase(file, 'logos');
    if (url) {
      setLogoPreview(url);
      console.log('✅ Logo uploaded:', url);
    }
    setLogoUploading(false);
  };

  const handleLogoSave = async () => {
    if (!logoPreview) {
      alert('No logo to save');
      return;
    }

    try {
      // Update company with ONLY the logoUrl field
      await updateCompany(company.id, { logoUrl: logoPreview });
      alert('✅ Logo saved successfully!');
      window.location.reload();
    } catch (error: any) {
      console.error('Save logo error:', error);
      alert('❌ Failed to save logo: ' + error.message);
    }
  };

  const handlePhotosDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhotos(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setPhotosUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const url = await uploadToSupabase(file, 'gallery');
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      setPhotos(prev => [...prev, ...uploadedUrls]);
    }
    setPhotosUploading(false);
  };

  const handlePhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setPhotosUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const url = await uploadToSupabase(file, 'gallery');
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      setPhotos(prev => [...prev, ...uploadedUrls]);
    }
    setPhotosUploading(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const savePhotosToIntake = async () => {
    if (!intake) {
      alert('Please complete intake first');
      return;
    }
    
    try {
      // Save to intake with correct field name
      await saveIntake({
        ...intake,
        galleryLinks: photos,
        updatedAt: new Date().toISOString(),
      });
      alert(`✅ Saved ${photos.length} gallery images!`);
    } catch (error: any) {
      console.error('Save photos error:', error);
      alert('❌ Failed to save photos: ' + error.message);
    }
  };

  const handleVideosDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideos(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    if (files.length === 0) return;

    setVideosUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const url = await uploadToSupabase(file, 'videos');
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      setVideos(prev => [...prev, ...uploadedUrls]);
    }
    setVideosUploading(false);
  };

  const handleVideosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('video/'));
    if (files.length === 0) return;

    setVideosUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const url = await uploadToSupabase(file, 'videos');
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      setVideos(prev => [...prev, ...uploadedUrls]);
    }
    setVideosUploading(false);
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const saveVideosToIntake = async () => {
    if (!intake) {
      alert('Please complete intake first');
      return;
    }
    
    try {
      await saveIntake({
        ...intake,
        embeddedVideos: videos,
        updatedAt: new Date().toISOString(),
      });
      alert(`✅ Saved ${videos.length} videos!`);
    } catch (error: any) {
      console.error('Save videos error:', error);
      alert('❌ Failed to save videos: ' + error.message);
    }
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFileSelect}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              disabled={logoUploading}
            />
          </div>

          {logoUploading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Uploading to Supabase...</span>
            </div>
          )}

          {logoPreview && !logoUploading && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Preview</p>
              <div className="mb-3">
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  className="w-32 h-32 object-contain rounded-lg border-2 border-slate-200 p-2 bg-white"
                />
              </div>
              <Button onClick={handleLogoSave} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Save Logo
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Photo Gallery */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">Photo Gallery</h3>
            {photos.length > 0 && <Badge variant="secondary">{photos.length} photos</Badge>}
          </div>
          {photos.length > 0 && (
            <Button onClick={savePhotosToIntake} variant="outline" size="sm" disabled={photosUploading}>
              <Upload className="w-4 h-4 mr-2" />
              Save Gallery
            </Button>
          )}
        </div>

        <div
          onDrop={handlePhotosDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingPhotos(true); }}
          onDragLeave={() => setIsDraggingPhotos(false)}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDraggingPhotos ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
          }`}
        >
          {photosUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-slate-700 font-medium">Uploading to Supabase...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-2">Drag & drop images here</p>
              <p className="text-sm text-slate-500 mb-4">or click to browse</p>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handlePhotosSelect} 
                className="hidden" 
                id="photo-upload"
              />
              <Button asChild variant="outline" size="sm">
                <label htmlFor="photo-upload" className="cursor-pointer">Browse Files</label>
              </Button>
            </>
          )}
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img 
                  src={photo} 
                  alt={`Gallery ${index + 1}`} 
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                />
                <button 
                  onClick={() => removePhoto(index)} 
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Videos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900">Videos</h3>
            {videos.length > 0 && <Badge variant="secondary">{videos.length} videos</Badge>}
          </div>
          {videos.length > 0 && (
            <Button onClick={saveVideosToIntake} variant="outline" size="sm" disabled={videosUploading}>
              <Upload className="w-4 h-4 mr-2" />
              Save Videos
            </Button>
          )}
        </div>

        <div
          onDrop={handleVideosDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingVideos(true); }}
          onDragLeave={() => setIsDraggingVideos(false)}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDraggingVideos ? 'border-green-500 bg-green-50' : 'border-slate-300'
          }`}
        >
          {videosUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
              <p className="text-slate-700 font-medium">Uploading videos to Supabase...</p>
            </div>
          ) : (
            <>
              <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-2">Drag & drop videos here</p>
              <p className="text-sm text-slate-500 mb-4">or click to browse</p>
              <input 
                type="file" 
                multiple 
                accept="video/*" 
                onChange={handleVideosSelect} 
                className="hidden" 
                id="video-upload"
              />
              <Button asChild variant="outline" size="sm">
                <label htmlFor="video-upload" className="cursor-pointer">Browse Files</label>
              </Button>
            </>
          )}
        </div>

        {videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {videos.map((video, index) => (
              <div key={index} className="relative group">
                <video 
                  src={video} 
                  controls 
                  className="w-full rounded-lg border border-slate-200"
                />
                <button 
                  onClick={() => removeVideo(index)} 
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}