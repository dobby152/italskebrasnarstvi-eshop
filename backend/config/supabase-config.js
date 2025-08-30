/**
 * Supabase konfigurační soubor
 * Tento soubor obsahuje konfiguraci pro připojení k Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase URL a anonymní klíč
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

// Vytvoření Supabase klienta
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
});

module.exports = {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
};