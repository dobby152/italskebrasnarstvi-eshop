// Demo script to update some products with different stock levels for testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(supabaseUrl, supabaseKey);

const updateStockDemo = async () => {
  console.log('🎮 Creating demo stock data...');
  
  // Define demo stock levels for different scenarios
  const demoData = [
    // High stock - should show as "Skladem"
    { sku: 'OM5285OM5-BLU', stock: 25 },
    { sku: 'OM5285OM5-N', stock: 18 },
    
    // Low stock - should show as "Málo skladem" 
    { sku: 'OM5285OM5-R', stock: 2 },
    
    // Out of stock - should show as "Není skladem"
    { sku: 'OM5285OM5-VE', stock: 0 },
    
    // Limited stock - should show as "Omezená dostupnost"
    { sku: 'OM5288OM6-N', stock: 8 },
    { sku: 'OM5288OM6-BLU', stock: 6 },
    
    // Another out of stock for variety
    { sku: 'OM5288OM6-R', stock: 0 },
  ];
  
  console.log('\n📦 Updating stock levels:');
  
  for (const item of demoData) {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock: item.stock,
          availability: item.stock > 0 ? 'in_stock' : 'out_of_stock'
        })
        .eq('sku', item.sku);
      
      if (error) {
        console.log(`   ❌ ${item.sku}: ${error.message}`);
      } else {
        const status = item.stock === 0 ? 'Není skladem' :
                      item.stock <= 3 ? 'Málo skladem' :
                      item.stock <= 10 ? 'Omezená dostupnost' : 'Skladem';
        console.log(`   ✅ ${item.sku}: ${item.stock}ks (${status})`);
      }
    } catch (error) {
      console.log(`   ❌ ${item.sku}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Demo data created! Test the system now:');
  console.log('   • Product grid: Colors should show availability indicators');
  console.log('   • Product page: Smart variant selector should show real stock');
  console.log('   • Stock display: Should show branch breakdown');
  console.log('\n🔗 Test URLs:');
  console.log('   • http://localhost:3000/produkty (product grid)');
  console.log('   • http://localhost:3000/produkt/OM5285OM5-BLU (high stock)');
  console.log('   • http://localhost:3000/produkt/OM5285OM5-R (low stock)');
  console.log('   • http://localhost:3000/produkt/OM5285OM5-VE (out of stock)');
};

updateStockDemo().catch(console.error);