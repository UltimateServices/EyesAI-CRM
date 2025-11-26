// Fetch complete schemas for all CMS collections with relationships
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const WEBFLOW_SITE_ID = envVars.WEBFLOW_SITE_ID || '68db778020fc2ac5c78f401a';
const WEBFLOW_TOKEN = envVars.WEBFLOW_CMS_SITE_API_TOKEN;

// All collections from the screenshots
const collections = {
  'Profiles': '6919a7f067ba553645e406a6',
  'Blogs': '6924108f80f9c5582bc96d73',
  'Videos': '692411de97b9276613a4ccb7',
  'Services': '691b7c75c939d316cb7f73b0',
  'Services References': '69258b73b4aa5928c4949176',
  'Scenarios': '692591ebc2715ac9182e11d6',
  'Locations': '6925a0fc2f4eac43ffd125f6',
  'Reviews': '6917304967a914982fd205bc',
  'Categories': '6919a0588e5306c0feb97046',
  'FAQs': '692411f2a535a2edbb68ecea',
};

console.log('🔍 Fetching Complete Webflow CMS Structure...\n');
console.log('='
.repeat(100));

async function fetchCollectionSchema(name, collectionId) {
  try {
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${collectionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Failed to fetch ${name} (${response.status})`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching ${name}:`, error.message);
    return null;
  }
}

async function documentAllSchemas() {
  const allSchemas = {};
  const relationships = [];

  // Fetch all schemas
  for (const [name, id] of Object.entries(collections)) {
    console.log(`\n📋 Fetching ${name}...`);
    const schema = await fetchCollectionSchema(name, id);
    if (schema) {
      allSchemas[name] = schema;
      console.log(`✅ ${name}: ${schema.fields.length} fields`);
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('📊 COMPLETE WEBFLOW CMS STRUCTURE DOCUMENTATION');
  console.log('='.repeat(100));

  // Document each collection in detail
  for (const [name, schema] of Object.entries(allSchemas)) {
    console.log(`\n${'▀'.repeat(80)}`);
    console.log(`📦 ${name.toUpperCase()} COLLECTION`);
    console.log(`${'▀'.repeat(80)}`);
    console.log(`Collection ID: ${schema.id}`);
    console.log(`Display Name: ${schema.displayName}`);
    console.log(`Singular: ${schema.singularName}`);
    console.log(`Collection URL: /profile/[slug]` || 'N/A');
    console.log(`\n📝 FIELDS (${schema.fields.length} total):\n`);

    // Group fields by type
    const requiredFields = [];
    const referenceFields = [];
    const optionalFields = [];

    schema.fields.forEach(field => {
      const fieldInfo = {
        slug: field.slug,
        displayName: field.displayName,
        type: field.type,
        required: field.isRequired || false,
      };

      if (field.validations?.collectionId) {
        fieldInfo.referencesCollection = field.validations.collectionId;
        // Find collection name
        const refCollection = Object.entries(collections).find(([n, id]) => id === field.validations.collectionId);
        if (refCollection) {
          fieldInfo.referencesCollectionName = refCollection[0];
        }
        referenceFields.push(fieldInfo);

        // Track relationship
        relationships.push({
          from: name,
          to: refCollection ? refCollection[0] : field.validations.collectionId,
          field: field.slug
        });
      } else if (field.isRequired) {
        requiredFields.push(fieldInfo);
      } else {
        if (field.validations?.options) {
          fieldInfo.options = field.validations.options.map(o => o.name || o.id);
        }
        optionalFields.push(fieldInfo);
      }
    });

    // Print required fields
    if (requiredFields.length > 0) {
      console.log('  ⚠️  REQUIRED FIELDS:');
      requiredFields.forEach(f => {
        console.log(`     - ${f.slug} (${f.type}) → ${f.displayName}`);
      });
      console.log('');
    }

    // Print reference fields
    if (referenceFields.length > 0) {
      console.log('  🔗 REFERENCE FIELDS (Links to other collections):');
      referenceFields.forEach(f => {
        console.log(`     - ${f.slug} → References: ${f.referencesCollectionName || f.referencesCollection}`);
      });
      console.log('');
    }

    // Print optional fields
    if (optionalFields.length > 0) {
      console.log('  📄 OPTIONAL FIELDS:');
      optionalFields.forEach(f => {
        let line = `     - ${f.slug} (${f.type})`;
        if (f.options) {
          line += ` [Options: ${f.options.join(', ')}]`;
        }
        line += ` → ${f.displayName}`;
        console.log(line);
      });
    }
  }

  // Print relationships diagram
  console.log('\n' + '='.repeat(100));
  console.log('🔗 COLLECTION RELATIONSHIPS DIAGRAM');
  console.log('='.repeat(100));
  console.log('\nProfile is the MAIN collection that other collections reference:\n');

  const profileRefs = relationships.filter(r => r.to === 'Profiles');
  profileRefs.forEach(rel => {
    console.log(`   ${rel.from} --[${rel.field}]--> Profiles`);
  });

  console.log('\n' + '='.repeat(100));
  console.log('✅ Documentation Complete!');
  console.log('='.repeat(100));

  // Create a summary
  console.log('\n📌 SUMMARY:');
  console.log(`   Total Collections: ${Object.keys(allSchemas).length}`);
  console.log(`   Total Relationships: ${relationships.length}`);
  console.log(`   Collections referencing Profiles: ${profileRefs.length}`);

  console.log('\n💡 KEY INSIGHTS:');
  console.log('   - Profiles = Main business/company collection');
  console.log('   - Blogs, Videos, Services, Reviews, Locations all reference Profiles');
  console.log('   - This creates a hub-and-spoke model with Profile at the center');
}

documentAllSchemas();
