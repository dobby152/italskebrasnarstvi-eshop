// Simple duplicate analysis without external dependencies
const https = require('https');

// Supabase configuration
const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

/**
 * Make HTTP request to Supabase REST API
 */
async function makeSupabaseRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/rest/v1/${endpoint}`;
    const options = {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(jsonData)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Analyzes the Supabase database for duplicate products
 * Looks for:
 * 1. Products with same SKU but different IDs
 * 2. Products with similar names that might be duplicates
 * 3. Data inconsistencies in the products table
 */
async function analyzeDuplicateProducts() {
  console.log('🔍 ANALYZING SUPABASE DATABASE FOR DUPLICATE PRODUCTS');
  console.log('=' .repeat(60));
  
  const duplicateReport = {
    duplicateSKUs: [],
    similarNames: [],
    dataInconsistencies: [],
    stats: {}
  };

  try {
    // First, let's get all products to understand the data structure
    console.log('\n📊 Getting all products from database...');
    const allProducts = await makeSupabaseRequest('products?order=id');

    if (!allProducts) {
      console.error('❌ Error fetching products');
      return;
    }

    if (!allProducts || allProducts.length === 0) {
      console.log('⚠️  No products found in database');
      return;
    }

    console.log(`✅ Found ${allProducts.length} products in database`);
    duplicateReport.stats.totalProducts = allProducts.length;

    // Show sample product structure
    console.log('\n📋 Sample product structure:');
    if (allProducts.length > 0) {
      const sampleProduct = allProducts[0];
      Object.keys(sampleProduct).forEach(key => {
        const value = sampleProduct[key];
        const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
        console.log(`  ${key}: ${type} - ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}`);
      });
    }

    // 1. ANALYZE DUPLICATE SKUs
    console.log('\n🔍 ANALYZING DUPLICATE SKUs...');
    console.log('-'.repeat(40));
    
    const skuGroups = {};
    let productsWithSKU = 0;
    let productsWithoutSKU = 0;

    allProducts.forEach(product => {
      if (product.sku && product.sku.trim() !== '') {
        productsWithSKU++;
        const sku = product.sku.trim().toLowerCase();
        if (!skuGroups[sku]) {
          skuGroups[sku] = [];
        }
        skuGroups[sku].push(product);
      } else {
        productsWithoutSKU++;
      }
    });

    console.log(`📈 Products with SKU: ${productsWithSKU}`);
    console.log(`📈 Products without SKU: ${productsWithoutSKU}`);

    // Find duplicate SKUs
    for (const [sku, products] of Object.entries(skuGroups)) {
      if (products.length > 1) {
        duplicateReport.duplicateSKUs.push({
          sku: sku,
          count: products.length,
          products: products.map(p => ({ 
            id: p.id, 
            name: p.name, 
            price: p.price,
            stock: p.stock,
            created_at: p.created_at,
            collection: p.collection || p.normalized_collection,
            brand: p.brand || p.normalized_brand
          }))
        });
      }
    }

    if (duplicateReport.duplicateSKUs.length > 0) {
      console.log(`⚠️  Found ${duplicateReport.duplicateSKUs.length} duplicate SKU groups:`);
      duplicateReport.duplicateSKUs.forEach(group => {
        console.log(`\n  🔴 SKU: "${group.sku}" (${group.count} products):`);
        group.products.forEach(p => {
          console.log(`     ID ${p.id}: "${p.name}" - $${p.price} (Stock: ${p.stock})`);
        });
      });
    } else {
      console.log('✅ No duplicate SKUs found');
    }

    // 2. ANALYZE SIMILAR PRODUCT NAMES
    console.log('\n🔍 ANALYZING SIMILAR PRODUCT NAMES...');
    console.log('-'.repeat(40));

    const nameGroups = {};
    
    allProducts.forEach(product => {
      if (product.name && product.name.trim() !== '') {
        // Normalize name for comparison (remove extra spaces, convert to lowercase)
        const normalizedName = product.name.trim().toLowerCase().replace(/\s+/g, ' ');
        
        // Look for exact matches first
        if (!nameGroups[normalizedName]) {
          nameGroups[normalizedName] = [];
        }
        nameGroups[normalizedName].push(product);
      }
    });

    // Find exact name duplicates
    for (const [name, products] of Object.entries(nameGroups)) {
      if (products.length > 1) {
        duplicateReport.similarNames.push({
          normalizedName: name,
          type: 'exact_match',
          count: products.length,
          products: products.map(p => ({ 
            id: p.id, 
            name: p.name, 
            sku: p.sku,
            price: p.price,
            collection: p.collection || p.normalized_collection,
            brand: p.brand || p.normalized_brand
          }))
        });
      }
    }

    // Look for very similar names (fuzzy matching)
    const productNames = allProducts.map(p => ({ 
      id: p.id, 
      name: p.name, 
      sku: p.sku,
      price: p.price,
      collection: p.collection || p.normalized_collection,
      brand: p.brand || p.normalized_brand
    })).filter(p => p.name && p.name.trim() !== '');

    for (let i = 0; i < productNames.length; i++) {
      for (let j = i + 1; j < productNames.length; j++) {
        const product1 = productNames[i];
        const product2 = productNames[j];
        
        // Simple similarity check - if names are very similar but not exact
        const name1 = product1.name.toLowerCase().trim();
        const name2 = product2.name.toLowerCase().trim();
        
        if (name1 !== name2) {
          // Check if one name contains the other (potential variants)
          const similarity = calculateSimilarity(name1, name2);
          
          if (similarity > 0.8) { // 80% similarity threshold
            // Check if this pair is already recorded
            const alreadyRecorded = duplicateReport.similarNames.some(group => 
              group.products.some(p => p.id === product1.id || p.id === product2.id)
            );
            
            if (!alreadyRecorded) {
              duplicateReport.similarNames.push({
                type: 'similar_names',
                similarity: similarity,
                count: 2,
                products: [product1, product2]
              });
            }
          }
        }
      }
    }

    if (duplicateReport.similarNames.length > 0) {
      console.log(`⚠️  Found ${duplicateReport.similarNames.length} groups of similar/duplicate names:`);
      duplicateReport.similarNames.forEach((group, index) => {
        console.log(`\n  🟡 Group ${index + 1} (${group.type}):`);
        if (group.similarity) {
          console.log(`     Similarity: ${(group.similarity * 100).toFixed(1)}%`);
        }
        group.products.forEach(p => {
          console.log(`     ID ${p.id}: "${p.name}" ${p.sku ? `(${p.sku})` : '(no SKU)'} - $${p.price}`);
        });
      });
    } else {
      console.log('✅ No similar product names found');
    }

    // 3. DATA INCONSISTENCY ANALYSIS
    console.log('\n🔍 ANALYZING DATA INCONSISTENCIES...');
    console.log('-'.repeat(40));

    // Check for missing essential fields
    let missingNames = 0;
    let missingPrices = 0;
    let invalidPrices = 0;
    let negativeStock = 0;
    let missingDescriptions = 0;
    let missingImages = 0;

    allProducts.forEach(product => {
      if (!product.name || product.name.trim() === '') {
        missingNames++;
        duplicateReport.dataInconsistencies.push({
          type: 'missing_name',
          productId: product.id,
          issue: 'Product has no name'
        });
      }
      
      if (!product.price || product.price <= 0) {
        if (!product.price) missingPrices++;
        else invalidPrices++;
        duplicateReport.dataInconsistencies.push({
          type: 'invalid_price',
          productId: product.id,
          issue: `Product price is ${product.price}`,
          value: product.price
        });
      }
      
      if (product.stock < 0) {
        negativeStock++;
        duplicateReport.dataInconsistencies.push({
          type: 'negative_stock',
          productId: product.id,
          issue: 'Product has negative stock',
          value: product.stock
        });
      }
      
      if (!product.description || product.description.trim() === '') {
        missingDescriptions++;
      }
      
      // Check for missing images
      const hasImages = (product.images && Array.isArray(product.images) && product.images.length > 0) ||
                       (product.image_url && product.image_url.trim() !== '');
      
      if (!hasImages) {
        missingImages++;
        duplicateReport.dataInconsistencies.push({
          type: 'missing_images',
          productId: product.id,
          issue: 'Product has no images'
        });
      }
    });

    console.log('📊 Data Quality Statistics:');
    console.log(`  Missing names: ${missingNames}`);
    console.log(`  Missing/invalid prices: ${missingPrices + invalidPrices}`);
    console.log(`  Negative stock: ${negativeStock}`);
    console.log(`  Missing descriptions: ${missingDescriptions}`);
    console.log(`  Missing images: ${missingImages}`);

    // Update stats
    duplicateReport.stats.productsWithSKU = productsWithSKU;
    duplicateReport.stats.productsWithoutSKU = productsWithoutSKU;
    duplicateReport.stats.duplicateSKUGroups = duplicateReport.duplicateSKUs.length;
    duplicateReport.stats.similarNameGroups = duplicateReport.similarNames.length;
    duplicateReport.stats.dataInconsistencies = duplicateReport.dataInconsistencies.length;

    // SUMMARY REPORT
    console.log('\n📋 DUPLICATE ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total products analyzed: ${duplicateReport.stats.totalProducts}`);
    console.log(`Products with SKU: ${duplicateReport.stats.productsWithSKU}`);
    console.log(`Products without SKU: ${duplicateReport.stats.productsWithoutSKU}`);
    console.log(`Duplicate SKU groups: ${duplicateReport.stats.duplicateSKUGroups}`);
    console.log(`Similar name groups: ${duplicateReport.stats.similarNameGroups}`);
    console.log(`Data inconsistencies: ${duplicateReport.stats.dataInconsistencies}`);

    if (duplicateReport.stats.duplicateSKUGroups > 0 || duplicateReport.stats.similarNameGroups > 0) {
      console.log('\n⚠️  ACTION REQUIRED: Duplicates found that need attention');
    } else {
      console.log('\n✅ No critical duplicates found');
    }

    // Save detailed report to file
    const fs = require('fs');
    const reportPath = './duplicate-products-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(duplicateReport, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    return duplicateReport;

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  }
}

/**
 * Calculate similarity between two strings using simple algorithm
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Run the analysis
if (require.main === module) {
  analyzeDuplicateProducts()
    .then(() => {
      console.log('\n🎉 Analysis completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeDuplicateProducts };