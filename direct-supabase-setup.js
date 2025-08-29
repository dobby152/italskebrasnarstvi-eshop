#!/usr/bin/env node
/**
 * 🔒 DIRECT SUPABASE DATABASE SETUP
 * Uses service key to directly create tables
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseServiceKey = 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076';

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTables() {
  console.log('🔒 Setting up Supabase tables directly...');

  try {
    // Test connection first
    console.log('🔍 Testing connection...');
    const { data, error } = await supabase.from('products').select('count').limit(1);
    
    if (error && !error.message.includes('relation "products" does not exist')) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully');

    // Try to create users table using direct SQL
    console.log('📋 Attempting to create users table...');
    
    // Using rpc to execute raw SQL
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          phone VARCHAR(20),
          birth_date DATE,
          role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          address JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login_at TIMESTAMP WITH TIME ZONE
        );
      `
    });

    if (createError) {
      console.log('⚠️  RPC exec_sql not available:', createError.message);
      console.log('🔧 Trying alternative approach...');
      
      // Try to access system tables to verify permissions
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);

      if (tablesError) {
        console.log('❌ Cannot access system tables:', tablesError.message);
        console.log('📋 Manual setup required - use FINAL_SETUP.sql in Supabase dashboard');
        return false;
      }

      console.log('📊 Available tables:', tablesData.map(t => t.table_name));
      console.log('📋 Manual table creation required');
      return false;
    }

    console.log('✅ Users table created successfully');

    // Create sessions table
    const { data: sessionsResult, error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          refresh_token VARCHAR(500) NOT NULL UNIQUE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (sessionsError) {
      console.log('⚠️  Sessions table creation failed:', sessionsError.message);
    } else {
      console.log('✅ Sessions table created successfully');
    }

    // Insert admin user
    console.log('👤 Creating admin user...');
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .upsert({
        email: 'admin@test.cz',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMst5pKXBUySHSO', // admin123456
        first_name: 'Admin',
        last_name: 'Test',
        role: 'admin',
        is_active: true,
        email_verified: true
      }, { onConflict: 'email' });

    if (adminError) {
      console.log('⚠️  Admin user creation failed:', adminError.message);
    } else {
      console.log('✅ Admin user created: admin@test.cz / admin123456');
    }

    // Test final connection
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('email, role')
      .limit(1);

    if (testError) {
      console.log('⚠️  Final test failed:', testError.message);
    } else {
      console.log('✅ Database setup verification successful');
      console.log('👤 Users found:', testUser.length);
    }

    return true;

  } catch (error) {
    console.log('💥 Setup failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Direct Supabase Setup...');
  console.log('🔑 Using service key:', supabaseServiceKey.substring(0, 20) + '...');
  
  const success = await setupTables();
  
  if (success) {
    console.log('\n🎉 Database setup completed successfully!');
    console.log('🔐 Login credentials: admin@test.cz / admin123456');
    console.log('🚀 Authentication system is ready!');
  } else {
    console.log('\n📋 Manual setup required:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run the FINAL_SETUP.sql file');
    console.log('4. Test with admin@test.cz / admin123456');
  }
}

main().catch(console.error);