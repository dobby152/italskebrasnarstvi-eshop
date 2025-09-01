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
      
      // Extract base SKU (everything before last hyphen and color/variant suffix)
      let baseSku = product.sku;
      
      // Common patterns: 
      // - "CA1234-BLK" -> "CA1234"
      // - "CA1234-BLU-L" -> "CA1234" 
      // - "BD5678W92-AZBE2" -> "BD5678W92"
      
      // Remove color codes and size indicators
      baseSku = baseSku.replace(/-[A-Z]{2,5}2?$/, ''); // Remove color codes like -AZBE2, -BLK, -BLU
      baseSku = baseSku.replace(/-[SMLXL]+$/, ''); // Remove sizes like -L, -XL, -SM
      baseSku = baseSku.replace(/-\d+$/, ''); // Remove numeric suffixes
      
      if (!baseGroups.has(baseSku)) {
        baseGroups.set(baseSku, []);
      }
      baseGroups.get(baseSku).push(product);
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
            // Extract color info from SKU
            let colorName = 'Default';
            let colorCode = null;
            let hexColor = '#CCCCCC';
            
            const skuSuffix = product.sku.replace(baseSku, '').replace(/^-/, '');
            if (skuSuffix) {
              // Common color mappings
              const colorMap = {
                'BLK': { name: 'Black', hex: '#000000' },
                'WHT': { name: 'White', hex: '#FFFFFF' },
                'BLU': { name: 'Blue', hex: '#0066CC' },
                'RED': { name: 'Red', hex: '#CC0000' },
                'GRN': { name: 'Green', hex: '#00AA00' },
                'GR': { name: 'Grey', hex: '#808080' },
                'AZBE2': { name: 'Azure Blue', hex: '#4B9CD3' },
                'BR': { name: 'Brown', hex: '#8B4513' },
                'G': { name: 'Green', hex: '#00AA00' }
              };
              
              colorCode = skuSuffix;
              const colorInfo = colorMap[skuSuffix] || colorMap[skuSuffix.split('-')[0]];
              if (colorInfo) {
                colorName = colorInfo.name;
                hexColor = colorInfo.hex;
              } else {
                colorName = skuSuffix.charAt(0).toUpperCase() + skuSuffix.slice(1).toLowerCase();
              }
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