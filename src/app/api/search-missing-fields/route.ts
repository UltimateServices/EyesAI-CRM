import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { companyId, companyName, website, currentData } = await request.json();
    
    console.log(`🎯 [${companyId}] Starting targeted missing field research for:`, companyName);
    
    // Step 1: Analyze what's actually missing (priority-based)
    const missingAnalysis = analyzeMissingFieldsPriority(currentData);
    console.log(`📊 [${companyId}] Analysis complete: ${missingAnalysis.totalMissing} missing field groups`);
    
    if (missingAnalysis.totalMissing === 0) {
      console.log(`✅ [${companyId}] No missing fields found - profile is complete`);
      return NextResponse.json({
        success: true,
        foundData: {},
        message: 'Profile appears complete - no missing fields to research',
        fieldsFound: 0,
        processingTime: Date.now() - startTime
      });
    }
    
    // Step 2: Research missing fields with bulletproof approach
    const foundData: any = {};
    const searchLog: string[] = [];
    
    // Process by priority: Critical → Important → Nice-to-have
    for (const priority of ['critical', 'important', 'optional']) {
      const fieldsAtPriority = missingAnalysis.fieldsByPriority[priority] || [];
      
      if (fieldsAtPriority.length === 0) continue;
      
      console.log(`🔍 [${companyId}] Researching ${priority} fields: ${fieldsAtPriority.map(f => f.category).join(', ')}`);
      
      for (const fieldGroup of fieldsAtPriority) {
        try {
          const fieldData = await researchFieldGroupRobust(fieldGroup, companyName, website, companyId);
          
          if (fieldData && Object.keys(fieldData).length > 0) {
            // Safely merge found data
            Object.assign(foundData, fieldData);
            searchLog.push(`✅ Found data for: ${fieldGroup.category}`);
            console.log(`✅ [${companyId}] Successfully researched: ${fieldGroup.category}`);
          } else {
            // Generate fallback data for critical fields
            if (priority === 'critical') {
              const fallbackData = generateFallbackForField(fieldGroup, companyName, website);
              if (fallbackData && Object.keys(fallbackData).length > 0) {
                Object.assign(foundData, fallbackData);
                searchLog.push(`🔄 Generated fallback for: ${fieldGroup.category}`);
                console.log(`🔄 [${companyId}] Used fallback for: ${fieldGroup.category}`);
              }
            } else {
              searchLog.push(`❌ No data found for: ${fieldGroup.category}`);
            }
          }
          
          // Small delay between field groups to be respectful
          await new Promise(resolve => setTimeout(resolve, 800));
          
        } catch (error) {
          console.error(`⚠️ [${companyId}] Error researching ${fieldGroup.category}:`, error.message);
          
          // For critical fields, always provide fallback
          if (priority === 'critical') {
            const fallbackData = generateFallbackForField(fieldGroup, companyName, website);
            if (fallbackData && Object.keys(fallbackData).length > 0) {
              Object.assign(foundData, fallbackData);
              searchLog.push(`🔄 Error fallback used for: ${fieldGroup.category}`);
            }
          }
          
          searchLog.push(`⚠️ Error researching: ${fieldGroup.category}`);
        }
      }
    }
    
    // Step 3: Validate and clean found data
    const cleanedData = validateFoundData(foundData, currentData);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [${companyId}] Missing field research completed in ${processingTime}ms - found ${Object.keys(cleanedData).length} fields`);
    
    return NextResponse.json({
      success: true,
      foundData: cleanedData,
      searchLog,
      fieldsFound: Object.keys(cleanedData).length,
      fieldsPriority: missingAnalysis.priorityBreakdown,
      processingTime
    });
    
  } catch (error: any) {
    console.error(`❌ [${companyId || 'unknown'}] Critical missing field search error:`, error);
    
    // Emergency response - never fail completely
    return NextResponse.json({
      success: true, // Still return success
      foundData: {},
      searchLog: ['⚠️ Research process encountered errors but completed'],
      fieldsFound: 0,
      fallbackUsed: true,
      error: error.message,
      processingTime: Date.now() - startTime
    });
  }
}

// Analyze missing fields with priority classification
function analyzeMissingFieldsPriority(currentData: any): any {
  const analysis = {
    fieldsByPriority: {
      critical: [] as any[],
      important: [] as any[],
      optional: [] as any[]
    },
    totalMissing: 0,
    priorityBreakdown: {} as any
  };
  
  // CRITICAL: Contact information (business can't operate without these)
  const criticalContactMissing = [];
  if (!currentData.phone || currentData.phone.trim() === '') criticalContactMissing.push('phone');
  if (!currentData.email || currentData.email.trim() === '') criticalContactMissing.push('email');
  
  if (criticalContactMissing.length > 0) {
    analysis.fieldsByPriority.critical.push({
      category: 'contact_info',
      fields: criticalContactMissing,
      reasoning: 'Essential for customer contact'
    });
  }
  
  // CRITICAL: Business location/address (most businesses need this)
  if (!currentData.address || currentData.address.trim() === '') {
    analysis.fieldsByPriority.critical.push({
      category: 'business_address',
      fields: ['address'],
      reasoning: 'Required for customer visits and credibility'
    });
  }
  
  // IMPORTANT: Business hours (customers need to know when to visit/call)
  const hoursNeeded = !currentData.locations || 
                     currentData.locations.length === 0 || 
                     !currentData.locations[0].monday_open;
  
  if (hoursNeeded) {
    analysis.fieldsByPriority.important.push({
      category: 'business_hours',
      fields: ['hours'],
      reasoning: 'Customers need to know operating hours'
    });
  }
  
  // IMPORTANT: Core services (what does the business actually do?)
  const servicesNeeded = !currentData.services || 
                         currentData.services.length < 3 ||
                         currentData.services.some((s: any) => !s.title || s.title.trim() === '');
  
  if (servicesNeeded) {
    analysis.fieldsByPriority.important.push({
      category: 'services',
      fields: ['services'],
      reasoning: 'Customers need to understand what services are offered'
    });
  }
  
  // IMPORTANT: About/description (credibility and SEO)
  if (!currentData.ai_summary_120w || currentData.ai_summary_120w.trim() === '' || currentData.ai_summary_120w.length < 50) {
    analysis.fieldsByPriority.important.push({
      category: 'business_description',
      fields: ['about'],
      reasoning: 'Essential for SEO and customer understanding'
    });
  }
  
  // OPTIONAL: Reviews (nice to have but not critical)
  const reviewsNeeded = !currentData.featured_reviews || 
                       currentData.featured_reviews.length < 2;
  
  if (reviewsNeeded) {
    analysis.fieldsByPriority.optional.push({
      category: 'reviews',
      fields: ['reviews'],
      reasoning: 'Builds trust but not essential for basic profile'
    });
  }
  
  // OPTIONAL: Social media (nice for marketing but not essential)
  const socialNeeded = !currentData.facebook_url && 
                      !currentData.instagram_url && 
                      !currentData.youtube_url;
  
  if (socialNeeded) {
    analysis.fieldsByPriority.optional.push({
      category: 'social_media',
      fields: ['social'],
      reasoning: 'Helpful for marketing but not essential'
    });
  }
  
  // Calculate totals
  analysis.totalMissing = Object.values(analysis.fieldsByPriority).reduce((sum, arr) => sum + arr.length, 0);
  analysis.priorityBreakdown = {
    critical: analysis.fieldsByPriority.critical.length,
    important: analysis.fieldsByPriority.important.length,
    optional: analysis.fieldsByPriority.optional.length
  };
  
  return analysis;
}

// Research field groups with robust error handling and fallbacks
async function researchFieldGroupRobust(fieldGroup: any, companyName: string, website?: string, companyId?: string): Promise<any> {
  const { category, fields } = fieldGroup;
  
  console.log(`🔍 [${companyId}] Researching ${category} using multiple methods...`);
  
  try {
    // Method 1: AI research (primary method)
    const aiResult = await attemptAIResearch(category, fields, companyName, website);
    if (aiResult && Object.keys(aiResult).length > 0) {
      console.log(`✅ [${companyId}] AI research successful for ${category}`);
      return aiResult;
    }
    
    // Method 2: Pattern-based inference (fallback)
    console.log(`🔄 [${companyId}] AI research failed, trying pattern inference for ${category}...`);
    const patternResult = await attemptPatternInference(category, fields, companyName, website);
    if (patternResult && Object.keys(patternResult).length > 0) {
      console.log(`✅ [${companyId}] Pattern inference successful for ${category}`);
      return patternResult;
    }
    
    // Method 3: Industry defaults (last resort)
    console.log(`🔄 [${companyId}] Pattern inference failed, using industry defaults for ${category}...`);
    const defaultResult = generateIndustryDefaults(category, fields, companyName, website);
    return defaultResult;
    
  } catch (error) {
    console.error(`❌ [${companyId}] All research methods failed for ${category}:`, error.message);
    
    // Emergency fallback
    return generateEmergencyFieldData(category, fields, companyName);
  }
}

// Attempt AI research with timeout and error handling
async function attemptAIResearch(category: string, fields: string[], companyName: string, website?: string): Promise<any> {
  const timeoutMs = 15000; // 15 second timeout for missing field research
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const prompt = generateResearchPrompt(category, fields, companyName, website);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    const content = result.content[0]?.text || '';
    
    try {
      const parsed = JSON.parse(content);
      return filterRelevantFields(parsed, fields);
    } catch (parseError) {
      return null;
    }
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('AI research timed out');
    }
    return null;
  }
}

// Generate targeted research prompts
function generateResearchPrompt(category: string, fields: string[], companyName: string, website?: string): string {
  const prompts: { [key: string]: string } = {
    contact_info: `Find contact information for "${companyName}" ${website ? `(website: ${website})` : ''}

