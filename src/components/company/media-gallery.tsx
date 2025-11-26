'use client';

import { useState, useEffect } from 'react';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Image as ImageIcon,
  Upload,
  X,
  Video,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  Grid3X3,
  List,
  Clock,
  User,
  Users,
  Trash2,
} from 'lucide-react';

interface MediaGalleryProps {
  company: Company;
}

interface MediaItem {
  id: string;
  company_id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'document';
  file_size: number;
  mime_type?: string;
  category: 'logo' | 'photo' | 'video';
  internal_tags: string[];
  status: 'pending' | 'active' | 'inactive';
  uploaded_by_type: 'worker' | 'client';
  created_at: string;
}

// Internal categories for worker organization (Universal for all business types)
const INTERNAL_CATEGORIES = [
  { id: 'products-services', label: 'Products / Services', color: 'bg-orange-500', desc: 'Food, classes, treatments, finished work' },
  { id: 'logo', label: 'Logo / Branding', color: 'bg-purple-500', desc: 'Logos, signage, uniforms, brand assets, social graphics' },
  { id: 'business-exterior', label: 'Business Exterior', color: 'bg-emerald-500', desc: 'Storefront, trucks, fleet, outdoor space' },
  { id: 'business-interior', label: 'Business Interior', color: 'bg-amber-500', desc: 'Dining room, gym, office, treatment rooms' },
  { id: 'team-people', label: 'Team / People', color: 'bg-blue-500', desc: 'Employees, instructors, owners, staff' },
  { id: 'reviews', label: 'Reviews', color: 'bg-pink-500', desc: 'Review screenshots, testimonials' },
];

// Toast Component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg ${colors[type]}`}>
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      {type === 'info' && <AlertCircle className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose}><X className="w-4 h-4" /></button>
    </div>
  );
}

export default function MediaGallery({ company }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'client' | 'worker'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Lightbox
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Upload drag state
  const [isDragging, setIsDragging] = useState(false);

  // Fetch media
  useEffect(() => {
    fetchMedia();
  }, [company.id]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/media?companyId=${company.id}`);
      const result = await response.json();
      if (result.data) {
        setMedia(result.data);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
      showToast('Failed to load media', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // Upload files
  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    const fileArray = Array.from(files);
    let successCount = 0;

    for (const file of fileArray) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('companyId', company.id);
        formData.append('uploadedByType', 'worker');

        // Determine category from file type
        let category: 'logo' | 'photo' | 'video' = 'photo';
        if (file.type.startsWith('video/')) {
          category = 'video';
        }
        formData.append('category', category);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          console.error('Upload failed:', result.error);
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      showToast(`Uploaded ${successCount} file${successCount > 1 ? 's' : ''}`, 'success');
      fetchMedia();
    }
  };

  // Toggle status
  const toggleStatus = async (item: MediaItem, newStatus: 'active' | 'inactive') => {
    try {
      const response = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      });

      if (response.ok) {
        setMedia(prev => prev.map(m => m.id === item.id ? { ...m, status: newStatus } : m));
        showToast(`Media ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
        if (selectedItem?.id === item.id) {
          setSelectedItem({ ...item, status: newStatus });
        }
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Update internal tags
  const updateCategory = async (item: MediaItem, categoryId: string) => {
    try {
      const newTags = [categoryId];
      const response = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          internal_tags: newTags,
          status: 'active' // Auto-activate when categorized
        }),
      });

      if (response.ok) {
        setMedia(prev => prev.map(m => m.id === item.id ? { ...m, internal_tags: newTags, status: 'active' } : m));
        showToast(`Categorized as ${INTERNAL_CATEGORIES.find(c => c.id === categoryId)?.label}`, 'success');
        setSelectedItem(null);
      }
    } catch (err) {
      showToast('Failed to update category', 'error');
    }
  };

  // Delete media
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
      showToast('File deleted permanently', 'success');
      fetchMedia();
    } catch (err) {
      showToast('Failed to delete file', 'error');
    }
  };

  // Filter media
  const filteredMedia = media.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && item.uploaded_by_type !== sourceFilter) return false;
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        if (item.internal_tags && item.internal_tags.length > 0) return false;
      } else {
        if (!item.internal_tags?.includes(categoryFilter)) return false;
      }
    }
    return true;
  });

  // Count items per category
  const getCategoryCount = (catId: string) => {
    if (catId === 'uncategorized') {
      return media.filter(m => !m.internal_tags || m.internal_tags.length === 0).length;
    }
    return media.filter(m => m.internal_tags?.includes(catId)).length;
  };

  // Stats
  const pendingCount = media.filter(m => m.status === 'pending').length;
  const activeCount = media.filter(m => m.status === 'active').length;
  const inactiveCount = media.filter(m => m.status === 'inactive').length;
  const clientCount = media.filter(m => m.uploaded_by_type === 'client').length;

  // Drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">{pendingCount} item{pendingCount > 1 ? 's' : ''} pending review</p>
              <p className="text-sm text-amber-700">
                {media.filter(m => m.status === 'pending' && m.uploaded_by_type === 'client').length} from client
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => setStatusFilter('pending')}
          >
            Review Now
          </Button>
        </div>
      )}

      {/* Upload Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Upload Media</h3>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="font-medium text-slate-700">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700 mb-1">Drop files here or click to upload</p>
              <p className="text-sm text-slate-500 mb-4">Images and videos up to 50MB</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
              />
              <Button asChild variant="outline">
                <label htmlFor="media-upload" className="cursor-pointer">Browse Files</label>
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Media Gallery */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">Media Library</h3>
            <Badge variant="secondary">{media.length} items</Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-1 mr-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Status:</span>
          </div>
          {[
            { value: 'all', label: 'All', count: media.length },
            { value: 'pending', label: 'Pending', count: pendingCount, color: 'amber' },
            { value: 'active', label: 'Active', count: activeCount, color: 'emerald' },
            { value: 'inactive', label: 'Inactive', count: inactiveCount, color: 'slate' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as any)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === filter.value
                  ? filter.color === 'amber' ? 'bg-amber-100 text-amber-700'
                  : filter.color === 'emerald' ? 'bg-emerald-100 text-emerald-700'
                  : filter.color === 'slate' ? 'bg-slate-200 text-slate-700'
                  : 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}

          <div className="w-px h-6 bg-slate-200 mx-2" />

          <div className="flex items-center gap-1 mr-2">
            <span className="text-sm text-slate-500">Source:</span>
          </div>
          {[
            { value: 'all', label: 'All', icon: Users },
            { value: 'client', label: 'Client', icon: User },
            { value: 'worker', label: 'Worker', icon: Sparkles },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => setSourceFilter(filter.value as any)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  sourceFilter === filter.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-1 mr-4">
            <span className="text-sm text-slate-500">Category:</span>
          </div>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCategoryFilter('uncategorized')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              categoryFilter === 'uncategorized'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Uncategorized ({getCategoryCount('uncategorized')})
          </button>
          {INTERNAL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
              {cat.label} ({getCategoryCount(cat.id)})
            </button>
          ))}
        </div>

        {/* Media Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No media found</p>
            <p className="text-sm">Upload some files or adjust your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-[1.02] ${
                  item.status === 'inactive' ? 'opacity-50 border-slate-300' :
                  item.status === 'pending' ? 'border-amber-300' : 'border-slate-200'
                }`}
              >
                {item.file_type === 'image' ? (
                  <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <Video className="w-8 h-8 text-slate-400" />
                  </div>
                )}

                {/* Status Badge - with blinking for active */}
                <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.status === 'pending' ? 'bg-amber-500 text-white' :
                  item.status === 'active' ? 'bg-emerald-500 text-white animate-pulse' :
                  'bg-slate-400 text-white'
                }`}>
                  {item.status}
                </div>

                {/* Source Badge - Only show C for client uploads */}
                {item.uploaded_by_type === 'client' && (
                  <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-cyan-500">
                    C
                  </div>
                )}

                {/* Category indicator */}
                {item.internal_tags?.length > 0 && (
                  <div className={`absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full ${
                    INTERNAL_CATEGORIES.find(c => c.id === item.internal_tags[0])?.color || 'bg-slate-400'
                  }`} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="flex items-center gap-4 p-3 hover:bg-slate-50 cursor-pointer rounded-lg"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border">
                  {item.file_type === 'image' ? (
                    <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <Video className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{item.file_name}</p>
                  <p className="text-sm text-slate-500">
                    {(item.file_size / 1024).toFixed(1)} KB • {item.uploaded_by_type === 'client' ? 'From Client' : 'Worker Upload'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    item.status === 'active' ? 'bg-emerald-100 text-emerald-700 animate-pulse' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {item.status}
                  </div>
                  {item.uploaded_by_type === 'client' && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-cyan-500">
                      C
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lightbox / Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Close X Button - Always visible on image area */}
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
                ) : (
                  <video
                    src={selectedItem.file_url}
                    controls
                    className="max-w-full max-h-[70vh]"
                  />
                )}
              </div>

              {/* Sidebar */}
              <div className="w-80 p-6 border-l flex flex-col">

                <h3 className="font-semibold text-lg text-slate-900 mb-1 pr-8">{selectedItem.file_name}</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {(selectedItem.file_size / 1024).toFixed(1)} KB • {selectedItem.uploaded_by_type === 'client' ? 'Uploaded by Client' : 'Worker Upload'}
                </p>

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

                {/* Category Selection */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 mb-2">Category (Internal)</p>
                  <div className="space-y-1.5">
                    {INTERNAL_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateCategory(selectedItem, cat.id)}
                        className={`w-full py-2.5 px-3 rounded-lg text-left flex items-start gap-2.5 transition-all ${
                          selectedItem.internal_tags?.includes(cat.id)
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${cat.color} mt-0.5 flex-shrink-0`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{cat.label}</p>
                          <p className={`text-xs mt-0.5 ${
                            selectedItem.internal_tags?.includes(cat.id)
                              ? 'text-white/60'
                              : 'text-slate-500'
                          }`}>
                            {cat.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delete Button */}
                <div className="pt-4 border-t mt-4">
                  <button
                    onClick={() => deleteMedia(selectedItem)}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                </div>

                <div className="pt-3">
                  <p className="text-xs text-slate-400">
                    Added {new Date(selectedItem.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
