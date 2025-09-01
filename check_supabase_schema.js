const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking Supabase database schema...');
    
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }
    
    console.log('\n📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check for product-related tables specifically
    const productTables = tables.filter(t => 
      t.table_name.includes('product') || 
      t.table_name.includes('collection') || 
      t.table_name.includes('brand') ||
      t.table_name.includes('tag') ||
      t.table_name.includes('image')
    );
    
    console.log('\n🛍️ Product-related tables:');
    productTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check columns for each product table
    for (const table of productTables) {
      console.log(`\n📊 Columns in ${table.table_name}:`);
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', table.table_name)
        .eq('table_schema', 'public');
      
      if (columnsError) {
        console.error(`Error fetching columns for ${table.table_name}:`, columnsError);
        continue;
      }
      
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Check foreign key relationships
    console.log('\n🔗 Foreign key relationships:');
    const { data: fkeys, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        table_name,
        constraint_type
      `)
      .eq('constraint_type', 'FOREIGN KEY')
      .eq('table_schema', 'public');
    
    if (fkError) {
      console.error('Error fetching foreign keys:', fkError);
    } else {
      fkeys.forEach(fk => {
        console.log(`  - ${fk.table_name}: ${fk.constraint_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  }
}

checkDatabaseSchema();
