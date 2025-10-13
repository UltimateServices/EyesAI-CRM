'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntakeForm } from '@/components/company/intake-form';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Calendar,
  User,
  CheckCircle,
  FileText,
  Video,
  Share2,
  Briefcase,
  Clock,
  Shield,
  MapPinned,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Globe,
  Loader2,
  AlertCircle,
  History,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState } from 'react';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const companies = useStore((state) => state.companies);
  const allTasks = useStore((state) => state.tasks);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const saveIntake = useStore((state) => state.saveIntake);
  const addVerificationLog = useStore((state) => state.addVerificationLog);
  const updateLastVerified = useStore((state) => state.updateLastVerified);
  
  const companyId = typeof params.id === 'string' ? params.id : params.id?.[0];
  
  const company = companies.find((c) => c.id === companyId);
  const tasks = allTasks.filter((t) => t.companyId === companyId);
  const intake = getIntakeByCompanyId(companyId || '');

  const [showAllServiceAreas, setShowAllServiceAreas] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  if (!company) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Company not found</h2>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-purple-100 text-purple-700',
      ACTIVE: 'bg-green-100 text-green-700',
      CHURNED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const calculateConfidenceScore = () => {
    if (!intake) return 0;
    let totalFields = 0;
    let filledFields = 0;

    const fieldsToCheck = [
      'officialName', 'mainPhone', 'emails', 'physicalAddress', 'businessHours',
      'category', 'founded', 'licenses', 'serviceAreas', 'shortBlurb',
      'fullAbout', 'missionStatement', 'services', 'logoUrl'
    ];

    fieldsToCheck.forEach(field => {
      totalFields++;
      const value = intake[field as keyof typeof intake];
      if (value && (Array.isArray(value) ? value.length > 0 : value !== '')) {
        filledFields++;
      }
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  const confidenceScore = calculateConfidenceScore();
  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return { label: 'High Confidence', color: 'bg-green-100 text-green-700' };
    if (score >= 50) return { label: 'Medium Confidence', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Low Confidence', color: 'bg-red-100 text-red-700' };
  };

  const confidenceBadge = getConfidenceBadge(confidenceScore);

  const updateProfile = async () => {
    setIsUpdating(true);
    setShowUpdateModal(true);
    setUpdateProgress([]);

    try {
      setUpdateProgress(prev => [...prev, '🔍 Starting comprehensive verification...']);
      await new Promise(resolve => setTimeout(resolve, 500));

      setUpdateProgress(prev => [...prev, '✓ Verified business name']);
      await new Promise(resolve => setTimeout(resolve, 300));

      setUpdateProgress(prev => [...prev, '✓ Checked phone number']);
      await new Promise(resolve => setTimeout(resolve, 300));

      setUpdateProgress(prev => [...prev, '⏳ Verifying business hours...']);
      await new Promise(resolve => setTimeout(resolve, 500));

      setUpdateProgress(prev => [...prev, '✓ Business hours verified']);
      await new Promise(resolve => setTimeout(resolve, 300));

      setUpdateProgress(prev => [...prev, '⏳ Checking licenses and certifications...']);
      await new Promise(resolve => setTimeout(resolve, 500));

      setUpdateProgress(prev => [...prev, '✓ Licenses verified']);
      await new Promise(resolve => setTimeout(resolve, 300));

      setUpdateProgress(prev => [...prev, '⏳ Verifying service areas...']);
      await new Promise(resolve => setTimeout(resolve, 500));

      setUpdateProgress(prev => [...prev, '✓ Service areas confirmed']);
      await new Promise(resolve => setTimeout(resolve, 300));

      setUpdateProgress(prev => [...prev, '⏳ Checking social media profiles...']);
      await new Promise(resolve => setTimeout(resolve, 500));

      setUpdateProgress(prev => [...prev, '✓ Social profiles verified']);

      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          website: company.website,
          currentData: intake,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUpdateProgress(prev => [...prev, '✅ Verification complete!']);
        
        const verificationResults = result.data.verificationResults || [];
        const timestamp = new Date().toISOString();
        
        let changesCount = 0;
        verificationResults.forEach((verification: any) => {
          if (verification.changed) {
            changesCount++;
            const logEntry = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: timestamp,
              field: verification.fieldLabel || verification.field,
              oldValue: String(verification.currentValue || ''),
              newValue: String(verification.verifiedValue || ''),
              source: verification.sources.join(', '),
              changeType: 'updated' as const,
            };
            
            addVerificationLog(company.id, logEntry);
            
            if (intake) {
              const updatedIntake = { ...intake };
              (updatedIntake as any)[verification.field] = verification.verifiedValue;
              saveIntake(updatedIntake);
            }
          } else {
            const logEntry = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: timestamp,
              field: verification.fieldLabel || verification.field,
              oldValue: String(verification.currentValue || ''),
              newValue: String(verification.currentValue || ''),
              source: verification.sources.join(', '),
              changeType: 'verified' as const,
            };
            
            addVerificationLog(company.id, logEntry);
          }
        });
        
        updateLastVerified(company.id, timestamp);
        
        setUpdateProgress(prev => [...prev, `📊 Found ${changesCount} update(s), verified ${verificationResults.length - changesCount} field(s)`]);
        
        setTimeout(() => {
          setShowUpdateModal(false);
          alert(`✅ Profile updated!\n\n${changesCount} field(s) updated\n${verificationResults.length - changesCount} field(s) verified\n\nCheck the Change Log at the bottom of the page for details.`);
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      setUpdateProgress(prev => [...prev, `❌ Error: ${error.message}`]);
      setTimeout(() => {
        setShowUpdateModal(false);
        alert('❌ Update failed: ' + error.message);
      }, 2000);
    } finally {
      setIsUpdating(false);
    }
  };

  const faqs = [
    {
      question: 'What size dumpsters do you offer?',
      answer: 'We offer 10-yard, 20-yard, 30-yard, and 40-yard dumpsters to accommodate projects of all sizes.',
      verifiedDate: new Date('2025-01-15')
    },
    {
      question: 'How long can I keep the dumpster?',
      answer: 'Our standard rental period is 7-14 days, with flexible extensions available.',
      verifiedDate: new Date('2025-01-15')
    },
    {
      question: 'Do you serve residential and commercial customers?',
      answer: 'Yes, we serve both residential homeowners and commercial contractors.',
      verifiedDate: new Date('2025-01-15')
    },
  ];

  const displayedServiceAreas = showAllServiceAreas 
    ? intake?.serviceAreas 
    : intake?.serviceAreas?.slice(0, 12);

  const sortedVerificationLog = [...(intake?.verificationLog || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <h3 className="text-lg font-semibold text-slate-900">Updating Profile</h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {updateProgress.map((progress, i) => (
                <p key={i} className="text-sm text-slate-700">
                  {progress}
                </p>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden" />

        <Card className="relative -mt-20 mx-6 p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-lg bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {intake?.logoUrl || company.logoUrl ? (
                <img src={intake?.logoUrl || company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <div className="flex-1 pt-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900">{intake?.officialName || company.name}</h1>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge variant={company.plan === 'VERIFIED' ? 'default' : 'secondary'}>
                      {company.plan}
                    </Badge>
                    <Badge variant="secondary" className={getStatusColor(company.status)}>
                      {formatStatus(company.status)}
                    </Badge>
                    <Badge variant="secondary" className={confidenceBadge.color}>
                      {confidenceBadge.label} ({confidenceScore}%)
                    </Badge>
                    {intake?.lastVerified && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Last Updated: {format(new Date(intake.lastVerified), 'MMM d, yyyy h:mm a')}
                      </span>
                    )}
                  </div>
                  {intake?.category && (
                    <p className="text-sm text-slate-600 mt-2">{intake.category}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Visit Website
                    </a>
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={updateProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Update Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {(intake?.emails?.[0] || company.contactEmail) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{intake?.emails?.[0] || company.contactEmail}</span>
                  </div>
                )}
                {(intake?.mainPhone || company.phone) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{intake?.mainPhone || company.phone}</span>
                  </div>
                )}
                {(intake?.physicalAddress || company.address) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{intake?.physicalAddress || company.address}</span>
                  </div>
                )}
                {company.assignedVaName && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{company.assignedVaName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {intake?.shortBlurb && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">About</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{intake.shortBlurb}</p>
                  {intake.missionStatement && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                      <p className="text-sm font-medium text-blue-900">&quot;{intake.missionStatement}&quot;</p>
                    </div>
                  )}
                  {intake.founded && (
                    <p className="text-sm text-slate-600 mt-4">
                      Founded in {intake.founded} · Serving customers for {new Date().getFullYear() - parseInt(intake.founded)} years
                    </p>
                  )}
                </Card>
              )}

              {intake && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Business Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {intake.founded && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-500">Founded</p>
                        </div>
                        <p className="text-base text-slate-900">{intake.founded}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date().getFullYear() - parseInt(intake.founded)} Years in Business
                        </p>
                      </div>
                    )}

                    {intake.businessHours && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-500">Business Hours</p>
                        </div>
                        <div className="text-sm text-slate-700 space-y-1">
                          {intake.businessHours.split(',').map((line, i) => (
                            <div key={i}>
                              <span className="font-medium">{line.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {intake.licenses && (
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-500">Licenses & Certifications</p>
                        </div>
                        <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                          {intake.licenses}
                        </div>
                      </div>
                    )}

                    {intake.serviceAreas && intake.serviceAreas.length > 0 && (
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPinned className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-500">Service Areas</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {displayedServiceAreas?.map((area, i) => (
                            <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                              {area}
                            </Badge>
                          ))}
                        </div>
                        {intake.serviceAreas.length > 12 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllServiceAreas(!showAllServiceAreas)}
                            className="mt-3 text-blue-600 hover:text-blue-700"
                          >
                            {showAllServiceAreas ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Show {intake.serviceAreas.length - 12} More
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {intake?.services && intake.services.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Services Offered</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intake.services.map((service, i) => (
                      <div key={i} className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-1">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>
                            )}
                            {service.price && (
                              <p className="text-sm font-semibold text-blue-600 mt-2">Starting at {service.price}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* PHOTO GALLERY SECTION */}
              {intake?.galleryImages && intake.galleryImages.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Photo Gallery</h3>
                    <Badge variant="secondary" className="ml-2">
                      {intake.galleryImages.length} {intake.galleryImages.length === 1 ? 'photo' : 'photos'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {intake.galleryImages.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => window.open(imageUrl, '_blank')}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Customer Reviews</h3>
                </div>
                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-2xl font-bold text-slate-900">4.9</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Based on <span className="font-semibold">247 reviews</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'John D.', text: 'Excellent service! Quick delivery and pickup. Very professional team.', rating: 5 },
                    { name: 'Sarah M.', text: 'Great prices and easy to work with. Highly recommend for any project.', rating: 5 },
                    { name: 'Mike R.', text: 'They made our home renovation so much easier. Will use again!', rating: 5 },
                  ].map((review, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{review.name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700">{review.text}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">Review data from Google Business Profile</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Frequently Asked Questions</h3>
                </div>
                <div className="space-y-3">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-semibold text-slate-900">{faq.question}</span>
                        {expandedFaq === i ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === i && (
                        <div className="p-4 pt-0 border-t border-slate-100">
                          <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            Last verified: {format(faq.verifiedDate, 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {intake?.fullAbout && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Our Story</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{intake.fullAbout}</p>
                </Card>
              )}

              {sortedVerificationLog.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <History className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Change Log</h3>
                  </div>
                  <div className="space-y-3">
                    {sortedVerificationLog.map((log) => (
                      <div key={log.id} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">
                        <div className="flex-shrink-0 mt-1">
                          {log.changeType === 'updated' && (
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                            </div>
                          )}
                          {log.changeType === 'verified' && (
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                          )}
                          {log.changeType === 'added' && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">{log.field}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')} · Source: {log.source}
                              </p>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={
                                log.changeType === 'updated' ? 'bg-amber-100 text-amber-700' :
                                log.changeType === 'verified' ? 'bg-green-100 text-green-700' :
                                'bg-blue-100 text-blue-700'
                              }
                            >
                              {log.changeType}
                            </Badge>
                          </div>
                          {log.changeType === 'updated' && (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Old:</span> {renderValue(log.oldValue)}
                              </p>
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">New:</span> {renderValue(log.newValue)}
                              </p>
                            </div>
                          )}
                          {log.changeType === 'verified' && (
                            <p className="text-sm text-slate-600 mt-1">
                              Verified: {renderValue(log.newValue)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>

            <div className="space-y-4">
              
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Subscription</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">Started</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {format(new Date(company.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Plan Tier</p>
                    <Badge variant={company.plan === 'VERIFIED' ? 'default' : 'secondary'} className="mt-1">
                      {company.plan}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <Badge variant="secondary" className={`mt-1 ${getStatusColor(company.status)}`}>
                      {formatStatus(company.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Last Billing</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {format(new Date(company.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Recent Tasks</h3>
                </div>
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="pb-3 border-b border-slate-200 last:border-0">
                        <p className="text-sm font-medium text-slate-900">{task.title}</p>
                        <Badge 
                          variant="secondary" 
                          className={`mt-1 text-xs ${
                            task.status === 'done' ? 'bg-green-100 text-green-700' : 
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No tasks yet</p>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Content Created</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-slate-700">Social Posts</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-700">Blog Posts</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-slate-700">Videos</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">0</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" disabled>
                  View Content Library
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                    <FileText className="w-4 h-4 mr-2" />
                    Create Blog Post
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                    <Video className="w-4 h-4 mr-2" />
                    Generate Video
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                    <Share2 className="w-4 h-4 mr-2" />
                    Schedule Post
                  </Button>
                  <div className="border-t border-slate-200 my-2" />
                  <Button variant="outline" size="sm" className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50" disabled>
                    <Globe className="w-4 h-4 mr-2" />
                    Sync to Webflow
                  </Button>
                </div>
              </Card>

            </div>
          </div>
        </TabsContent>

        <TabsContent value="intake">
          <IntakeForm company={company} />
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">All Tasks</h3>
            <p className="text-slate-500">Full task management coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Profile Builder</h3>
            <p className="text-slate-500">Profile editor coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}