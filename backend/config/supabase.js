require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Supabase klient pro práci s Supabase API
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// PostgreSQL pool pro přímé dotazy do databáze
const pgPool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

// Testovací připojení k databázi
pgPool.on('connect', (client) => {
  console.log('Připojeno k PostgreSQL databázi');
});

pgPool.on('error', (err) => {
  console.error('Chyba připojení k PostgreSQL:', err);
});

module.exports = {
  supabase,
  pgPool,
};