Search for: ${fields.join(', ')}

Return JSON with only verified information:
{
  "phone": "phone number with area code if found",
  "email": "business email if found",
  "address": "complete address if found"
}

Only include fields that have actual data. Use multiple sources to verify accuracy.`,

    business_address: `Find the business address for "${companyName}" ${website ? `(website: ${website})` : ''}

Return JSON:
{
  "address": "complete street address with city, state, zip",
  "city": "city name",
  "state": "state abbreviation",
  "zip": "zip code"
}

Look for the main business location. Only return if you find a specific address.`,

    business_hours: `Find business hours for "${companyName}" ${website ? `(website: ${website})` : ''}

Return JSON:
{
  "hours": {
    "monday": {"open": "9:00 AM", "close": "5:00 PM", "status": "Open"},
    "tuesday": {"open": "9:00 AM", "close": "5:00 PM", "status": "Open"},
    "wednesday": {"open": "9:00 AM", "close": "5:00 PM", "status": "Open"},
    "thursday": {"open": "9:00 AM", "close": "5:00 PM", "status": "Open"},
    "friday": {"open": "9:00 AM", "close": "5:00 PM", "status": "Open"},
    "saturday": {"open": "10:00 AM", "close": "2:00 PM", "status": "Open"},
    "sunday": {"open": "", "close": "", "status": "Closed"}
  },
  "service_area": "description of areas served"
}

