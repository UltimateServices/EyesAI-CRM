const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFiles() {
  const bucketName = 'email-assets';

  // Create bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets.find(b => b.name === bucketName);

  if (!bucketExists) {
    console.log('Creating email-assets bucket...');
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    if (error) console.error('Bucket creation error:', error);
  }

  // Upload logo
  console.log('Uploading logo...');
  const logoFile = fs.readFileSync('/tmp/eyesai-logo.png');
  const { data: logoData, error: logoError } = await supabase.storage
    .from(bucketName)
    .upload('eyesai-logo.png', logoFile, {
      contentType: 'image/png',
      upsert: true
    });

  if (logoError) {
    console.error('Logo upload error:', logoError);
  } else {
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/eyesai-logo.png`;
    console.log('Logo URL:', logoUrl);
  }

  // Upload fonts
  const fonts = [
    'PPPangramSansRounded-Regular.woff2',
    'PPPangramSansRounded-Bold.woff2',
    'PPPangramSansRounded-Medium.woff2'
  ];

  for (const fontName of fonts) {
    console.log(`Uploading ${fontName}...`);
    const fontPath = `/Users/dylanhecht/Downloads/Normal Sub Family - Essentials 3/WOFF2/${fontName}`;
    const fontFile = fs.readFileSync(fontPath);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`fonts/${fontName}`, fontFile, {
        contentType: 'font/woff2',
        upsert: true
      });

    if (error) {
      console.error(`${fontName} upload error:`, error);
    } else {
      const fontUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/fonts/${fontName}`;
      console.log(`${fontName} URL:`, fontUrl);
    }
  }
}

uploadFiles().catch(console.error);
