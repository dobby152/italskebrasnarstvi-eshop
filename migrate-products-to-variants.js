// Script to migrate existing products to variant system
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateProductsToVariants() {
  console.log('🚀 MIGRATING PRODUCTS TO VARIANTS SYSTEM...\n');

  try {
    // 1. Fetch all products
    console.log('📦 Fetching all products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('id');

    if (productsError) throw productsError;

    console.log(`Found ${products.length} products to process\n`);

    // 2. Group products by similar SKUs (base SKU logic)
    const baseGroups = new Map();
    
    products.forEach(product => {
      if (!product.sku) return;
      
      // Extract base SKU - everything before the last hyphen (which is the color variant)
      // Examples:
      // - "CA1234-R" -> base: "CA1234", variant: "R" (Rose)
      // - "BD5678W92-BLU" -> base: "BD5678W92", variant: "BLU" (Blue)
      // - "AC5290BM-GR" -> base: "AC5290BM", variant: "GR" (Grey)
      
      const lastHyphenIndex = product.sku.lastIndexOf('-');
      let baseSku, variantCode;
      
      if (lastHyphenIndex > 0) {
        baseSku = product.sku.substring(0, lastHyphenIndex);
        variantCode = product.sku.substring(lastHyphenIndex + 1);
      } else {
        // No hyphen found, treat whole SKU as base
        baseSku = product.sku;
        variantCode = 'DEFAULT';
      }
      
      if (!baseGroups.has(baseSku)) {
        baseGroups.set(baseSku, []);
      }
      baseGroups.get(baseSku).push({...product, variantCode});
    });

    console.log(`Created ${baseGroups.size} base product groups\n`);

    let createdBaseProducts = 0;
    let createdVariants = 0;
    let createdImages = 0;

    // 3. Create base products and variants
    for (const [baseSku, groupProducts] of baseGroups) {
      try {
        console.log(`📋 Processing base SKU: ${baseSku} (${groupProducts.length} variants)`);
        
        // Use first product as template for base product
        const templateProduct = groupProducts[0];
        
        // Create base product
        const { data: baseProduct, error: baseError } = await supabase
          .from('base_products')
          .insert({
            base_sku: baseSku,
            name: templateProduct.name,
            description: templateProduct.description || null,
            brand: templateProduct.normalized_brand || templateProduct.brand || null,
            collection: templateProduct.normalized_collection || templateProduct.collection || null,
            category: templateProduct.category || null,
            tags: templateProduct.tags || [],
            base_price: templateProduct.price
          })
          .select()
          .single();

        if (baseError) {
          console.log(`   ⚠️  Base product exists or error: ${baseError.message}`);
          // Try to get existing base product
          const { data: existing } = await supabase
            .from('base_products')
            .select('*')
            .eq('base_sku', baseSku)
            .single();
          
          if (!existing) {
            console.log(`   ❌ Could not create or find base product for ${baseSku}`);
            continue;
          }
          baseProduct = existing;
        } else {
          createdBaseProducts++;
          console.log(`   ✅ Created base product: ${baseProduct.name}`);
        }

        // Create variants for each product in group
        for (const product of groupProducts) {
          try {
            // Extract color info from variant code (end of SKU)
            let colorName = 'Default';
            let colorCode = product.variantCode || 'DEFAULT';
            let hexColor = '#CCCCCC';
            
            // Enhanced color mappings for Italian leather goods
            const colorMap = {
              // Basic colors
              'BLK': { name: 'Černá', hex: '#000000' },
              'WHT': { name: 'Bílá', hex: '#FFFFFF' },
              'BLU': { name: 'Modrá', hex: '#1E40AF' },
              'RED': { name: 'Červená', hex: '#DC2626' },
              'GRN': { name: 'Zelená', hex: '#16A34A' },
              'GR': { name: 'Šedá', hex: '#6B7280' },
              'BR': { name: 'Hnědá', hex: '#92400E' },
              
              // Specific Italian leather colors
              'R': { name: 'Růžová', hex: '#EC4899' },
              'ROSE': { name: 'Růžová', hex: '#EC4899' },
              'G': { name: 'Zelená', hex: '#16A34A' },
              'AZBE2': { name: 'Azurová modrá', hex: '#3B82F6' },
              'BI': { name: 'Bílá', hex: '#F8FAFC' },
              'N': { name: 'Černá', hex: '#111827' },
              'NERO': { name: 'Černá', hex: '#111827' },
              'MARRONE': { name: 'Hnědá', hex: '#92400E' },
              'BEI': { name: 'Béžová', hex: '#D4B896' },
              'BEIGE': { name: 'Béžová', hex: '#D4B896' },
              'CUOIO': { name: 'Kožená', hex: '#CD853F' },
              'COGNAC': { name: 'Koňak', hex: '#8B4513' },
              'TAN': { name: 'Tan', hex: '#D2691E' },
              'CAMEL': { name: 'Velbloudí', hex: '#C19A6B' },
              'DEFAULT': { name: 'Výchozí', hex: '#6B7280' }
            };
            
            const colorInfo = colorMap[colorCode.toUpperCase()];
            if (colorInfo) {
              colorName = colorInfo.name;
              hexColor = colorInfo.hex;
            } else {
              // Fallback: capitalize first letter
              colorName = colorCode.charAt(0).toUpperCase() + colorCode.slice(1).toLowerCase();
            }

            // Create variant
            const { data: variant, error: variantError } = await supabase
              .from('product_variants')
              .insert({
                base_product_id: baseProduct.id,
                product_id: product.id,
                sku: product.sku,
                name: product.name,
                color_name: colorName,
                color_code: colorCode,
                hex_color: hexColor,
                price: product.price,
                original_price: product.original_price || null,
                inventory_quantity: product.stock || 10,
                status: 'active',
                availability: (product.stock && product.stock > 0) ? 'in_stock' : 'in_stock' // Default to in_stock
              })
              .select()
              .single();

            if (variantError) {
              console.log(`   ❌ Variant error for ${product.sku}: ${variantError.message}`);
              continue;
            }

            createdVariants++;
            console.log(`     ✅ Created variant: ${colorName} (${product.sku})`);

            // Create variant images if product has images
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
              const imageInserts = product.images.map((imageUrl, index) => ({
                variant_id: variant.id,
                image_url: imageUrl,
                position: index,
                is_primary: index === 0
              }));

              const { error: imageError } = await supabase
                .from('variant_images')
                .insert(imageInserts);

              if (!imageError) {
                createdImages += imageInserts.length;
                console.log(`     📸 Added ${imageInserts.length} images`);
              }
            }

          } catch (error) {
            console.log(`   ❌ Error creating variant for ${product.sku}:`, error.message);
          }
        }

        console.log(''); // Empty line for readability

      } catch (error) {
        console.log(`❌ Error processing base SKU ${baseSku}:`, error.message);
      }
    }

    console.log('🎉 MIGRATION COMPLETE!');
    console.log(`📊 SUMMARY:`);
    console.log(`   Base products created: ${createdBaseProducts}`);
    console.log(`   Variants created: ${createdVariants}`);
    console.log(`   Images created: ${createdImages}`);
    console.log(`   Total base groups: ${baseGroups.size}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Install supabase if needed then run
async function main() {
  try {
    require('@supabase/supabase-js');
  } catch (e) {
    console.log('📦 Installing @supabase/supabase-js...');
    const { execSync } = require('child_process');
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
  }
  
  await migrateProductsToVariants();
}

main();