// Use built-in fetch for Node 18+

const SUPABASE_PROJECT_REF = 'dbnfkzctensbpktgbsgn';
const SUPABASE_ACCESS_TOKEN = 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076';
const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

async function analyzeDatabase() {
  console.log('🔍 ANALYZING SUPABASE DATABASE STRUCTURE...\n');

  try {
    // Get tables using REST API
    console.log('=== GETTING PRODUCTS TABLE STRUCTURE ===');
    
    const productsResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?limit=3`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      console.error('Products API error:', productsResponse.status, productsResponse.statusText);
    } else {
      const productsData = await productsResponse.json();
      console.log('Products sample (3 records):');
      console.log(JSON.stringify(productsData, null, 2));
      
      if (productsData.length > 0) {
        console.log('\n--- PRODUCT FIELDS ANALYSIS ---');
        const firstProduct = productsData[0];
        Object.keys(firstProduct).forEach(key => {
          const value = firstProduct[key];
          const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
          console.log(`${key}: ${type} - ${JSON.stringify(value)}`);
        });
      }
    }

    console.log('\n=== GETTING COLLECTIONS TABLE ===');
    const collectionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/collections?limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!collectionsResponse.ok) {
      console.error('Collections API error:', collectionsResponse.status);
    } else {
      const collectionsData = await collectionsResponse.json();
      console.log('Collections count:', collectionsData.length);
      console.log('Collections sample:', JSON.stringify(collectionsData, null, 2));
    }

    console.log('\n=== GETTING BRANDS TABLE ===');
    const brandsResponse = await fetch(`${SUPABASE_URL}/rest/v1/brands?limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!brandsResponse.ok) {
      console.error('Brands API error:', brandsResponse.status);
    } else {
      const brandsData = await brandsResponse.json();
      console.log('Brands count:', brandsData.length);
      console.log('Brands sample:', JSON.stringify(brandsData, null, 2));
    }

  } catch (error) {
    console.error('Analysis error:', error);
  }
}

analyzeDatabase().then(() => {
  console.log('\n✅ Database analysis complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});