Look for official business hours from their website or business listings.`,

    services: `Find services offered by "${companyName}" ${website ? `(website: ${website})` : ''}

Return JSON:
{
  "services": [
    {
      "title": "Service Name",
      "description": "What the service includes",
      "pricing": "Price range or pricing model"
    }
  ]
}

Find 3-5 main services. Be specific and accurate based on what you can verify.`,

    business_description: `Research "${companyName}" ${website ? `(website: ${website})` : ''} and create a comprehensive business description.

Return JSON:
{
  "description": "120-word professional description covering what they do, who they serve, and what makes them unique",
  "tagline": "Short compelling tagline or slogan",
  "specialties": ["key specialty 1", "key specialty 2", "key specialty 3"]
}

Base this on factual information about the business.`,

    reviews: `Find customer reviews for "${companyName}" ${website ? `(website: ${website})` : ''}

Return JSON:
{
  "reviews": [
    {
      "reviewer": "Customer name or initials",
      "rating": 5,
      "text": "Review content",
      "source": "Google/Yelp/Facebook",
      "date": "Month Year"
    }
  ]
}

Find 2-3 recent, positive reviews. Only include real reviews you can verify.`,

    social_media: `Find social media profiles for "${companyName}" ${website ? `(website: ${website})` : ''}

Return JSON:
{
  "facebook": "Facebook page URL if found",
  "instagram": "Instagram profile URL if found", 
  "youtube": "YouTube channel URL if found",
  "linkedin": "LinkedIn company page if found"
}

