'use client';

import { useState } from 'react';
import { FileText, Sparkles, Image, MessageSquare, CheckCircle, AlertCircle, Eye, Send, Loader2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Company } from '@/lib/types';

interface BlogBuilderProps {
  company: Company;
}

export function BlogBuilder({ company }: BlogBuilderProps) {
  const [step, setStep] = useState(1); // 1=topics, 2=review, 3=images, 4=generate, 5=edit
  const [generating, setGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [blogContent, setBlogContent] = useState({
    h1: '',
    h2: '',
    content: '',
    faqs: [],
    metaDescription: '',
    keywords: []
  });
  const [seoScore, setSeoScore] = useState(0);

  // Mock data - will connect to actual APIs
  const mockTopics = [
    {
      id: 1,
      h1: "How Often Should You Rotate Your Tires in Miami's Heat?",
      h2: "Florida's climate is tough on tires. Here's what local drivers need to know.",
      keywords: ['tire rotation', 'Miami', 'tire maintenance'],
      seoScore: 92
    },
    {
      id: 2,
      h1: "5 Signs You Need New Tires in South Florida",
      h2: "Don't wait for a blowout. Watch for these warning signs.",
      keywords: ['tire replacement', 'Miami', 'tire safety'],
      seoScore: 88
    },
    {
      id: 3,
      h1: "Best Tire Shops in Miami: What to Look For",
      h2: "Not all tire shops are created equal. Here's how to choose the right one.",
      keywords: ['tire shop Miami', 'best tires', 'auto service'],
      seoScore: 95
    },
    {
      id: 4,
      h1: "Tire Alignment vs. Tire Rotation: Miami Driver's Guide",
      h2: "Understanding the difference can save you hundreds in tire costs.",
      keywords: ['alignment', 'rotation', 'Miami', 'tire care'],
      seoScore: 85
    },
    {
      id: 5,
      h1: "Why Your Tires Wear Faster in Florida (And What to Do About It)",
      h2: "Heat, humidity, and highways take a toll. Here's how to protect your investment.",
      keywords: ['tire wear', 'Florida', 'heat damage', 'tire life'],
      seoScore: 90
    }
  ];

  const mockReviews = [
    {
      id: 1,
      author: 'Maria G.',
      text: 'Best tire service in Miami! Fast, professional, and they explained everything clearly.',
      rating: 5,
      date: '2025-10-15'
    },
    {
      id: 2,
      author: 'John D.',
      text: 'Fixed my alignment issue same day. Great prices and honest service.',
      rating: 5,
      date: '2025-10-10'
    },
    {
      id: 3,
      author: 'Sarah M.',
      text: 'The team at Mr Goma Tires went above and beyond. Highly recommend!',
      rating: 5,
      date: '2025-10-08'
    }
  ];

  const mockImages = [
    { id: 1, url: '/placeholder-shop.jpg', alt: 'Shop exterior', title: 'Shop Front' },
    { id: 2, url: '/placeholder-mechanic.jpg', alt: 'Mechanic working', title: 'Mechanic at Work' },
    { id: 3, url: '/placeholder-tools.jpg', alt: 'Tools on workbench', title: 'Professional Tools' },
    { id: 4, url: '/placeholder-car.jpg', alt: 'Car on lift', title: 'Service Bay' },
    { id: 5, url: '/placeholder-tire.jpg', alt: 'Tire close up', title: 'Tire Detail' },
    { id: 6, url: '/placeholder-waiting.jpg', alt: 'Waiting area', title: 'Customer Lounge' },
    { id: 7, url: '/placeholder-team.jpg', alt: 'Team photo', title: 'Our Team' },
    { id: 8, url: '/placeholder-sign.jpg', alt: 'Business sign', title: 'Storefront Sign' }
  ];

  const generateTopics = async () => {
    setGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTopics(mockTopics);
    setGenerating(false);
    setStep(1);
  };

  const generateBlog = async () => {
    setGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock generated content
    setBlogContent({
      h1: selectedTopic.h1,
      h2: selectedTopic.h2,
      content: `<p>When ${selectedReview.author} needed tire service in Miami, she discovered what sets ${company.name} apart from other shops in South Florida...</p>
      
<h3>Why Tire Rotation Matters in Miami's Climate</h3>
<p>Miami's intense heat and humidity create unique challenges for tire maintenance. The constant exposure to high temperatures can accelerate tire wear, making regular rotation even more critical than in cooler climates.</p>

<h3>What Sets Quality Tire Service Apart</h3>
<p>As ${selectedReview.author} experienced firsthand:</p>
<blockquote>"${selectedReview.text}"</blockquote>
<p>This kind of service excellence comes from years of experience and a commitment to customer satisfaction.</p>

<h3>The Professional Approach to Tire Rotation</h3>
<p>At ${company.name}, the process involves more than just moving tires around. Our certified technicians inspect each tire for wear patterns, check alignment, and ensure proper inflation.</p>

<h3>Your Tire Maintenance Schedule in South Florida</h3>
<p>Given Miami's unique driving conditions, we recommend tire rotation every 5,000-6,000 miles, or roughly every 6 months for most drivers.</p>`,
      faqs: [
        { q: "How often should I rotate my tires in Miami?", a: "In Miami's heat, we recommend tire rotation every 5,000-6,000 miles." },
        { q: "How much does tire rotation cost in Miami?", a: "Tire rotation typically costs $20-$40, but many shops include it free with other services." },
        { q: "Can I rotate my own tires?", a: "While possible, professional rotation ensures proper torque and allows for inspection." },
        { q: "What happens if I don't rotate my tires?", a: "Uneven wear can reduce tire life by up to 50% and affect handling." },
        { q: "Does Mr Goma Tires offer free tire rotation?", a: "Contact us for current promotions and service packages." }
      ],
      metaDescription: `Learn how often to rotate your tires in Miami's heat. Expert advice from ${company.name} on tire maintenance for South Florida drivers.`,
      keywords: selectedTopic.keywords
    });
    
    calculateSEOScore();
    setGenerating(false);
    setStep(5);
  };

  const calculateSEOScore = () => {
    // Mock scoring - will be real calculation
    const scores = {
      geoLocal: 28, // out of 30
      structure: 23, // out of 25
      aiDiscovery: 24, // out of 25
      engagement: 18 // out of 20
    };
    const total = scores.geoLocal + scores.structure + scores.aiDiscovery + scores.engagement;
    setSeoScore(total);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-300';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-7 h-7" />
              <h2 className="text-3xl font-bold">Blog Builder</h2>
            </div>
            <p className="text-purple-100 text-lg">
              AI-powered blog creation for {company.name}
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/30">
            <div className="text-sm text-purple-100 mb-1 font-medium">Step</div>
            <div className="text-xl font-bold">{step} of 5</div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`h-2 rounded-full flex-1 transition-all ${
                s <= step ? 'bg-white' : 'bg-white/30'
              }`} />
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-xs text-purple-100 mt-2">
          <span>Topics</span>
          <span>Review</span>
          <span>Images</span>
          <span>Generate</span>
          <span>Edit</span>
        </div>
      </div>

      {/* Step 1: Topic Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Choose Your Blog Topic
              </h3>
              <p className="text-slate-600">
                AI analyzed {company.name} and generated these optimized topics
              </p>
            </div>

            {topics.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <button
                  onClick={generateTopics}
                  disabled={generating}
                  className="px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      Generating Topics...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 inline mr-2" />
                      Generate Blog Topics with AI
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedTopic?.id === topic.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900 mb-2">
                          {topic.h1}
                        </h4>
                        <p className="text-slate-600 text-sm mb-3">
                          {topic.h2}
                        </p>
                      </div>
                      <div className={`ml-4 px-3 py-1 rounded-full text-sm font-bold border-2 ${getScoreColor(topic.seoScore)}`}>
                        {topic.seoScore}/100
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-slate-500 font-medium">🎯 Keywords:</span>
                      {topic.keywords.map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={generateTopics}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-all"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Regenerate Topics
                  </button>
                  
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedTopic}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  >
                    Continue with Selected Topic →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Review Selection */}
      {step === 2 && (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Select Customer Review to Feature
            </h3>
            <p className="text-slate-600">
              Choose a review that will be naturally embedded in your blog content
            </p>
          </div>

          <div className="space-y-4">
            {mockReviews.map((review) => (
              <div
                key={review.id}
                onClick={() => setSelectedReview(review)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedReview?.id === review.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-slate-900">{review.author}</span>
                      <div className="flex gap-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <span key={i} className="text-yellow-400">⭐</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-700 italic">"{review.text}"</p>
                  </div>
                  {selectedReview?.id === review.id && (
                    <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-slate-500">{review.date}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-all"
            >
              ← Back
            </button>
            
            <button
              onClick={() => setStep(3)}
              disabled={!selectedReview}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              Continue to Images →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Image Selection */}
      {step === 3 && (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Select Images for Your Blog
            </h3>
            <p className="text-slate-600">
              Choose 3 images that AI will reference naturally in the content
            </p>
            <div className="mt-3 text-sm text-slate-500">
              Selected: {selectedImages.length}/3 images
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {mockImages.map((img) => {
              const isSelected = selectedImages.find(i => i.id === img.id);
              return (
                <div
                  key={img.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedImages(selectedImages.filter(i => i.id !== img.id));
                    } else if (selectedImages.length < 3) {
                      setSelectedImages([...selectedImages, img]);
                    }
                  }}
                  className={`relative aspect-square rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
                    isSelected
                      ? 'border-purple-500 ring-4 ring-purple-200'
                      : 'border-slate-200 hover:border-purple-300'
                  } ${selectedImages.length >= 3 && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <Image className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs font-medium">
                    {img.title}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-all"
            >
              ← Back
            </button>
            
            <button
              onClick={() => setStep(4)}
              disabled={selectedImages.length !== 3}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              Continue to Generate →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generate Blog */}
      {step === 4 && (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
          <div className="text-center py-12">
            <Sparkles className="w-20 h-20 text-purple-400 mx-auto mb-6 animate-pulse" />
            
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Generate Your Blog
            </h3>
            
            <div className="max-w-2xl mx-auto mb-8 space-y-3 text-left bg-slate-50 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Topic:</span>
                  <span className="text-slate-700 ml-2">{selectedTopic?.h1}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Review:</span>
                  <span className="text-slate-700 ml-2">"{selectedReview?.text}"</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Images:</span>
                  <span className="text-slate-700 ml-2">{selectedImages.length} selected</span>
                </div>
              </div>
            </div>

            <button
              onClick={generateBlog}
              disabled={generating}
              className="px-12 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin inline mr-3" />
                  AI is writing your blog...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 inline mr-3" />
                  Generate Blog with AI
                </>
              )}
            </button>

            {generating && (
              <div className="mt-8 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                  <span>Analyzing company data...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span>Writing 1000-word blog...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  <span>Embedding review naturally...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
                  <span>Generating FAQs with location keywords...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }} />
                  <span>Optimizing for SEO & AI discovery...</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              disabled={generating}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-all disabled:opacity-50"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Edit & Publish */}
      {step === 5 && (
        <div className="space-y-6">
          {/* SEO Score Card */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">SEO/GEO Optimization Score</h3>
                <p className="text-sm text-slate-600">Your blog is ready for review</p>
              </div>
              
              <div className="text-right">
                <div className={`text-5xl font-bold mb-1 ${seoScore >= 90 ? 'text-green-600' : seoScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {seoScore}
                </div>
                <div className="text-sm text-slate-500 font-medium">out of 100</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">28/30</div>
                <div className="text-xs text-green-700 font-medium">GEO/Local</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">23/25</div>
                <div className="text-xs text-green-700 font-medium">Structure</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">24/25</div>
                <div className="text-xs text-green-700 font-medium">AI Discovery</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600 mb-1">18/20</div>
                <div className="text-xs text-yellow-700 font-medium">Engagement</div>
              </div>
            </div>
          </div>

          {/* Blog Content */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">H1 Title</label>
              <input
                type="text"
                value={blogContent.h1}
                onChange={(e) => setBlogContent({ ...blogContent, h1: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-lg font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">H2 Subtitle</label>
              <input
                type="text"
                value={blogContent.h2}
                onChange={(e) => setBlogContent({ ...blogContent, h2: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Blog Content</label>
              <div className="border-2 border-slate-200 rounded-lg p-4 min-h-[400px] prose max-w-none"
                   dangerouslySetInnerHTML={{ __html: blogContent.content }}
              />
              <p className="text-xs text-slate-500 mt-2">Rich text editor will be added in next iteration</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">FAQs ({blogContent.faqs.length})</label>
              <div className="space-y-3">
                {blogContent.faqs.map((faq: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="font-semibold text-slate-900 mb-1">{faq.q}</div>
                    <div className="text-slate-700 text-sm">{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-all"
              >
                ← Regenerate
              </button>
              
              <button
                className="px-8 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition-all"
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Preview
              </button>
              
              <button
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-all flex-1"
              >
                <Send className="w-4 h-4 inline mr-2" />
                Publish to Webflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}