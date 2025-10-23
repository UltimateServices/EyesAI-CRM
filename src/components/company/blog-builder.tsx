'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Company, Review } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Share2
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
  const fetchReviews = useStore((state) => state.fetchReviews);
  const saveBlog = useStore((state) => state.saveBlog);

  const intake = getIntakeByCompanyId(company.id);
  const companyReviews = reviews.filter((r) => r.companyId === company.id);
  const fiveStarReviews = companyReviews.filter((r) => r.rating === 5);

  // Load reviews on mount
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Title Suggestions
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
  const [seoScore, setSeoScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate recommended reviews (top 3 longest)
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
          }
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

  // Calculate SEO Score
  const calculateSEOScore = (blog: any) => {
    let score = 0;

    // GEO/Local (30 points)
    const companyMentions = (blog.content.match(new RegExp(company.name, 'gi')) || []).length;
    const locationMentions = (blog.content.match(new RegExp(company.city || '', 'gi')) || []).length;
    score += Math.min(companyMentions * 5, 15);
    score += Math.min(locationMentions * 2.5, 15);

    // Structure (25 points)
    const h3Count = (blog.content.match(/<h3>/g) || []).length;
    const hasBullets = blog.content.includes('<ul>') ? 8 : 0;
    const hasImages = selectedImages.length === 3 ? 7 : 0;
    score += Math.min(h3Count * 2, 10) + hasBullets + hasImages;

    // AI Discovery (25 points)
    const hasFAQs = blog.faqs && blog.faqs.length >= 5 ? 10 : 0;
    const hasQuickAnswer = blog.quickAnswer ? 8 : 0;
    const hasTakeaways = blog.keyTakeaways && blog.keyTakeaways.length >= 4 ? 7 : 0;
    score += hasFAQs + hasQuickAnswer + hasTakeaways;

    // Engagement (20 points)
    const hasReviews = selectedReviews.length === 3 ? 10 : 0;
    const hasKeywords = selectedTitle ? 5 : 0;
    const hasCTAs = 5;
    score += hasReviews + hasKeywords + hasCTAs;

    return Math.min(score, 100);
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
      
      const score = calculateSEOScore(data);
      setSeoScore(score);

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
        seoScore,
        authorName: selectedAuthor.name,
        authorTitle: selectedAuthor.title,
        authorBio: selectedAuthor.bio,
        status: 'draft',
      });

      alert('✅ Blog saved successfully!');
    } catch (error: any) {
      alert('❌ Failed to save blog: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
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
          <span className="text-xs text-slate-600">Topic</span>
          <span className="text-xs text-slate-600">Reviews</span>
          <span className="text-xs text-slate-600">Images</span>
          <span className="text-xs text-slate-600">Generate</span>
          <span className="text-xs text-slate-600">Publish</span>
        </div>
      </Card>

      {/* Step 1: Generate & Select Title */}
      {currentStep === 1 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 1: Select Blog Topic</h3>
          </div>

          {!selectedTitle && titleSuggestions.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">Generate 5 AI-powered blog title suggestions</p>
              {titleError && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                  <p className="text-sm text-red-600">{titleError}</p>
                </div>
              )}
              <Button 
                onClick={generateTitles} 
                disabled={generatingTitles}
                size="lg"
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
          )}

          {!selectedTitle && titleSuggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">Select a blog topic:</p>
              {titleSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => selectTitle(suggestion)}
                  className="p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <h4 className="font-semibold text-slate-900 mb-1">{suggestion.h1}</h4>
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
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{selectedTitle.h1}</h4>
                    <p className="text-sm text-slate-600 mb-3">{selectedTitle.h2}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTitle.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                </div>
              </div>

              <Button onClick={() => setCurrentStep(2)} className="w-full" size="lg">
                Next: Select Reviews <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Review Selection */}
      {currentStep === 2 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 2: Select 3 Reviews</h3>
            <Badge variant="secondary">{selectedReviews.length}/3 selected</Badge>
          </div>

          {fiveStarReviews.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No 5-star reviews available for this company.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {fiveStarReviews.map((review) => {
                const isRecommended = recommendedReviews.includes(review.id);
                const isSelected = selectedReviews.find(r => r.id === review.id);

                return (
                  <div
                    key={review.id}
                    onClick={() => toggleReview(review)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isRecommended && !isSelected && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
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
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{review.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{review.platform}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
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
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 3: Select 3 Images</h3>
            <Badge variant="secondary">{selectedImages.length}/3 selected</Badge>
          </div>

          {availableImages.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No images available in Media Gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {availableImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => toggleImage(url)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-4 transition-all ${
                    selectedImages.includes(url)
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img 
                    src={url} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedImages.includes(url) && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
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

      {/* Step 4: Generate Blog */}
      {currentStep === 4 && selectedTitle && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 4: Generate Blog</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">TOPIC:</p>
                <p className="text-sm font-semibold text-slate-900">{selectedTitle.h1}</p>
                <p className="text-xs text-slate-600">{selectedTitle.h2}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Reviews Selected</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedReviews.length}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Images Selected</p>
                  <p className="text-2xl font-bold text-green-600">{selectedImages.length}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Keywords</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedTitle.keywords.length}</p>
                </div>
              </div>
            </div>

            {generationError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-sm text-red-600">{generationError}</p>
              </div>
            )}

            <div className="flex gap-2">
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

      {/* Step 5: Preview & Save */}
      {currentStep === 5 && generatedBlog && selectedTitle && (
        <div className="space-y-6">
          {/* SEO Score */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">SEO Score</h3>
                <p className="text-sm text-slate-600">Overall optimization rating</p>
              </div>
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
            </div>
          </Card>

          {/* Blog Preview */}
          <Card className="p-8">
            {/* Quick Answer */}
            {generatedBlog.quickAnswer && (
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                <p className="text-sm font-medium text-blue-900 mb-1">⚡ QUICK ANSWER</p>
                <p className="text-slate-700">{generatedBlog.quickAnswer}</p>
              </div>
            )}

            {/* H1 & H2 */}
            <h1 className="text-4xl font-bold text-slate-900 mb-3">{selectedTitle.h1}</h1>
            <h2 className="text-xl text-slate-600 mb-6">{selectedTitle.h2}</h2>

            {/* Author */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                {selectedAuthor.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-slate-900">{selectedAuthor.name}</p>
                <p className="text-sm text-slate-600">{selectedAuthor.title}</p>
              </div>
            </div>

            {/* Key Takeaways */}
            {generatedBlog.keyTakeaways && generatedBlog.keyTakeaways.length > 0 && (
              <div className="bg-slate-50 p-6 rounded-lg mb-8">
                <h3 className="font-semibold text-slate-900 mb-3">📋 KEY TAKEAWAYS</h3>
                <ul className="space-y-2">
                  {generatedBlog.keyTakeaways.map((takeaway: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">→</span>
                      <span className="text-slate-700">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Content */}
            <div 
              className="prose prose-slate max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: generatedBlog.content }}
            />

            {/* FAQs */}
            {generatedBlog.faqs && generatedBlog.faqs.length > 0 && (
              <div className="bg-slate-50 p-6 rounded-lg mb-8">
                <h3 className="font-semibold text-slate-900 mb-4 text-xl">❓ Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {generatedBlog.faqs.map((faq: any, index: number) => (
                    <div key={index}>
                      <p className="font-medium text-slate-900 mb-2">{faq.q}</p>
                      <p className="text-slate-600 text-sm">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            <div className="bg-slate-100 p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0">
                  {selectedAuthor.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">{selectedAuthor.name}</h4>
                  <p className="text-sm text-slate-600 mb-2">{selectedAuthor.title}</p>
                  <p className="text-sm text-slate-700">{selectedAuthor.bio}</p>
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
                  <p className="font-medium text-slate-900">{author.name}</p>
                  <p className="text-sm text-slate-600">{author.title}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedTitle(null);
                  setTitleSuggestions([]);
                  setSelectedReviews([]);
                  setSelectedImages([]);
                  setGeneratedBlog(null);
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