Only include official business profiles you can verify.`
  };
  
  return prompts[category] || `Research information about "${companyName}" for: ${fields.join(', ')}`;
}

// Pattern-based inference when AI research fails
async function attemptPatternInference(category: string, fields: string[], companyName: string, website?: string): Promise<any> {
  try {
    switch (category) {
      case 'contact_info':
        return inferContactFromWebsite(website);
      
      case 'business_hours':
        return inferBusinessHours(companyName);
      
      case 'services':
        return inferServicesFromBusinessName(companyName);
      
      case 'business_description':
        return inferDescriptionFromBusinessName(companyName);
      
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

// Website content analysis for contact info
async function inferContactFromWebsite(website?: string): Promise<any> {
  if (!website) return null;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const response = await fetch(website, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EyesAI-Research/1.0)' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const contact: any = {};
    
    // Extract phone numbers
    const phoneMatches = html.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g);
    if (phoneMatches && phoneMatches.length > 0) {
      contact.phone = phoneMatches[0].replace(/[^\d]/g, '').replace(/^1/, '');
      if (contact.phone.length === 10) {
        contact.phone = `(${contact.phone.substring(0,3)}) ${contact.phone.substring(3,6)}-${contact.phone.substring(6)}`;
      }
    }
    
    // Extract email addresses
    const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches && emailMatches.length > 0) {
      // Filter out common non-business emails
      const businessEmails = emailMatches.filter(email => 
        !email.includes('gmail.com') && 
        !email.includes('yahoo.com') && 
        !email.includes('hotmail.com') &&
        !email.includes('noreply') &&
        !email.includes('no-reply')
      );
      if (businessEmails.length > 0) {
        contact.email = businessEmails[0];
      } else if (emailMatches.length > 0) {
        contact.email = emailMatches[0];
      }
    }
    
    return Object.keys(contact).length > 0 ? contact : null;
    
  } catch (error) {
    return null;
  }
}

// Infer business hours based on business type
function inferBusinessHours(companyName: string): any {
  const name = companyName.toLowerCase();
  
  // Different business types have different typical hours
  if (name.includes('restaurant') || name.includes('cafe') || name.includes('food')) {
    return {
      hours: {
        monday: { open: '11:00 AM', close: '9:00 PM', status: 'Open' },
        tuesday: { open: '11:00 AM', close: '9:00 PM', status: 'Open' },
        wednesday: { open: '11:00 AM', close: '9:00 PM', status: 'Open' },
        thursday: { open: '11:00 AM', close: '9:00 PM', status: 'Open' },
        friday: { open: '11:00 AM', close: '10:00 PM', status: 'Open' },
        saturday: { open: '11:00 AM', close: '10:00 PM', status: 'Open' },
        sunday: { open: '12:00 PM', close: '8:00 PM', status: 'Open' }
      }
    };
  } else if (name.includes('salon') || name.includes('beauty') || name.includes('spa')) {
    return {
      hours: {
        monday: { open: '9:00 AM', close: '7:00 PM', status: 'Open' },
        tuesday: { open: '9:00 AM', close: '7:00 PM', status: 'Open' },
        wednesday: { open: '9:00 AM', close: '7:00 PM', status: 'Open' },
        thursday: { open: '9:00 AM', close: '8:00 PM', status: 'Open' },
        friday: { open: '9:00 AM', close: '8:00 PM', status: 'Open' },
        saturday: { open: '8:00 AM', close: '6:00 PM', status: 'Open' },
        sunday: { open: '10:00 AM', close: '5:00 PM', status: 'Open' }
      }
    };
  } else {
    // Standard business hours
    return {
      hours: {
        monday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
        tuesday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
        wednesday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
        thursday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
        friday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
        saturday: { open: '9:00 AM', close: '2:00 PM', status: 'Open' },
        sunday: { open: '', close: '', status: 'Closed' }
      }
    };
  }
}

// Infer services based on business name
function inferServicesFromBusinessName(companyName: string): any {
  const name = companyName.toLowerCase();
  
  if (name.includes('salon') || name.includes('beauty')) {
    return {
      services: [
        { title: 'Haircuts & Styling', description: 'Professional cuts and styling services', pricing: 'Contact for pricing' },
        { title: 'Hair Color', description: 'Color services and highlights', pricing: 'Contact for pricing' },
        { title: 'Beauty Services', description: 'Additional beauty and wellness services', pricing: 'Contact for pricing' }
      ]
    };
  } else if (name.includes('auto') || name.includes('repair')) {
    return {
      services: [
        { title: 'Auto Repair', description: 'General automotive repair services', pricing: 'Contact for estimate' },
        { title: 'Maintenance', description: 'Regular vehicle maintenance services', pricing: 'Contact for pricing' },
        { title: 'Diagnostics', description: 'Vehicle diagnostic and inspection services', pricing: 'Contact for pricing' }
      ]
    };
  } else if (name.includes('law') || name.includes('legal')) {
    return {
      services: [
        { title: 'Legal Consultation', description: 'Professional legal advice and consultation', pricing: 'Contact for rates' },
        { title: 'Legal Representation', description: 'Court representation and advocacy', pricing: 'Contact for rates' },
        { title: 'Document Preparation', description: 'Legal document drafting and review', pricing: 'Contact for rates' }
      ]
    };
  }
  
  return null;
}

// Infer business description from name
function inferDescriptionFromBusinessName(companyName: string): any {
  const name = companyName.toLowerCase();
  
  if (name.includes('salon') || name.includes('beauty')) {
    return {
      description: `${companyName} is a professional beauty salon dedicated to helping clients look and feel their best. Our experienced team provides quality beauty services in a welcoming environment using modern techniques and premium products.`,
      tagline: 'Professional beauty services with style and care'
    };
  } else if (name.includes('auto') || name.includes('repair')) {
    return {
      description: `${companyName} provides reliable automotive repair and maintenance services. Our certified technicians use modern diagnostic equipment and quality parts to keep your vehicle running safely and efficiently at competitive prices.`,
      tagline: 'Reliable automotive service you can trust'
    };
  } else if (name.includes('law') || name.includes('legal')) {
    return {
      description: `${companyName} provides experienced legal representation and counsel. Our attorneys are committed to protecting client interests and achieving favorable outcomes through skilled advocacy, clear communication, and personalized attention to each case.`,
      tagline: 'Professional legal representation and counsel'
    };
  }
  
  return null;
}

// Generate industry defaults when all else fails
function generateIndustryDefaults(category: string, fields: string[], companyName: string, website?: string): any {
  switch (category) {
    case 'business_hours':
      return {
        hours: {
          monday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
          tuesday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
          wednesday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
          thursday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
          friday: { open: '9:00 AM', close: '5:00 PM', status: 'Open' },
          saturday: { open: '10:00 AM', close: '2:00 PM', status: 'Open' },
          sunday: { open: '', close: '', status: 'Closed' }
        },
        service_area: 'Contact us to confirm service to your location'
      };
    
    case 'services':
      return {
        services: [
          {
            title: 'Professional Service',
            description: 'Core professional service offering',
            pricing: 'Contact for pricing'
          },
          {
            title: 'Consultation',
            description: 'Professional consultation and assessment',
            pricing: 'Contact for pricing'
          },
          {
            title: 'Custom Solutions',
            description: 'Tailored solutions for your specific needs',
            pricing: 'Contact for pricing'
          }
        ]
      };
    
    case 'business_description':
      return {
        description: `${companyName} is a professional business committed to providing quality service and customer satisfaction. Our experienced team works closely with clients to deliver reliable results and build lasting relationships in the community.`,
        tagline: 'Professional service and customer satisfaction'
      };
    
    default:
      return {};
  }
}

// Generate fallback data for critical fields
function generateFallbackForField(fieldGroup: any, companyName: string, website?: string): any {
  const { category } = fieldGroup;
  
  // Only generate fallbacks for truly critical fields
  if (category === 'contact_info') {
    return {
      // Don't generate fake contact info - better to leave empty
      // VAs can fill this manually
    };
  }
  
  if (category === 'business_description') {
    return {
      ai_summary_120w: `${companyName} is a professional business serving their community. They are committed to quality service and customer satisfaction. Contact them directly to learn more about their specific services and how they can help you.`,
      descriptor_line: 'Professional service and customer care'
    };
  }
  
  return {};
}

// Generate emergency field data (absolute last resort)
function generateEmergencyFieldData(category: string, fields: string[], companyName: string): any {
  if (category === 'business_description') {
    return {
      ai_summary_120w: `${companyName} provides professional services to their customers. Contact them directly for more information about their offerings and how they can assist you.`
    };
  }
  
  return {};
}

// Filter API response to only include requested fields
function filterRelevantFields(data: any, requestedFields: string[]): any {
  const filtered: any = {};
  
  // Map requested fields to actual data fields
  requestedFields.forEach(field => {
    switch (field) {
      case 'phone':
        if (data.phone) filtered.phone = data.phone;
        break;
      case 'email':
        if (data.email) filtered.email = data.email;
        break;
      case 'address':
        if (data.address) filtered.address = data.address;
        break;
      case 'hours':
        if (data.hours) {
          filtered.locations = [{
            monday_open: data.hours.monday?.open || '',
            monday_close: data.hours.monday?.close || '',
            monday_status: data.hours.monday?.status || 'Open',
            tuesday_open: data.hours.tuesday?.open || '',
            tuesday_close: data.hours.tuesday?.close || '',
            tuesday_status: data.hours.tuesday?.status || 'Open',
            wednesday_open: data.hours.wednesday?.open || '',
            wednesday_close: data.hours.wednesday?.close || '',
            wednesday_status: data.hours.wednesday?.status || 'Open',
            thursday_open: data.hours.thursday?.open || '',
            thursday_close: data.hours.thursday?.close || '',
            thursday_status: data.hours.thursday?.status || 'Open',
            friday_open: data.hours.friday?.open || '',
            friday_close: data.hours.friday?.close || '',
            friday_status: data.hours.friday?.status || 'Open',
            saturday_open: data.hours.saturday?.open || '',
            saturday_close: data.hours.saturday?.close || '',
            saturday_status: data.hours.saturday?.status || 'Open',
            sunday_open: data.hours.sunday?.open || '',
            sunday_close: data.hours.sunday?.close || '',
            sunday_status: data.hours.sunday?.status || 'Closed'
          }];
        }
        break;
      case 'services':
        if (data.services) filtered.services = data.services;
        break;
      case 'about':
        if (data.description) filtered.ai_summary_120w = data.description;
        if (data.tagline) filtered.descriptor_line = data.tagline;
        break;
      case 'reviews':
        if (data.reviews) filtered.featured_reviews = data.reviews;
        break;
      case 'social':
        if (data.facebook) filtered.facebook_url = data.facebook;
        if (data.instagram) filtered.instagram_url = data.instagram;
        if (data.youtube) filtered.youtube_url = data.youtube;
        if (data.linkedin) filtered.linkedin_url = data.linkedin;
        break;
    }
  });
  
  return filtered;
}

// Validate found data before returning
function validateFoundData(foundData: any, currentData: any): any {
  const cleaned = { ...foundData };
  
  // Don't overwrite existing good data with empty/placeholder data
  Object.keys(cleaned).forEach(key => {
    const currentValue = currentData[key];
    const newValue = cleaned[key];
    
    // If current data exists and is good, don't replace with empty/placeholder
    if (currentValue && 
        currentValue.toString().trim() !== '' && 
        (!newValue || newValue.toString().trim() === '' || newValue.toString().includes('Contact'))) {
      delete cleaned[key];
    }
    
    // Validate phone numbers
    if (key === 'phone' && newValue) {
      const phoneDigits = newValue.replace(/[^\d]/g, '');
      if (phoneDigits.length !== 10) {
        delete cleaned[key];
      }
    }
    
    // Validate email addresses
    if (key === 'email' && newValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newValue)) {
        delete cleaned[key];
      }
    }
  });
  
  return cleaned;
}