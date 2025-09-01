// Smart variant detection from existing product data without changing SKUs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyzeVariantPatterns() {
  console.log('🧠 ANALYZING VARIANT PATTERNS FROM EXISTING DATA...\n');

  try {
    // Fetch all products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('sku');

    if (error) throw error;

    console.log(`Found ${products.length} products to analyze\n`);

    // Strategy 1: Group by similar product names
    const nameGroups = new Map();
    const skuPatterns = new Map();
    
    products.forEach(product => {
      if (!product.name || !product.sku) return;

      // Normalize product name (remove color words and common suffixes)
      let baseName = product.name
        .replace(/\b(černá|bílá|modrá|červená|zelená|šedá|hnědá|růžová|béžová)\b/gi, '') // Czech colors
        .replace(/\b(black|white|blue|red|green|grey|gray|brown|pink|beige|rose|azure)\b/gi, '') // English colors
        .replace(/\b(nero|bianco|blu|rosso|verde|grigio|marrone|rosa|beige|azzurro)\b/gi, '') // Italian colors
        .replace(/\s+/g, ' ') // Clean up spaces
        .trim();

      // Extract potential base SKU pattern
      const skuBase = product.sku.replace(/-[A-Z0-9]{1,6}$/i, ''); // Remove suffix like -R, -BLU, -AZBE2

      const key = `${baseName}|${skuBase}`;
      
      if (!nameGroups.has(key)) {
        nameGroups.set(key, []);
      }
      nameGroups.get(key).push(product);
    });

    // Find groups with multiple products (potential variants)
    const variantGroups = [];
    for (const [key, group] of nameGroups) {
      if (group.length > 1) {
        variantGroups.push({
          baseKey: key,
          products: group,
          count: group.length
        });
      }
    }

    console.log(`📊 ANALYSIS RESULTS:`);
    console.log(`   Total unique products: ${products.length}`);
    console.log(`   Potential variant groups: ${variantGroups.length}`);
    console.log(`   Products with variants: ${variantGroups.reduce((sum, g) => sum + g.count, 0)}\n`);

    // Show top variant groups
    console.log('🔍 TOP VARIANT GROUPS:');
    variantGroups
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((group, index) => {
        const [baseName, baseSkuPattern] = group.baseKey.split('|');
        console.log(`   ${index + 1}. "${baseName}" (${group.count} variants)`);
        console.log(`      Base SKU: ${baseSkuPattern}`);
        
        group.products.forEach(p => {
          const colorSuffix = p.sku.replace(baseSkuPattern, '').replace(/^-/, '') || 'DEFAULT';
          console.log(`        - ${p.sku} (${colorSuffix})`);
        });
        console.log('');
      });

    // Strategy 2: Create virtual variant system without DB changes
    console.log('💡 SMART VARIANT STRATEGY:');
    console.log('   ✅ Keep all existing SKUs unchanged');
    console.log('   ✅ Detect variants dynamically in API calls');
    console.log('   ✅ Group products by name similarity + SKU patterns');
    console.log('   ✅ Extract color from SKU suffix (after last hyphen)');
    console.log('   ✅ Show variants in product detail page UI');
    console.log('   ✅ No database migration needed!');

    return variantGroups;

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

async function main() {
  try {
    require('@supabase/supabase-js');
  } catch (e) {
    console.log('📦 Installing @supabase/supabase-js...');
    const { execSync } = require('child_process');
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
  }
  
  await analyzeVariantPatterns();
}

main();