/**
 * Test připojení k Supabase a ověření tabulek
 */

require('dotenv').config();
const { supabase } = require('../config/supabase-config');

/**
 * Funkce pro testování připojení k Supabase
 */
async function testConnection() {
  try {
    console.log('Testování připojení k Supabase...');
    
    // Zobrazení informací o prostředí pro ladění
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Supabase Key:', process.env.SUPABASE_KEY ? '***' + process.env.SUPABASE_KEY.slice(-4) : 'není nastaven');
    
    // Test připojení - zkusíme získat aktuální čas z databáze
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT NOW() as current_time'
    });

    if (error) {
      console.error('Chyba při připojení k Supabase:', error.message);
      // Zkusíme alternativní způsob testování připojení
      const { data: healthData, error: healthError } = await supabase.from('products').select('count').limit(1);
      
      if (healthError) {
        if (healthError.code === '42P01') { // Tabulka neexistuje
          console.log('Připojení k Supabase je funkční, ale tabulka products neexistuje.');
          console.log('Je potřeba spustit migrační skript: npm run migrate:supabase');
        } else {
          console.error('Chyba při testování připojení:', healthError.message);
          process.exit(1);
        }
      } else {
        console.log('Připojení k Supabase je funkční!');
      }
    } else {
      console.log('Připojení k Supabase je funkční!');
      console.log('Aktuální čas na serveru:', data[0]?.current_time || 'Neznámý');
    }

    // Testování existence tabulek
    await testTables();
  } catch (error) {
    console.error('Neočekávaná chyba při testování připojení:', error.message);
    process.exit(1);
  }
}

/**
 * Funkce pro testování existence tabulek
 */
async function testTables() {
  try {
    console.log('\nTestování existence tabulek...');
    
    // Testování tabulky products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });

    if (productsError) {
      if (productsError.code === '42P01') { // Tabulka neexistuje
        console.log('❌ Tabulka products neexistuje.');
      } else {
        console.error('Chyba při testování tabulky products:', productsError.message);
      }
    } else {
      console.log('✅ Tabulka products existuje. Počet záznamů:', productsData.count || 0);
    }

    // Testování tabulky categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true });

    if (categoriesError) {
      if (categoriesError.code === '42P01') { // Tabulka neexistuje
        console.log('❌ Tabulka categories neexistuje.');
      } else {
        console.error('Chyba při testování tabulky categories:', categoriesError.message);
      }
    } else {
      console.log('✅ Tabulka categories existuje. Počet záznamů:', categoriesData.count || 0);
    }

    // Testování tabulky orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('count', { count: 'exact', head: true });

    if (ordersError) {
      if (ordersError.code === '42P01') { // Tabulka neexistuje
        console.log('❌ Tabulka orders neexistuje.');
      } else {
        console.error('Chyba při testování tabulky orders:', ordersError.message);
      }
    } else {
      console.log('✅ Tabulka orders existuje. Počet záznamů:', ordersData.count || 0);
    }

    // Testování tabulky order_items
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('count', { count: 'exact', head: true });

    if (orderItemsError) {
      if (orderItemsError.code === '42P01') { // Tabulka neexistuje
        console.log('❌ Tabulka order_items neexistuje.');
      } else {
        console.error('Chyba při testování tabulky order_items:', orderItemsError.message);
      }
    } else {
      console.log('✅ Tabulka order_items existuje. Počet záznamů:', orderItemsData.count || 0);
    }

    console.log('\nTestování dokončeno.');
  } catch (error) {
    console.error('Neočekávaná chyba při testování tabulek:', error.message);
  }
}

// Spuštění testu
testConnection();