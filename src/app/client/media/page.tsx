'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Upload,
  Image as ImageIcon,
  Video,
  File,
  Trash2,
  Download,
  Plus,
  Grid,
  List,
  Search,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

const supabase = createClientComponentClient();

interface MediaItem {
  id: string;
  company_id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'document';
  file_size: number;
  mime_type?: string;
  category: 'logo' | 'photo' | 'video';
  status: 'pending' | 'active' | 'inactive';
  uploaded_by_type: 'worker' | 'client';
  internal_tags?: string[];
  created_at: string;
}

type UploadCategory = 'logo' | 'photo' | 'video';

// Internal categories (for display only on client side)
const INTERNAL_CATEGORIES = [
  { id: 'products-services', label: 'Products / Services', color: 'bg-orange-500' },
  { id: 'logo', label: 'Logo / Branding', color: 'bg-purple-500' },
  { id: 'business-exterior', label: 'Business Exterior', color: 'bg-emerald-500' },
  { id: 'business-interior', label: 'Business Interior', color: 'bg-amber-500' },
  { id: 'team-people', label: 'Team / People', color: 'bg-blue-500' },
  { id: 'reviews', label: 'Reviews', color: 'bg-pink-500' },
];

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dragActive, setDragActive] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<UploadCategory | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<UploadCategory>('photo');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Major Dumpsters company ID
  const companyId = '60db5fa2-424a-4a07-91de-963271a4ea31';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/media?companyId=${companyId}`);
      const result = await response.json();
      if (result.data) {
        setMediaItems(result.data);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setShowUploadModal(true);
      (window as any).pendingFiles = files;
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setShowUploadModal(true);
      (window as any).pendingFiles = files;
    }
  };

  const uploadFiles = async () => {
    const files = (window as any).pendingFiles as FileList;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setShowUploadModal(false);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('companyId', companyId);
        formData.append('category', selectedCategory);
        formData.append('uploadedByType', 'client');
        if (user?.id) {
          formData.append('uploadedById', user.id);
        }

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Upload failed');
        }
      }

      setSuccess(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      fetchMedia();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      (window as any).pendingFiles = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleStatus = async (item: MediaItem, newStatus: 'active' | 'inactive') => {
    try {
      const response = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Update failed');
      }

      // Update local state
      setMediaItems(prev => prev.map(m => m.id === item.id ? { ...m, status: newStatus } : m));
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...item, status: newStatus });
      }

      setSuccess(`Media ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(`Permanently delete "${item.file_name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/media?id=${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Delete failed');
      }

      setSelectedItem(null);
      setSuccess('File deleted permanently');
      fetchMedia();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryLabel = (tags: string[] | undefined) => {
    if (!tags || tags.length === 0) return null;
    const cat = INTERNAL_CATEGORIES.find(c => c.id === tags[0]);
    return cat || null;
  };

  // Source badge - Only show C for client uploads
  const SourceBadge = ({ source }: { source: 'client' | 'worker' }) => {
    if (source !== 'client') return null;
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm bg-cyan-500 text-white">
        C
      </div>
    );
  };

  // Status badge with blinking for active
  const StatusBadge = ({ status }: { status: 'pending' | 'active' | 'inactive' }) => {
    if (status === 'pending') {
      return (
        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
          pending
        </div>
      );
    }
    if (status === 'active') {
      return (
        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
          active
        </div>
      );
    }
    return (
      <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-400 text-white">
        inactive
      </div>
    );
  };

  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All Media', count: mediaItems.length },
    { id: 'logo', label: 'Logo / Branding', count: mediaItems.filter(m => m.category === 'logo').length },
    { id: 'photo', label: 'Photos', count: mediaItems.filter(m => m.category === 'photo').length },
    { id: 'video', label: 'Videos', count: mediaItems.filter(m => m.category === 'video').length },
  ];

  // Stats
  const pendingCount = mediaItems.filter(m => m.status === 'pending').length;
  const activeCount = mediaItems.filter(m => m.status === 'active').length;
  const inactiveCount = mediaItems.filter(m => m.status === 'inactive').length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Media Library
          </h1>
          <p className={`mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            Upload and manage your brand assets
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2.5 bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all flex items-center gap-2 border-t border-white/20 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Upload Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            {pendingCount} Pending
          </span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            {activeCount} Active
          </span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            {inactiveCount} Inactive
          </span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-500 text-sm">{success}</p>
        </div>
      )}

      {uploadProgress && (
        <div className="mb-6 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-sky-500 animate-spin flex-shrink-0" />
          <p className="text-sky-500 text-sm">{uploadProgress}</p>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`mb-8 border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? 'border-sky-400 bg-sky-500/10'
            : isDark
              ? 'border-white/10 hover:border-white/20 bg-white/5'
              : 'border-slate-300 hover:border-slate-400 bg-white/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#38BDF8] to-[#0369A1] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Drop files here or click to upload
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
          Supports images, videos, and documents up to 50MB
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all border ${
            isDark
              ? 'bg-white/10 hover:bg-white/15 text-white border-white/10'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          Browse Files
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as UploadCategory | 'all')}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeCategory === cat.id
                ? 'bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white shadow-lg shadow-sky-500/30'
                : isDark
                  ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {cat.label}
            <span className="ml-2 opacity-60">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>
        <div className={`flex items-center rounded-lg border p-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'grid'
                ? isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'
                : isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'list'
                ? isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'
                : isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className={`text-center py-16 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No media files yet</p>
          <p className="text-sm mt-1">Upload your first file to get started</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`group backdrop-blur-sm rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                item.status === 'inactive' ? 'opacity-60' : ''
              } ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:border-sky-400/30'
                  : 'bg-white/80 border-slate-200/60 hover:border-sky-300 hover:shadow-md'
              }`}
            >
              <div className={`aspect-square flex items-center justify-center relative ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                {item.file_type === 'image' ? (
                  <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover" />
                ) : item.file_type === 'video' ? (
                  <video src={item.file_url} className="w-full h-full object-cover" />
                ) : (
                  <div className={isDark ? 'text-white/20' : 'text-slate-300'}>
                    {getFileIcon(item.file_type)}
                  </div>
                )}

                {/* Status Badge - Top Left */}
                <div className="absolute top-2 left-2">
                  <StatusBadge status={item.status} />
                </div>

                {/* Category Badge - Top Right (show when categorized) */}
                {item.internal_tags && item.internal_tags.length > 0 && getCategoryLabel(item.internal_tags) && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                    <div className={`w-2 h-2 rounded-full ${getCategoryLabel(item.internal_tags)?.color || 'bg-slate-400'}`} />
                    <span className="text-[9px] font-medium text-white">
                      {getCategoryLabel(item.internal_tags)?.label}
                    </span>
                  </div>
                )}

                {/* Source Badge - Bottom Right (only for client uploads) */}
                {item.uploaded_by_type === 'client' && (
                  <div className="absolute bottom-2 right-2">
                    <SourceBadge source={item.uploaded_by_type} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className={`font-medium truncate text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {item.file_name}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                  {formatFileSize(item.file_size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`backdrop-blur-sm rounded-2xl border overflow-hidden ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'
        }`}>
          {filteredMedia.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`flex items-center justify-between p-4 transition-all cursor-pointer ${
                item.status === 'inactive' ? 'opacity-60' : ''
              } ${
                index !== filteredMedia.length - 1 ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100' : ''
              } ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden relative ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  {item.file_type === 'image' ? (
                    <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={isDark ? 'text-white/40' : 'text-slate-400'}>
                      {getFileIcon(item.file_type)}
                    </div>
                  )}
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.file_name}</p>
                  <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                    {formatFileSize(item.file_size)} • {formatDate(item.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                {item.uploaded_by_type === 'client' && <SourceBadge source={item.uploaded_by_type} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {mounted && selectedItem && createPortal(
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 left-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="flex">
              {/* Image Preview */}
              <div className="flex-1 bg-slate-900 flex items-center justify-center min-h-[400px] relative">
                {selectedItem.file_type === 'image' ? (
                  <img
                    src={selectedItem.file_url}
                    alt={selectedItem.file_name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : selectedItem.file_type === 'video' ? (
                  <video
                    src={selectedItem.file_url}
                    controls
                    className="max-w-full max-h-[70vh]"
                  />
                ) : (
                  <div className="text-slate-300">
                    {getFileIcon(selectedItem.file_type)}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="w-80 p-6 border-l flex flex-col">
                <h3 className="font-semibold text-lg text-slate-900 mb-1 pr-8">
                  {selectedItem.file_name}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {formatFileSize(selectedItem.file_size)} • {selectedItem.uploaded_by_type === 'client' ? 'Uploaded by You' : 'Worker Upload'}
                </p>

                {/* Category */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">Category</p>
                  {getCategoryLabel(selectedItem.internal_tags) ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                      <div className={`w-3 h-3 rounded-full ${getCategoryLabel(selectedItem.internal_tags)?.color}`} />
                      <span className="text-sm text-slate-900">
                        {getCategoryLabel(selectedItem.internal_tags)?.label}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-500">Uncategorized</p>
                  )}
                </div>

                {/* Status Toggle */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">Status</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(selectedItem, 'active')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        selectedItem.status === 'active'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Active
                    </button>
                    <button
                      onClick={() => toggleStatus(selectedItem, 'inactive')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        selectedItem.status === 'inactive'
                          ? 'bg-slate-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <EyeOff className="w-4 h-4" />
                      Inactive
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-1"></div>
                <div className="space-y-2">
                  <a
                    href={selectedItem.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={() => deleteMedia(selectedItem)}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                  <p className="text-xs text-slate-400 pt-2">
                    Added {formatDate(selectedItem.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Select Category
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              Choose where to place your uploaded files:
            </p>
            <div className="space-y-2 mb-6">
              {[
                { id: 'logo', label: 'Logo / Branding', desc: 'Your company logos and brand assets' },
                { id: 'photo', label: 'Photos', desc: 'Business photos, team, projects' },
                { id: 'video', label: 'Videos', desc: 'Video content and clips' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as UploadCategory)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedCategory === cat.id
                      ? 'border-sky-500 bg-sky-500/10'
                      : isDark
                        ? 'border-white/10 hover:border-white/20'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{cat.label}</p>
                  <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{cat.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  (window as any).pendingFiles = null;
                }}
                className={`flex-1 py-2.5 rounded-xl font-medium ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={uploadFiles}
                className="flex-1 py-2.5 rounded-xl font-medium bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white hover:shadow-lg hover:shadow-sky-500/30"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
