'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Company, Review } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link as LinkIcon
} from 'lucide-react';

interface BlogBuilderProps {
  company: Company;
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
  const saveBlog = useStore((state) => state.saveBlog);

  const intake = getIntakeByCompanyId(company.id);
  const companyReviews = reviews.filter((r) => r.companyId === company.id);
  const fiveStarReviews = companyReviews.filter((r) => r.rating === 5);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Blog Topic
  const [h1, setH1] = useState('');
  const [h2, setH2] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  // Step 2: Review Selection
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([]);

  // Step 3: Image Selection
  const availableImages = intake?.galleryLinks || [];
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageAltTexts, setImageAltTexts] = useState<Record<string, string>>({});

  // Step 4: Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Step 5: Generated Blog
  const [generatedBlog, setGeneratedBlog] = useState<any>(null);
  const [selectedAuthor, setSelectedAuthor] = useState(AUTHORS[0]);
  const [seoScore, setSeoScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate alt text suggestions when images are selected
  useEffect(() => {
    if (selectedImages.length === 3 && Object.keys(imageAltTexts).length === 0) {
      const suggestions: Record<string, string> = {};
      selectedImages.forEach((url, index) => {
        suggestions[url] = `${company.name} professional service in ${company.city} - Image ${index + 1}`;
      });
      setImageAltTexts(suggestions);
    }
  }, [selectedImages, company.name, company.city]);

  // Calculate SEO Score
  const calculateSEOScore = (blog: any) => {
    let score = 0;

    // GEO/Local (30 points)
    const companyMentions = (blog.content.match(new RegExp(company.name, 'gi')) || []).length;
    const locationMentions = (blog.content.match(new RegExp(company.city || '', 'gi')) || []).length;
    score += Math.min(companyMentions * 5, 15);
    score += Math.min(locationMentions * 3, 15);

    // Structure (25 points)
    const hasH3s = blog.content.includes('<h3>') ? 10 : 0;
    const hasBullets = blog.content.includes('<ul>') ? 8 : 0;
    const hasImages = selectedImages.length >= 3 ? 7 : 0;
    score += hasH3s + hasBullets + hasImages;

    // AI Discovery (25 points)
    const hasFAQs = blog.faqs && blog.faqs.length >= 5 ? 10 : 0;
    const hasQuickAnswer = blog.quickAnswer ? 8 : 0;
    const hasTakeaways = blog.keyTakeaways && blog.keyTakeaways.length >= 4 ? 7 : 0;
    score += hasFAQs + hasQuickAnswer + hasTakeaways;

    // Engagement (20 points)
    const hasReviews = selectedReviews.length >= 3 ? 10 : 0;
    const hasKeywords = keywords.length >= 3 ? 5 : 0;
    const hasCTAs = 5; // Assume we add CTAs
    score += hasReviews + hasKeywords + hasCTAs;

    return Math.min(score, 100);
  };

  // Step 1 Validation
  const canProceedFromStep1 = h1.trim().length > 0 && h2.trim().length > 0 && keywords.length >= 3;

  // Step 2 Validation
  const canProceedFromStep2 = selectedReviews.length === 3;

  // Step 3 Validation
  const canProceedFromStep3 = selectedImages.length === 3 && 
    selectedImages.every(url => imageAltTexts[url]?.trim().length > 0);

  // Handle keyword addition
  const addKeyword = () => {
    if (keywordInput.trim() && keywords.length < 10) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // Handle review selection (max 3)
  const toggleReview = (review: Review) => {
    if (selectedReviews.find(r => r.id === review.id)) {
      setSelectedReviews(selectedReviews.filter(r => r.id !== review.id));
    } else if (selectedReviews.length < 3) {
      setSelectedReviews([...selectedReviews, review]);
    }
  };

  // Handle image selection (max 3)
  const toggleImage = (url: string) => {
    if (selectedImages.includes(url)) {
      setSelectedImages(selectedImages.filter(u => u !== url));
      const newAltTexts = { ...imageAltTexts };
      delete newAltTexts[url];
      setImageAltTexts(newAltTexts);
    } else if (selectedImages.length < 3) {
      setSelectedImages([...selectedImages, url]);
    }
  };

  // Generate Blog
  const generateBlog = async () => {
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
          topic: { h1, h2 },
          selectedReviews: selectedReviews.map(r => ({
            author: r.author,
            text: r.text,
            rating: r.rating,
          })),
          selectedImages: selectedImages.map((url, index) => ({
            url,
            altText: imageAltTexts[url],
            position: index + 1,
          })),
          keywords,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate blog');
      }

      const data = await response.json();
      setGeneratedBlog(data);
      
      // Calculate SEO score
      const score = calculateSEOScore(data);
      setSeoScore(score);

      setCurrentStep(5);
    } catch (error: any) {
      console.error('Generation error:', error);
      setGenerationError(error.message || 'Failed to generate blog');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Blog
  const handleSaveBlog = async () => {
    if (!generatedBlog) return;

    setIsSaving(true);
    try {
      const imageData: SelectedImage[] = selectedImages.map((url, index) => ({
        url,
        altText: imageAltTexts[url],
        position: index + 1,
      }));

      await saveBlog({
        companyId: company.id,
        h1,
        h2,
        quickAnswer: generatedBlog.quickAnswer,
        keyTakeaways: generatedBlog.keyTakeaways,
        content: generatedBlog.content,
        faqs: generatedBlog.faqs,
        selectedImages: imageData,
        selectedReviewIds: selectedReviews.map(r => r.id),
        metaTitle: h1,
        metaDescription: generatedBlog.metaDescription,
        keywords,
        seoScore,
        authorName: selectedAuthor.name,
        authorTitle: selectedAuthor.title,
        authorBio: selectedAuthor.bio,
        status: 'draft',
      });

      alert('✅ Blog saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      alert('❌ Failed to save blog: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Share handlers
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out: ${h1}`;
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
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

      {/* Step 1: Blog Topic */}
      {currentStep === 1 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 1: Blog Topic</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                H1 Title *
              </label>
              <Input
                value={h1}
                onChange={(e) => setH1(e.target.value)}
                placeholder="How Often Should You Rotate Your Tires?"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                H2 Subtitle *
              </label>
              <Input
                value={h2}
                onChange={(e) => setH2(e.target.value)}
                placeholder="Expert tire rotation advice for Miami drivers"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target Keywords * (at least 3)
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="tire rotation Miami"
                  className="flex-1"
                />
                <Button onClick={addKeyword} disabled={keywords.length >= 10}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <button onClick={() => removeKeyword(index)} className="ml-1">×</button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Added {keywords.length} of 10 keywords
              </p>
            </div>

            <Button 
              onClick={() => setCurrentStep(2)} 
              disabled={!canProceedFromStep1}
              className="w-full"
            >
              Next: Select Reviews <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
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
              {fiveStarReviews.slice(0, 10).map((review) => (
                <div
                  key={review.id}
                  onClick={() => toggleReview(review)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedReviews.find(r => r.id === review.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{review.author}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    {selectedReviews.find(r => r.id === review.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{review.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{review.platform}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={() => setCurrentStep(3)} 
              disabled={!canProceedFromStep2}
              className="flex-1"
            >
              Next: Select Images <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Image Selection + Alt Text */}
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
            <>
              {/* Image Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {availableImages.slice(0, 12).map((url, index) => (
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

              {/* Alt Text Input (shows when 3 images selected) */}
              {selectedImages.length === 3 && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-slate-900">Add Alt Text for Selected Images</h4>
                  {selectedImages.map((url, index) => (
                    <div key={url} className="flex gap-4">
                      <img 
                        src={url} 
                        alt={`Selected ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Image {index + 1} Alt Text *
                        </label>
                        <Input
                          value={imageAltTexts[url] || ''}
                          onChange={(e) => setImageAltTexts({ ...imageAltTexts, [url]: e.target.value })}
                          placeholder={`${company.name} professional service in ${company.city}`}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={() => setCurrentStep(4)} 
              disabled={!canProceedFromStep3}
              className="flex-1"
            >
              Next: Generate Blog <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Generate Blog */}
      {currentStep === 4 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-900">Step 4: Generate Blog</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Topic:</span>
                <span className="text-sm text-slate-900">{h1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Reviews:</span>
                <span className="text-sm text-slate-900">{selectedReviews.length} selected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Images:</span>
                <span className="text-sm text-slate-900">{selectedImages.length} selected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Keywords:</span>
                <span className="text-sm text-slate-900">{keywords.length} keywords</span>
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
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Blog with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 5: Preview & Publish */}
      {currentStep === 5 && generatedBlog && (
        <div className="space-y-6">
          {/* SEO Score Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">SEO Score</h3>
                <p className="text-sm text-slate-600">Overall optimization rating</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold text-blue-600">{seoScore}</div>
                <TrendingUp className={`w-8 h-8 ${
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
            <h1 className="text-4xl font-bold text-slate-900 mb-3">{h1}</h1>
            <h2 className="text-xl text-slate-600 mb-6">{h2}</h2>

            {/* Author */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
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
                <h3 className="font-semibold text-slate-900 mb-4">❓ Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {generatedBlog.faqs.map((faq: any, index: number) => (
                    <div key={index}>
                      <p className="font-medium text-slate-900 mb-1">{faq.q}</p>
                      <p className="text-slate-600 text-sm">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Author Card */}
            <div className="bg-slate-100 p-6 rounded-lg mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  {selectedAuthor.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">{selectedAuthor.name}</h4>
                  <p className="text-sm text-slate-600 mb-2">{selectedAuthor.title}</p>
                  <p className="text-sm text-slate-700">{selectedAuthor.bio}</p>
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="border-t pt-6">
              <p className="text-sm font-medium text-slate-700 mb-3">Share this article:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('twitter')}
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('facebook')}
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('linkedin')}
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
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
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Blog (Draft)
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}