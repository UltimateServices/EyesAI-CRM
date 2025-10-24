'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Video, 
  Loader2, 
  Trash2,
  Sparkles,
  CheckSquare,
  Square,
  ZoomIn,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Link2
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface MediaGalleryProps {
  company: Company;
}

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

// Toast Notification Component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg ${colors[type]}`}>
      {icons[type]}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Lightbox Component
function Lightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
        <X className="w-8 h-8" />
      </button>
      
      <button onClick={goPrev} className="absolute left-4 text-white hover:text-gray-300 text-4xl">
        ‹
      </button>
      
      <img 
        src={images[currentIndex]} 
        alt="Preview" 
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      
      <button onClick={goNext} className="absolute right-4 text-white hover:text-gray-300 text-4xl">
        ›
      </button>

      <div className="absolute bottom-4 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

export default function MediaGallery({ company }: MediaGalleryProps) {
  const updateCompany = useStore((state) => state.updateCompany);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const saveIntake = useStore((state) => state.saveIntake);

  const intake = getIntakeByCompanyId(company.id);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-import state
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [selectedLogos, setSelectedLogos] = useState<Set<number>>(new Set());
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());

  // Logo state
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Videos state
  const [videos, setVideos] = useState<string[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videosUploading, setVideosUploading] = useState(false);
  const [isDraggingVideos, setIsDraggingVideos] = useState(false);

  useEffect(() => {
    if (company.logoUrl) setLogoPreview(company.logoUrl);
    if (intake?.galleryLinks) setPhotos(intake.galleryLinks);
    if (intake?.embeddedVideos) setVideos(intake.embeddedVideos);
  }, [company, intake]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // AUTO-IMPORT FUNCTION
  const handleAutoImport = async () => {
    if (!company.name || !company.website) {
      showToast('Company name and website required for import', 'error');
      return;
    }

    setImporting(true);
    showToast('Searching for logos, photos, and videos...', 'info');

    try {
      const response = await fetch('/api/import-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          website: company.website,
          city: company.address?.split(',')[1]?.trim() || '',
          googleUrl: intake?.googleBusinessUrl
        })
      });

      const data = await response.json();

      if (data.success) {
        setImportResults(data.data);
        
        const { logos, photos, videos, missing } = data.data;
        const found = [];
        if (logos.length > 0) found.push(`${logos.length} logos`);
        if (photos.length > 0) found.push(`${photos.length} photos`);
        if (videos.length > 0) found.push(`${videos.length} videos`);

        if (found.length > 0) {
          showToast(`Found: ${found.join(', ')}! ${missing.length > 0 ? `Missing: ${missing.join(', ')}` : ''}`, 'success');
        } else {
          showToast('No media found. Try manual upload.', 'info');
        }
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      showToast(`Import failed: ${error.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  // ADD SELECTED ITEMS
  const addSelectedLogos = () => {
    if (!importResults || selectedLogos.size === 0) return;
    
    const selected = Array.from(selectedLogos).map(index => importResults.logos[index]);
    if (selected.length > 0) {
      setLogoPreview(selected[0].url); // Use first selected as logo
      showToast(`Added ${selected.length} logo${selected.length > 1 ? 's' : ''} to preview`, 'success');
      setSelectedLogos(new Set());
    }
  };

  const addSelectedPhotos = () => {
    if (!importResults || selectedPhotos.size === 0) return;
    
    const selected = Array.from(selectedPhotos).map(index => importResults.photos[index].url);
    setPhotos(prev => [...prev, ...selected]);
    showToast(`Added ${selected.length} photo${selected.length > 1 ? 's' : ''} to gallery`, 'success');
    setSelectedPhotos(new Set());
  };

  const addSelectedVideos = () => {
    if (!importResults || selectedVideos.size === 0) return;
    
    const selected = Array.from(selectedVideos).map(index => importResults.videos[index].url);
    setVideos(prev => [...prev, ...selected]);
    showToast(`Added ${selected.length} video${selected.length > 1 ? 's' : ''} to gallery`, 'success');
    setSelectedVideos(new Set());
  };

  // UPLOAD TO SUPABASE
  const uploadToSupabase = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileName = `${folder}/${company.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showToast(`Upload failed: ${uploadError.message}`, 'error');
        return null;
      }

      const { data } = supabase.storage
        .from('company-media')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Upload exception:', error);
      showToast(`Upload failed: ${error.message}`, 'error');
      return null;
    }
  };

  // LOGO HANDLERS
  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    setLogoUploading(true);
    const url = await uploadToSupabase(file, 'logos');
    if (url) {
      setLogoPreview(url);
      showToast('Logo uploaded successfully!', 'success');
    }
    setLogoUploading(false);
  };

  const handleLogoSave = async () => {
    if (!logoPreview) {
      showToast('No logo to save', 'error');
      return;
    }

    try {
      await updateCompany(company.id, { logoUrl: logoPreview });
      showToast('Logo saved successfully!', 'success');
    } catch (error: any) {
      console.error('Save logo error:', error);
      showToast(`Failed to save logo: ${error.message}`, 'error');
    }
  };

  // PHOTO HANDLERS
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
      showToast(`Uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}`, 'success');
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
      showToast(`Uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}`, 'success');
    }
    setPhotosUploading(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    showToast('Photo removed', 'info');
  };

  const savePhotosToIntake = async () => {
    if (!intake) {
      showToast('Please complete intake first', 'error');
      return;
    }
    
    try {
      await saveIntake({
        ...intake,
        galleryLinks: photos,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Saved ${photos.length} gallery images!`, 'success');
    } catch (error: any) {
      console.error('Save photos error:', error);
      showToast(`Failed to save photos: ${error.message}`, 'error');
    }
  };

  // VIDEO HANDLERS
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
      showToast(`Uploaded ${uploadedUrls.length} video${uploadedUrls.length > 1 ? 's' : ''}`, 'success');
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
      showToast(`Uploaded ${uploadedUrls.length} video${uploadedUrls.length > 1 ? 's' : ''}`, 'success');
    }
    setVideosUploading(false);
  };

  const addVideoUrl = () => {
    if (!videoUrlInput.trim()) return;
    
    // Convert YouTube watch URLs to embed format
    let embedUrl = videoUrlInput.trim();
    if (embedUrl.includes('youtube.com/watch')) {
      const videoId = embedUrl.split('v=')[1]?.split('&')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (embedUrl.includes('youtu.be/')) {
      const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    setVideos(prev => [...prev, embedUrl]);
    setVideoUrlInput('');
    showToast('Video URL added', 'success');
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
    showToast('Video removed', 'info');
  };

  const saveVideosToIntake = async () => {
    if (!intake) {
      showToast('Please complete intake first', 'error');
      return;
    }
    
    try {
      await saveIntake({
        ...intake,
        embeddedVideos: videos,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Saved ${videos.length} videos!`, 'success');
    } catch (error: any) {
      console.error('Save videos error:', error);
      showToast(`Failed to save videos: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox 
          images={photos} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}

      {/* Auto-Import Section */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-slate-900">AI Media Import</h3>
            </div>
            <p className="text-sm text-slate-600">
              Automatically find logos, photos, and videos from the company's website and social media
            </p>
          </div>
          <Button 
            onClick={handleAutoImport} 
            disabled={importing}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Auto Import Media
              </>
            )}
          </Button>
        </div>

        {/* Import Results - Review Section */}
        {importResults && !importing && (
          <div className="mt-6 space-y-6">
            {/* Social Profiles Found */}
            {Object.keys(importResults.socialProfiles).length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Social Profiles Found
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(importResults.socialProfiles).map(([platform, url]) => url && (
                    <a 
                      key={platform}
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Logo Results */}
            {importResults.logos.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Logo Options ({importResults.logos.length})</h4>
                  {selectedLogos.size > 0 && (
                    <Button onClick={addSelectedLogos} size="sm">
                      Add {selectedLogos.size} Selected
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {importResults.logos.map((logo, index) => (
                    <div 
                      key={index} 
                      className={`relative group cursor-pointer border-2 rounded-lg p-2 ${
                        selectedLogos.has(index) ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                      }`}
                      onClick={() => {
                        const newSet = new Set(selectedLogos);
                        if (newSet.has(index)) newSet.delete(index);
                        else newSet.add(index);
                        setSelectedLogos(newSet);
                      }}
                    >
                      <img 
                        src={logo.url} 
                        alt="Logo option" 
                        className="w-full h-24 object-contain"
                      />
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {Math.round(logo.confidence * 100)}% match
                      </Badge>
                      <div className="absolute top-2 right-2">
                        {selectedLogos.has(index) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Results */}
            {importResults.photos.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Photo Options ({importResults.photos.length})</h4>
                  {selectedPhotos.size > 0 && (
                    <Button onClick={addSelectedPhotos} size="sm">
                      Add {selectedPhotos.size} Selected
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {importResults.photos.map((photo, index) => (
                    <div 
                      key={index} 
                      className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden ${
                        selectedPhotos.has(index) ? 'border-blue-500' : 'border-slate-200'
                      }`}
                      onClick={() => {
                        const newSet = new Set(selectedPhotos);
                        if (newSet.has(index)) newSet.delete(index);
                        else newSet.add(index);
                        setSelectedPhotos(newSet);
                      }}
                    >
                      <img 
                        src={photo.url} 
                        alt="Photo option" 
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {selectedPhotos.has(index) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
                        {Math.round(photo.confidence * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Results */}
            {importResults.videos.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Video Options ({importResults.videos.length})</h4>
                  {selectedVideos.size > 0 && (
                    <Button onClick={addSelectedVideos} size="sm">
                      Add {selectedVideos.size} Selected
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {importResults.videos.map((video, index) => (
                    <div 
                      key={index} 
                      className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden ${
                        selectedVideos.has(index) ? 'border-blue-500' : 'border-slate-200'
                      }`}
                      onClick={() => {
                        const newSet = new Set(selectedVideos);
                        if (newSet.has(index)) newSet.delete(index);
                        else newSet.add(index);
                        setSelectedVideos(newSet);
                      }}
                    >
                      {video.url.includes('youtube.com') || video.url.includes('youtu.be') ? (
                        <iframe
                          src={video.url}
                          className="w-full h-48"
                          allowFullScreen
                        />
                      ) : (
                        <video src={video.url} className="w-full h-48" controls />
                      )}
                      <div className="absolute top-2 right-2">
                        {selectedVideos.has(index) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Items Warning */}
            {importResults.missing.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Some media not found</p>
                  <p className="text-sm text-yellow-700">
                    Missing: {importResults.missing.join(', ')}. You can add these manually below.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Manual Upload Sections */}
      <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Manual Upload</div>

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
              <span className="text-sm">Uploading...</span>
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
            <Button onClick={savePhotosToIntake} variant="outline" size="sm">
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
              <p className="text-slate-700 font-medium">Uploading...</p>
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
                  className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setLightboxIndex(index)}
                />
                <button 
                  onClick={() => removePhoto(index)} 
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setLightboxIndex(index)}
                  className="absolute top-2 left-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn className="w-4 h-4" />
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
            <Button onClick={saveVideosToIntake} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Save Videos
            </Button>
          )}
        </div>

        {/* Add Video URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Add YouTube/Vimeo URL
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addVideoUrl()}
            />
            <Button onClick={addVideoUrl} disabled={!videoUrlInput.trim()}>
              <Link2 className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
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
              <p className="text-slate-700 font-medium">Uploading...</p>
            </div>
          ) : (
            <>
              <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-2">Drag & drop video files here</p>
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
                {video.includes('youtube.com') || video.includes('youtu.be') ? (
                  <iframe
                    src={video}
                    className="w-full h-64 rounded-lg border border-slate-200"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={video} 
                    controls 
                    className="w-full rounded-lg border border-slate-200"
                  />
                )}
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