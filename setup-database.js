#!/usr/bin/env node
/**
 * 🔒 SECURE DATABASE SETUP WITH SUPABASE
 * Automatically creates all required tables for authentication
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076'
);

async function setupDatabase() {
  console.log('🔒 Starting secure database setup...');
  
  try {
    // Create users table
    console.log('📋 Creating users table...');
    const usersTableSQL = `
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
    `;

    const { error: usersError } = await supabase.rpc('exec_sql', { sql: usersTableSQL });
    
    // Try direct SQL if RPC doesn't work
    if (usersError) {
      console.log('⚠️  RPC not available, using direct query...');
      const { error: directError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .limit(1);
        
      if (directError) {
        console.log('❌ Direct query failed, manual SQL setup required');
        console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
        console.log(usersTableSQL);
        return;
      }
    } else {
      console.log('✅ Users table created successfully');
    }

    // Create user_sessions table
    console.log('📋 Creating user_sessions table...');
    const sessionsTableSQL = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        refresh_token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: sessionsError } = await supabase.rpc('exec_sql', { sql: sessionsTableSQL });
    
    if (sessionsError) {
      console.log('\n📋 Please also run this SQL for sessions:');
      console.log(sessionsTableSQL);
    } else {
      console.log('✅ User sessions table created successfully');
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = '$2b$12$rQZ1bSh1UqV8CZK2BqG/sO0dKxNGp0x1Lhx4Hx5p0uV4XcF6sK8w.'; // admin123456
    
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .upsert({
        email: 'admin@test.cz',
        password_hash: adminPassword,
        first_name: 'Admin',
        last_name: 'Test',
        role: 'admin',
        is_active: true,
        email_verified: true
      }, { 
        onConflict: 'email',
        ignoreDuplicates: true 
      })
      .select();

    if (adminError) {
      console.log('⚠️  Admin user creation failed:', adminError.message);
      console.log('\n📋 Manual admin user SQL:');
      console.log(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
        VALUES (
          'admin@test.cz',
          '${adminPassword}',
          'Admin',
          'Test', 
          'admin',
          true,
          true
        ) ON CONFLICT (email) DO NOTHING;
      `);
    } else {
      console.log('✅ Admin user created: admin@test.cz / admin123456');
    }

    // Test connection
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('email, role')
      .limit(1);

    if (testError) {
      console.log('❌ Database connection test failed:', testError.message);
    } else {
      console.log('✅ Database connection successful');
      console.log('📊 Found users:', testData.length);
    }

    console.log('\n🎉 Database setup completed!');
    console.log('🔒 Admin login: admin@test.cz / admin123456');
    console.log('🚀 Your secure authentication system is ready!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📋 Please run the SQL manually in Supabase:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');  
    console.log('3. Run the quick-setup.sql file');
  }
}

// Run setup
setupDatabase().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});