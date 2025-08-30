/**
 * Test připojení k PostgreSQL databázi
 */

require('dotenv').config({ path: '../.env' });
const { pgPool } = require('../config/supabase');

async function testConnection() {
  console.log('Testuji připojení k PostgreSQL databázi...');
  
  try {
    // Získání připojení z poolu
    const client = await pgPool.connect();
    
    try {
      // Test dotazu
      const result = await client.query('SELECT NOW() as time');
      console.log('✅ Připojení k PostgreSQL úspěšné!');
      console.log(`Aktuální čas na serveru: ${result.rows[0].time}`);
      
      // Test existence tabulek
      const tables = ['products', 'categories', 'orders'];
      for (const table of tables) {
        const tableResult = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [table]
        );
        
        const exists = tableResult.rows[0].exists;
        console.log(`Tabulka ${table}: ${exists ? '✅ Existuje' : '❌ Neexistuje'}`);
        
        if (exists) {
          // Získání počtu záznamů
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
          console.log(`  - Počet záznamů: ${countResult.rows[0].count}`);
        }
      }
      
    } finally {
      // Vrácení připojení do poolu
      client.release();
    }
    
    // Ukončení poolu
    await pgPool.end();
    console.log('Připojení k databázi ukončeno.');
    
  } catch (err) {
    console.error('❌ Chyba při připojení k PostgreSQL:', err.message);
    console.error('Zkontrolujte nastavení v souboru .env');
    
    // Výpis aktuálního nastavení (bez hesla)
    console.log('\nAktuální nastavení:');
    console.log(`PG_HOST: ${process.env.PG_HOST}`);
    console.log(`PG_PORT: ${process.env.PG_PORT}`);
    console.log(`PG_DATABASE: ${process.env.PG_DATABASE}`);
    console.log(`PG_USER: ${process.env.PG_USER}`);
    console.log(`PG_PASSWORD: ${'*'.repeat(process.env.PG_PASSWORD?.length || 0)}`);
    
    process.exit(1);
  }
}

testConnection();