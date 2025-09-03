const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMDA2NjYsImV4cCI6MjA0ODg3NjY2Nn0.h9RlN8bUrEqMOgDXs3_lkVc3QGw2Y67J1ZJLiGOgmiU';

const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function extractCollection(tags) {
  if (!tags) return null;
  
  // Look for PfsCollection tag
  const collectionMatch = tags.match(/PfsCollection:([^,]+)/);
  if (collectionMatch) {
    return collectionMatch[1].trim();
  }
  
  // Look for collection descriptions
  const descMatch = tags.match(/a_pfscollection_description:([^,]+)/);
  if (descMatch) {
    const desc = descMatch[1].trim();
    // Extract first collection name
    const collections = desc.split(',')[0].trim();
    return collections;
  }
  
  return null;
}

function extractBrand(vendor, tags) {
  if (vendor && vendor !== '') {
    return vendor;
  }
  
  // Look for brand in tags
  const brandMatch = tags?.match(/PfsBrand:([^,]+)/);
  if (brandMatch) {
    return brandMatch[1].trim();
  }
  
  return 'Piquadro';
}

async function importProducts() {
  try {
    const csvPath = 'C:\\Users\\hynex\\Downloads\\all_products_www.piquadro.com (2).csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    if (lines.length <= 1) {
      console.log('No data to import');
      return;
    }
    
    // Parse header
    const header = parseCSVLine(lines[0]);
    console.log('CSV Header:', header);
    
    const products = new Map(); // Group by SKU
    let processedLines = 0;
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const data = parseCSVLine(line);
      if (data.length < header.length) continue;
      
      const row = {};
      header.forEach((col, index) => {
        row[col] = data[index] || '';
      });
      
      const sku = row['Variant SKU'];
      const handle = row['Handle'];
      const title = row['Title'];
      const price = row['Variant Price'];
      const imageSrc = row['Image Src'];
      
      // Skip rows without essential data
      if (!sku || (!title && !imageSrc)) continue;
      
      if (!products.has(sku)) {
        products.set(sku, {
          sku: sku,
          name: title || handle,
          price: price ? parseFloat(price) : 0,
          description: row['Body (HTML)'] || '',
          images: [],
          brand: extractBrand(row['Vendor'], row['Tags']),
          collection: extractCollection(row['Tags']),
          tags: row['Tags'] || '',
          handle: handle,
          status: row['Status'] || 'active'
        });
      }
      
      // Add image if present
      if (imageSrc && imageSrc.startsWith('http')) {
        const product = products.get(sku);
        if (!product.images.includes(imageSrc)) {
          product.images.push(imageSrc);
        }
      }
      
      processedLines++;
      if (processedLines % 100 === 0) {
        console.log(`Processed ${processedLines} lines...`);
      }
    }
    
    console.log(`Found ${products.size} unique products`);
    
    // Insert into database
    const productsArray = Array.from(products.values());
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (const product of productsArray) {
      try {
        // Check if product already exists
        const { data: existing, error: checkError } = await supabase
          .from('products')
          .select('id, sku')
          .eq('sku', product.sku)
          .single();
        
        const productData = {
          sku: product.sku,
          name: product.name,
          price: product.price,
          description: product.description,
          images: product.images,
          image_url: product.images[0] || null,
          normalized_brand: product.brand,
          normalized_collection: product.collection,
          stock: 10, // Default stock
          status: product.status === 'active' ? 'active' : 'inactive'
        };
        
        if (existing && !checkError) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existing.id);
          
          if (updateError) {
            console.error(`Error updating product ${product.sku}:`, updateError.message);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Insert new product
          const { error: insertError } = await supabase
            .from('products')
            .insert(productData);
          
          if (insertError) {
            console.error(`Error inserting product ${product.sku}:`, insertError.message);
            errors++;
          } else {
            inserted++;
          }
        }
        
        if ((inserted + updated) % 10 === 0) {
          console.log(`Progress: ${inserted} inserted, ${updated} updated, ${errors} errors`);
        }
        
      } catch (error) {
        console.error(`Error processing product ${product.sku}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Total products processed: ${productsArray.length}`);
    console.log(`New products inserted: ${inserted}`);
    console.log(`Existing products updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    
    // Show some example products
    console.log('\n=== Sample Products ===');
    productsArray.slice(0, 5).forEach(product => {
      console.log(`SKU: ${product.sku}`);
      console.log(`Name: ${product.name}`);
      console.log(`Price: ${product.price} EUR`);
      console.log(`Brand: ${product.brand}`);
      console.log(`Collection: ${product.collection}`);
      console.log(`Images: ${product.images.length}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importProducts();