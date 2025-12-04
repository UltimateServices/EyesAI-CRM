'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, Loader2, Video, CheckCircle, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import MediaGallery from '@/components/company/media-gallery';

interface VideoUploadModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function VideoUploadModal({
  companyId,
  companyName,
  onClose,
  onSuccess,
}: VideoUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const companies = useStore((state) => state.companies);
  const company = companies.find(c => c.id === companyId);

  // Check if video already exists on mount
  useEffect(() => {
    const checkExistingVideo = async () => {
      try {
        // First check companies.welcome_video_url
        const companyResponse = await fetch(`/api/companies/${companyId}`);
        if (companyResponse.ok) {
          const { data } = await companyResponse.json();
          if (data?.welcome_video_url) {
            setExistingVideoUrl(data.welcome_video_url);
            setLoadingExisting(false);
            return;
          }
        }

        // If not found, check media_items for Eyes Content videos
        // Get ALL media items and filter for video files
        const mediaResponse = await fetch(`/api/media?companyId=${companyId}`);
        if (mediaResponse.ok) {
          const { data: mediaItems } = await mediaResponse.json();
          // Find video file with Eyes Content category or internal tag
          const videoItem = mediaItems?.find((item: any) => {
            const isVideo = item.file_type === 'video' ||
              item.mime_type?.startsWith('video/') ||
              item.file_name?.match(/\.(mp4|mov|avi|webm)$/i);

            const isEyesContent =
              item.category?.toLowerCase().includes('eyes') ||
              item.internal_tags?.some((tag: string) => tag.toLowerCase().includes('eyes'));

            return isVideo && isEyesContent;
          });

          if (videoItem?.file_url) {
            setExistingVideoUrl(videoItem.file_url);
          }
        }
      } catch (error) {
        console.error('Error checking existing video:', error);
      } finally {
        setLoadingExisting(false);
      }
    };

    checkExistingVideo();
  }, [companyId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      alert('❌ Please select a video file');
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      alert('❌ Please select a video file');
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDeleteVideo = async () => {
    const confirmed = confirm('Are you sure you want to delete this video? This will allow you to upload a new one.');
    if (!confirmed) return;

    try {
      setUploading(true);

      // Clear the video URLs from the companies table
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcome_video_url: null,
          welcome_video_thumbnail_url: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      alert('✅ Video deleted successfully! You can now upload a new one.');
      setExistingVideoUrl(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setUploading(true);

      // Mark step 8 as complete
      const response = await fetch(`/api/onboarding/steps/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: 8, completed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark step as complete');
      }

      alert('✅ Step 8 marked complete!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Mark complete error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('❌ Please select a video file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('companyId', companyId);

      // Upload video
      const response = await fetch('/api/onboarding/upload-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload video');
      }

      setUploadProgress(100);
      alert('✅ Welcome video uploaded successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Upload Welcome Video
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {companyName}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Media Gallery View - for uploading new video */}
          {showMediaGallery && company ? (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium mb-2">Upload New Welcome Video</p>
                <p className="text-sm text-blue-800">
                  Use the media gallery below to upload a new welcome video. Make sure to select
                  "Eyes Content" as the category so it appears here in Step 8.
                </p>
              </div>
              <MediaGallery company={company} />
            </div>
          ) : loadingExisting ? (
            /* Loading State */
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Checking for existing video...</span>
            </div>
          ) : existingVideoUrl && !selectedFile ? (
            /* Existing Video Preview */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">Video Already Uploaded</p>
                </div>
                <p className="text-sm text-green-800">
                  A welcome video has already been uploaded for this company. You can review it below.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Current Welcome Video:</p>
                <video
                  src={existingVideoUrl}
                  controls
                  className="w-full rounded-lg"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Video className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 text-sm text-blue-900">
                  <p className="font-medium mb-1">Options:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>If this video looks good, click "Mark Step 8 Complete" below</li>
                    <li>To delete and upload a different video, click "Delete Video"</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* File Selection */
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Video className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 font-medium mb-2">
                  Drag and drop video here or click to select
                </p>
                <p className="text-sm text-slate-500">
                  Supports MP4, MOV, AVI, and other video formats
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {/* Video Preview */}
                  {previewUrl && (
                    <video
                      src={previewUrl}
                      controls
                      className="w-64 h-36 object-cover rounded"
                    />
                  )}

                  {/* File Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900 mb-1">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {uploading && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">Uploading...</span>
                          <span className="text-sm font-medium text-blue-600">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
          )}

          {/* Instructions - Only show if no existing video or selecting new file */}
          {!loadingExisting && (!existingVideoUrl || selectedFile) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Instructions:</strong>
              </p>
              <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                <li>Download your welcome video from HeyGen</li>
                <li>Select the video file using the upload area above</li>
                <li>Preview the video to ensure it's correct</li>
                <li>Click "Upload Video" to save it</li>
              </ol>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>

          {/* Show different buttons based on state */}
          {existingVideoUrl && !selectedFile && !showMediaGallery ? (
            <>
              <Button
                variant="outline"
                onClick={handleDeleteVideo}
                disabled={uploading}
                className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete Video
              </Button>
              <Button
                onClick={handleMarkComplete}
                disabled={uploading}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Mark Step 8 Complete
                  </>
                )}
              </Button>
            </>
          ) : showMediaGallery ? (
            <Button variant="outline" onClick={() => setShowMediaGallery(false)}>
              Back to Video Preview
            </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Video
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
