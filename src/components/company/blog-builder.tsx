'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Company, Review, Blog } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Image as ImageIcon, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Star,
  TrendingUp,
  Save,
  Share2,
  FileText,
  Plus,
  Eye,
  Trash2,
  Search,
  X
} from 'lucide-react';

interface BlogBuilderProps {
  company: Company;
}

interface TitleSuggestion {
  h1: string;
  h2: string;
  keywords: string[];
}

interface SelectedImage {
  url: string;
  altText: string;
  position: number;
}

const AUTHORS = [
  {
    name: 'Sarah Mitchell',
    title: 'Content Strategist',
    bio: 'Sarah specializes in creating engaging, SEO-optimized content for local businesses.',
  },
  {
    name: 'Marcus Rivera',
    title: 'SEO Specialist',
    bio: 'Marcus has over 10 years of experience in local SEO and content marketing.',
  },
  {
    name: 'Jessica Chen',
    title: 'Digital Marketing Expert',
    bio: 'Jessica helps businesses grow their online presence through strategic content.',
  },
];

export default function BlogBuilder({ company }: BlogBuilderProps) {
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const reviews = useStore((state) => state.reviews);
  const blogs = useStore((state) => state.blogs);
  const fetchReviews = useStore((state) => state.fetchReviews);
  const fetchBlogs = useStore((state) => state.fetchBlogs);
  const saveBlog = useStore((state) => state.saveBlog);
  const deleteBlog = useStore((state) => state.deleteBlog);

  const intake = getIntakeByCompanyId(company.id);
  const companyReviews = reviews.filter((r) => r.companyId === company.id);
  const fiveStarReviews = companyReviews.filter((r) => r.rating === 5);
  const companyBlogs = blogs.filter((b) => b.companyId === company.id);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  // Load data on mount
  useEffect(() => {
    fetchReviews();
    fetchBlogs();
  }, [fetchReviews, fetchBlogs]);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Title Context & Suggestions
  const [titleContext, setTitleContext] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<TitleSuggestion | null>(null);
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [titleError, setTitleError] = useState('');

  // Step 2: Review Selection
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([]);
  const [recommendedReviews, setRecommendedReviews] = useState<string[]>([]);

  // Step 3: Image Selection
  const availableImages = intake?.galleryLinks || [];
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Step 4: Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Step 5: Generated Blog
  const [generatedBlog, setGeneratedBlog] = useState<any>(null);
  const [selectedAuthor, setSelectedAuthor] = useState(AUTHORS[0]);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Calculate recommended reviews
  useEffect(() => {
    if (fiveStarReviews.length > 0) {
      const sorted = [...fiveStarReviews].sort((a, b) => b.text.length - a.text.length);
      setRecommendedReviews(sorted.slice(0, 3).map(r => r.id));
    }
  }, [fiveStarReviews]);

  // Generate Title Suggestions
  const generateTitles = async () => {
    setGeneratingTitles(true);
    setTitleError('');

    try {
      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            name: company.name,
            city: company.city,
            state: company.state,
          },
          intake: {
            services: intake?.services || [],
            industryCategory: intake?.industryCategory,
            primaryFocus: intake?.primaryFocus,
          },
          context: titleContext || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate titles');

      const data = await response.json();
      setTitleSuggestions(data.suggestions);
    } catch (error: any) {
      setTitleError(error.message || 'Failed to generate titles');
    } finally {
      setGeneratingTitles(false);
    }
  };

  // Select title
  const selectTitle = (suggestion: TitleSuggestion) => {
    setSelectedTitle(suggestion);
  };

  // Toggle review selection
  const toggleReview = (review: Review) => {
    if (selectedReviews.find(r => r.id === review.id)) {
      setSelectedReviews(selectedReviews.filter(r => r.id !== review.id));
    } else if (selectedReviews.length < 3) {
      setSelectedReviews([...selectedReviews, review]);
    }
  };

  // Toggle image selection
  const toggleImage = (url: string) => {
    if (selectedImages.includes(url)) {
      setSelectedImages(selectedImages.filter(u => u !== url));
    } else if (selectedImages.length < 3) {
      setSelectedImages([...selectedImages, url]);
    }
  };

  // Scan for SEO Score
  const scanSEOScore = () => {
    if (!generatedBlog) return;

    setIsScanning(true);
    
    setTimeout(() => {
      let score = 0;

      // GEO/Local (30 points)
      const companyMentions = (generatedBlog.content.match(new RegExp(company.name, 'gi')) || []).length;
      const locationMentions = (generatedBlog.content.match(new RegExp(company.city || '', 'gi')) || []).length;
      score += Math.min(companyMentions * 5, 15);
      score += Math.min(locationMentions * 2.5, 15);

      // Structure (25 points)
      const h3Count = (generatedBlog.content.match(/<h3>/g) || []).length;
      const hasBullets = generatedBlog.content.includes('<ul>') ? 8 : 0;
      const hasImages = selectedImages.length === 3 ? 7 : 0;
      score += Math.min(h3Count * 2, 10) + hasBullets + hasImages;

      // AI Discovery (25 points)
      const hasFAQs = generatedBlog.faqs && generatedBlog.faqs.length >= 5 ? 10 : 0;
      const hasQuickAnswer = generatedBlog.quickAnswer ? 8 : 0;
      const hasTakeaways = generatedBlog.keyTakeaways && generatedBlog.keyTakeaways.length >= 4 ? 7 : 0;
      score += hasFAQs + hasQuickAnswer + hasTakeaways;

      // Engagement (20 points)
      const hasReviews = selectedReviews.length === 3 ? 10 : 0;
      const hasKeywords = selectedTitle ? 5 : 0;
      const hasCTAs = 5;
      score += hasReviews + hasKeywords + hasCTAs;

      setSeoScore(Math.min(score, 100));
      setIsScanning(false);
    }, 2000);
  };

  // Generate Blog
  const generateBlog = async () => {
    if (!selectedTitle) return;

    setIsGenerating(true);
    setGenerationError('');

    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            id: company.id,
            name: company.name,
            city: company.city,
            state: company.state,
          },
          topic: {
            h1: selectedTitle.h1,
            h2: selectedTitle.h2,
          },
          selectedReviews: selectedReviews.map(r => ({
            author: r.author,
            text: r.text,
            rating: r.rating,
          })),
          selectedImages: selectedImages.map((url, index) => ({
            url,
            altText: `${company.name} - ${selectedTitle.h1} - Image ${index + 1}`,
            position: index + 1,
          })),
          keywords: selectedTitle.keywords,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate blog');

      const data = await response.json();
      setGeneratedBlog(data);
      
      setCurrentStep(5);
    } catch (error: any) {
      setGenerationError(error.message || 'Failed to generate blog');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Blog
  const handleSaveBlog = async () => {
    if (!generatedBlog || !selectedTitle) return;

    setIsSaving(true);
    try {
      const imageData: SelectedImage[] = selectedImages.map((url, index) => ({
        url,
        altText: `${company.name} - ${selectedTitle.h1} - Image ${index + 1}`,
        position: index + 1,
      }));

      await saveBlog({
        companyId: company.id,
        h1: selectedTitle.h1,
        h2: selectedTitle.h2,
        quickAnswer: generatedBlog.quickAnswer,
        keyTakeaways: generatedBlog.keyTakeaways,
        content: generatedBlog.content,
        faqs: generatedBlog.faqs,
        selectedImages: imageData,
        selectedReviewIds: selectedReviews.map(r => r.id),
        metaTitle: selectedTitle.h1,
        metaDescription: generatedBlog.metaDescription,
        keywords: selectedTitle.keywords,
        seoScore: seoScore || 0,
        authorName: selectedAuthor.name,
        authorTitle: selectedAuthor.title,
        authorBio: selectedAuthor.bio,
        status: 'draft',
      });

      await fetchBlogs();
      alert('✅ Blog saved successfully!');
      
      setViewMode('list');
      resetBuilder();
    } catch (error: any) {
      alert('❌ Failed to save blog: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Draft
  const handleDeleteDraft = async (id: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      try {
        await deleteBlog(id);
        await fetchBlogs();
      } catch (error: any) {
        alert('Failed to delete draft: ' + error.message);
      }
    }
  };

  // Reset Builder
  const resetBuilder = () => {
    setCurrentStep(1);
    setTitleContext('');
    setSelectedTitle(null);
    setTitleSuggestions([]);
    setSelectedReviews([]);
    setSelectedImages([]);
    setGeneratedBlog(null);
    setSeoScore(null);
    setShowScoreBreakdown(false);
  };

  // Start New Blog
  const startNewBlog = () => {
    resetBuilder();
    setViewMode('create');
  };

  // Load Draft into Editor
  const loadDraft = (blog: Blog) => {
    setSelectedTitle({
      h1: blog.h1,
      h2: blog.h2,
      keywords: blog.keywords || [],
    });

    setGeneratedBlog({
      quickAnswer: blog.quickAnswer,
      keyTakeaways: blog.keyTakeaways,
      content: blog.content,
      faqs: blog.faqs,
      metaDescription: blog.metaDescription,
    });

    if (blog.selectedReviewIds && blog.selectedReviewIds.length > 0) {
      const reviewsToLoad = reviews.filter(r => blog.selectedReviewIds?.includes(r.id));
      setSelectedReviews(reviewsToLoad);
    }

    if (blog.selectedImages && blog.selectedImages.length > 0) {
      setSelectedImages(blog.selectedImages.map(img => img.url));
    }

    const author = AUTHORS.find(a => a.name === blog.authorName);
    if (author) {
      setSelectedAuthor(author);
    }

    if (blog.seoScore) {
      setSeoScore(blog.seoScore);
    }

    setCurrentStep(5);
    setViewMode('create');
  };

  // DRAFTS LIST VIEW
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Saved Blog Drafts</h3>
              <p className="text-sm text-slate-600">Your saved blogs for {company.name}</p>
            </div>
            <Button onClick={startNewBlog} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create New Blog
            </Button>
          </div>

          {companyBlogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No blog drafts yet</p>
              <Button onClick={startNewBlog} size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Create Your First Blog
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {companyBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="p-5 border-2 border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-slate-900 mb-1">{blog.h1}</h4>
                      <p className="text-sm text-slate-600 mb-3">{blog.h2}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <Badge variant="secondary" className="capitalize">{blog.status}</Badge>
                        {blog.seoScore !== undefined && blog.seoScore > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            SEO Score: {blog.seoScore}/100
                          </span>
                        )}
                        <span>
                          Created {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadDraft(blog)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDraft(blog.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // CREATE VIEW
  return (
    <div className="space-y-6">
      {/* Back to Drafts */}
      {companyBlogs.length > 0 && (
        <Button variant="ghost" onClick={() => setViewMode('list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Drafts
        </Button>
      )}

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                currentStep >= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {step}
              </div>
              {step < 5 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-600 font-medium">Topic</span>
          <span className="text-xs text-slate-600 font-medium">Reviews</span>
          <span className="text-xs text-slate-600 font-medium">Images</span>
          <span className="text-xs text-slate-600 font-medium">Generate</span>
          <span className="text-xs text-slate-600 font-medium">Publish</span>
        </div>
      </Card>

      {/* Step 1: Title Selection */}
      {currentStep === 1 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 1: Select Blog Topic</h3>
          </div>

          {!selectedTitle && titleSuggestions.length === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Blog Topic Context (Optional)
                </label>
                <Textarea
                  value={titleContext}
                  onChange={(e) => setTitleContext(e.target.value)}
                  placeholder="Example: Talk about tire rotations in Miami Florida, focus on when drivers should rotate their tires and what signs to look for..."
                  className="w-full h-24 resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 <strong>Tip:</strong> Add keywords or context to get more specific title suggestions. Leave blank for general suggestions based on your business.
                </p>
              </div>

              <div className="text-center py-8 border-t">
                <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Generate AI-Powered Titles</h4>
                <p className="text-slate-600 mb-6">Get 5 blog title suggestions tailored to your business</p>
                
                {titleError && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4 max-w-md mx-auto">
                    <p className="text-sm text-red-600">{titleError}</p>
                  </div>
                )}
                
                <Button 
                  onClick={generateTitles} 
                  disabled={generatingTitles}
                  size="lg"
                  className="px-8"
                >
                  {generatingTitles ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Titles...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate 5 Blog Titles
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {!selectedTitle && titleSuggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">Click to select a blog topic:</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setTitleSuggestions([])}
                >
                  Generate New Titles
                </Button>
              </div>
              {titleSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => selectTitle(suggestion)}
                  className="p-5 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <h4 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-700">{suggestion.h1}</h4>
                  <p className="text-sm text-slate-600 mb-3">{suggestion.h2}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTitle && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700 uppercase">Selected Topic</span>
                    </div>
                    <h4 className="font-semibold text-lg text-slate-900 mb-2">{selectedTitle.h1}</h4>
                    <p className="text-sm text-slate-600 mb-4">{selectedTitle.h2}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTitle.keywords.map((keyword, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700 border-blue-200">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedTitle(null);
                    setTitleSuggestions([]);
                  }}
                  className="flex-1"
                >
                  Choose Different Topic
                </Button>
                <Button onClick={() => setCurrentStep(2)} className="flex-1" size="lg">
                  Next: Select Reviews <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Review Selection */}
      {currentStep === 2 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 2: Select 3 Reviews</h3>
            <Badge variant="secondary" className="ml-2">{selectedReviews.length}/3 selected</Badge>
          </div>

          {fiveStarReviews.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-2">No 5-star reviews available for this company.</p>
              <p className="text-sm text-slate-500">Add reviews in the Reviews tab first.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {fiveStarReviews.map((review) => {
                const isRecommended = recommendedReviews.includes(review.id);
                const isSelected = selectedReviews.find(r => r.id === review.id);

                return (
                  <div
                    key={review.id}
                    onClick={() => toggleReview(review)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isRecommended && !isSelected && (
                      <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                        ⭐ Recommended
                      </Badge>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{review.author}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 pr-20">{review.text}</p>
                    <p className="text-xs text-slate-400 mt-2">{review.platform}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={() => setCurrentStep(3)} 
              disabled={selectedReviews.length !== 3}
              className="flex-1"
            >
              Next: Select Images <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Image Selection */}
      {currentStep === 3 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 3: Select 3 Images</h3>
            <Badge variant="secondary" className="ml-2">{selectedImages.length}/3 selected</Badge>
          </div>

          {availableImages.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-2">No images available in Media Gallery.</p>
              <p className="text-sm text-slate-500">Add images in the Media tab first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {availableImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => toggleImage(url)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-4 transition-all ${
                    selectedImages.includes(url)
                      ? 'border-green-500 ring-2 ring-green-500 scale-95'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img 
                    src={url} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedImages.includes(url) && (
                    <div className="absolute inset-0 bg-green-600 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-green-600 text-white rounded-full p-2">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={() => setCurrentStep(4)} 
              disabled={selectedImages.length !== 3}
              className="flex-1"
            >
              Next: Generate Blog <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Generate */}
      {currentStep === 4 && selectedTitle && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 4: Generate Blog</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-slate-900 mb-4">Ready to Generate</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Topic</p>
                    <p className="text-sm text-slate-600">{selectedTitle.h1}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-blue-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedReviews.length}</p>
                    <p className="text-xs text-slate-600">Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedImages.length}</p>
                    <p className="text-xs text-slate-600">Images</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedTitle.keywords.length}</p>
                    <p className="text-xs text-slate-600">Keywords</p>
                  </div>
                </div>
              </div>
            </div>

            {generationError && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-600">{generationError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button 
                onClick={generateBlog} 
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Blog...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Complete Blog
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 5: Preview & Publish */}
      {currentStep === 5 && generatedBlog && selectedTitle && (
        <div className="space-y-6">
          {/* SEO Score Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">SEO Score</h3>
                <p className="text-sm text-slate-600">Scan your blog for optimization rating</p>
              </div>
              <div className="flex items-center gap-4">
                {seoScore !== null ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`text-5xl font-bold ${
                        seoScore >= 90 ? 'text-green-500' :
                        seoScore >= 70 ? 'text-yellow-500' :
                        'text-orange-500'
                      }`}>{seoScore}</div>
                      <TrendingUp className={`w-10 h-10 ${
                        seoScore >= 90 ? 'text-green-500' :
                        seoScore >= 70 ? 'text-yellow-500' :
                        'text-orange-500'
                      }`} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScoreBreakdown(true)}
                    >
                      View Breakdown
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={scanSEOScore}
                    disabled={isScanning}
                    variant="outline"
                    size="lg"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Scan for Score
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Score Breakdown Modal */}
          {showScoreBreakdown && seoScore !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">SEO Score Breakdown</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowScoreBreakdown(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                      <p className="text-sm text-slate-600 mb-2">Total Score</p>
                      <p className={`text-6xl font-bold ${
                        seoScore >= 90 ? 'text-green-500' :
                        seoScore >= 70 ? 'text-yellow-500' :
                        'text-orange-500'
                      }`}>{seoScore}/100</p>
                    </div>

                    {/* GEO/Local (30 points) */}
                    <div className="border-2 border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">🌎 GEO/Local Optimization</h4>
                        <span className="text-lg font-bold text-blue-600">
                          {Math.min(
                            Math.min((generatedBlog.content.match(new RegExp(company.name, 'gi')) || []).length * 5, 15) +
                            Math.min((generatedBlog.content.match(new RegExp(company.city || '', 'gi')) || []).length * 2.5, 15),
                            30
                          )}/30
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Company mentions ({company.name}):</span>
                          <span className="font-medium">
                            {(generatedBlog.content.match(new RegExp(company.name, 'gi')) || []).length} times
                            ({Math.min((generatedBlog.content.match(new RegExp(company.name, 'gi')) || []).length * 5, 15)}/15 pts)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">City mentions ({company.city}):</span>
                          <span className="font-medium">
                            {(generatedBlog.content.match(new RegExp(company.city || '', 'gi')) || []).length} times
                            ({Math.min((generatedBlog.content.match(new RegExp(company.city || '', 'gi')) || []).length * 2.5, 15)}/15 pts)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Structure (25 points) */}
                    <div className="border-2 border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">📐 Content Structure</h4>
                        <span className="text-lg font-bold text-purple-600">
                          {Math.min((generatedBlog.content.match(/<h3>/g) || []).length * 2, 10) +
                           (generatedBlog.content.includes('<ul>') ? 8 : 0) +
                           (selectedImages.length === 3 ? 7 : 0)}/25
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">H3 sections (need 5-6):</span>
                          <span className="font-medium">
                            {(generatedBlog.content.match(/<h3>/g) || []).length} sections
                            ({Math.min((generatedBlog.content.match(/<h3>/g) || []).length * 2, 10)}/10 pts)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Bullet lists:</span>
                          <span className="font-medium">
                            {generatedBlog.content.includes('<ul>') ? '✓ Yes' : '✗ No'}
                            ({generatedBlog.content.includes('<ul>') ? '8' : '0'}/8 pts)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Images included:</span>
                          <span className="font-medium">
                            {selectedImages.length}/3
                            ({selectedImages.length === 3 ? '7' : '0'}/7 pts)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Discovery (25 points) */}
                    <div className="border-2 border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">🤖 AI Discovery</h4>
                        <span className="text-lg font-bold text-green-600">
                          {(generatedBlog.faqs && generatedBlog.faqs.length >= 5 ? 10 : 0) +
                           (generatedBlog.quickAnswer ? 8 : 0) +
                           (generatedBlog.keyTakeaways && generatedBlog.keyTakeaways.length >= 4 ? 7 : 0)}/25
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">FAQs (need 5+):</span>
                          <span className="font-medium">
                            {generatedBlog.faqs?.length || 0} FAQs
                            ({generatedBlog.faqs && generatedBlog.faqs.length >= 5 ? '10' : '0'}/10 pts)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Quick Answer:</span>
                          <span className="font-medium">
                            {generatedBlog.quickAnswer ? '✓ Yes' : '✗ No'}
                            ({generatedBlog.quickAnswer ? '8' : '0'}/8 pts)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Key Takeaways (need 4+):</span>
                          <span className="font-medium">
                            {generatedBlog.keyTakeaways?.length || 0} takeaways
                            ({generatedBlog.keyTakeaways && generatedBlog.keyTakeaways.length >= 4 ? '7' : '0'}/7 pts)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Engagement (20 points) */}
                    <div className="border-2 border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">💬 Engagement</h4>
                        <span className="text-lg font-bold text-orange-600">
                          {(selectedReviews.length === 3 ? 10 : 0) + (selectedTitle ? 5 : 0) + 5}/20
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Customer reviews:</span>
                          <span className="font-medium">
                            {selectedReviews.length}/3 reviews
                            ({selectedReviews.length === 3 ? '10' : '0'}/10 pts)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Target keywords:</span>
                          <span className="font-medium">
                            {selectedTitle ? '✓ Yes' : '✗ No'}
                            ({selectedTitle ? '5' : '0'}/5 pts)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">CTAs included:</span>
                          <span className="font-medium">✓ Yes (5/5 pts)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <Button
                      onClick={() => setShowScoreBreakdown(false)}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Blog Preview - Styled like real blog */}
          <Card className="p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <h1 className="text-4xl font-bold mb-3">{selectedTitle.h1}</h1>
              <p className="text-xl text-blue-100">{selectedTitle.h2}</p>
            </div>

            <div className="p-8 max-w-4xl mx-auto">
              {/* Quick Answer */}
              {generatedBlog.quickAnswer && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-5 mb-8">
                  <p className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wide">⚡ Quick Answer</p>
                  <p className="text-slate-700">{generatedBlog.quickAnswer}</p>
                </div>
              )}

              {/* Author */}
              <div className="flex items-center gap-3 mb-8 pb-6 border-b">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  {selectedAuthor.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedAuthor.name}</p>
                  <p className="text-sm text-slate-600">{selectedAuthor.title}</p>
                </div>
              </div>

              {/* Key Takeaways */}
              {generatedBlog.keyTakeaways && generatedBlog.keyTakeaways.length > 0 && (
                <div className="bg-slate-50 p-6 rounded-xl mb-8 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    Key Takeaways
                  </h3>
                  <ul className="space-y-3">
                    {generatedBlog.keyTakeaways.map((takeaway: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold mt-1">→</span>
                        <span className="text-slate-700">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Content */}
              <div 
                className="prose prose-slate prose-lg max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: generatedBlog.content }}
              />

              {/* FAQs */}
              {generatedBlog.faqs && generatedBlog.faqs.length > 0 && (
                <div className="bg-slate-50 p-6 rounded-xl mb-8 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-6 text-xl flex items-center gap-2">
                    <span className="text-2xl">❓</span>
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-5">
                    {generatedBlog.faqs.map((faq: any, index: number) => (
                      <div key={index} className="pb-5 border-b border-slate-200 last:border-0 last:pb-0">
                        <p className="font-semibold text-slate-900 mb-2 text-lg">{faq.q}</p>
                        <p className="text-slate-600">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Bio */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0">
                    {selectedAuthor.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">{selectedAuthor.name}</h4>
                    <p className="text-sm text-slate-600 mb-3">{selectedAuthor.title}</p>
                    <p className="text-sm text-slate-700">{selectedAuthor.bio}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Author Selection */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Select Author</h3>
            <div className="grid grid-cols-3 gap-4">
              {AUTHORS.map((author) => (
                <div
                  key={author.name}
                  onClick={() => setSelectedAuthor(author)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAuthor.name === author.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{author.name}</p>
                  <p className="text-sm text-slate-600 mt-1">{author.title}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Start over? You will lose this generated blog.')) {
                    setViewMode('list');
                    resetBuilder();
                  }
                }}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handleSaveBlog}
                disabled={isSaving}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Blog (Draft)
                  </>
                )}
              </Button>
              <Button
                disabled
                className="flex-1 bg-slate-300 cursor-not-allowed"
                size="lg"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Publish (Coming Soon)
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}