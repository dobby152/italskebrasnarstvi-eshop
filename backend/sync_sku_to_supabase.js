const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Supabase konfigurace
const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(supabaseUrl, supabaseKey);

// Připojení k SQLite databázi
const db = new sqlite3.Database('./database.sqlite');

async function syncSKUToSupabase() {
  console.log('Začínám synchronizaci SKU hodnot do Supabase...');
  
  try {
    // Načtení SKU dat z lokální databáze
    const skuData = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name_cz, sku 
        FROM products 
        WHERE sku IS NOT NULL AND sku != ''
        ORDER BY id
      `, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    console.log(`Nalezeno ${skuData.length} produktů s SKU v lokální databázi`);
    
    // Načtení existujících produktů z Supabase
    const { data: supabaseProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, name, sku')
      .order('id');
    
    if (fetchError) {
      throw new Error(`Chyba při načítání z Supabase: ${fetchError.message}`);
    }
    
    console.log(`Nalezeno ${supabaseProducts.length} produktů v Supabase`);
    
    // Mapování produktů podle názvu (protože ID se mohou lišit)
    const supabaseProductMap = new Map();
    supabaseProducts.forEach(product => {
      supabaseProductMap.set(product.name, product);
    });
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Aktualizace SKU pro každý produkt
    for (const localProduct of skuData) {
      const supabaseProduct = supabaseProductMap.get(localProduct.name_cz);
      
      if (supabaseProduct) {
        // Aktualizace SKU pouze pokud ještě není nastaveno
        if (!supabaseProduct.sku) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ sku: localProduct.sku })
            .eq('id', supabaseProduct.id);
          
          if (updateError) {
            console.error(`Chyba při aktualizaci produktu ${supabaseProduct.id}:`, updateError.message);
          } else {
            updatedCount++;
            console.log(`✓ Aktualizován produkt "${localProduct.name_cz}" s SKU: ${localProduct.sku}`);
          }
        } else {
          console.log(`- Produkt "${localProduct.name_cz}" již má SKU: ${supabaseProduct.sku}`);
        }
      } else {
        notFoundCount++;
        console.log(`⚠ Produkt "${localProduct.name_cz}" nebyl nalezen v Supabase`);
      }
    }
    
    console.log(`\n=== SHRNUTÍ ===`);
    console.log(`Aktualizováno produktů: ${updatedCount}`);
    console.log(`Nenalezeno v Supabase: ${notFoundCount}`);
    console.log(`Celkem zpracováno: ${skuData.length}`);
    
  } catch (error) {
    console.error('Chyba při synchronizaci:', error.message);
  } finally {
    db.close();
  }
}

// Spuštění synchronizace
syncSKUToSupabase();