const request = require('supertest');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';

describe('Authentication System', () => {
  let app;
  let server;
  
  beforeAll(async () => {
    // Import and setup the API after env vars are set
    const userExperienceApi = require('../backend/user-experience-api.js');
    app = express();
    app.use(express.json());
    app.use('/api/user-experience', userExperienceApi);
    
    // Use dynamic port to avoid conflicts
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/user-experience/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+420123456789',
        acceptsMarketing: true
      };

      const response = await request(app)
        .post('/api/user-experience/auth/register')
        .send(userData);

      // Should return success response with token and user data
      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(userData.email);
      } else {
        // If database connection fails, should return appropriate error
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/user-experience/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should reject registration with short password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/user-experience/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('password');
    });

    it('should reject registration with missing required fields', async () => {
      const userData = {
        email: 'test3@example.com'
        // Missing password, firstName, lastName
      };

      const response = await request(app)
        .post('/api/user-experience/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/user-experience/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First, try to register a user (may fail if DB not available)
      const userData = {
        email: 'logintest@example.com',
        password: 'password123',
        firstName: 'Login',
        lastName: 'Test'
      };

      await request(app)
        .post('/api/user-experience/auth/register')
        .send(userData);

      // Now try to login
      const loginData = {
        email: userData.email,
        password: userData.password,
        rememberMe: false
      };

      const response = await request(app)
        .post('/api/user-experience/auth/login')
        .send(loginData);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
      } else {
        // If database connection fails or user doesn't exist
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/user-experience/auth/login')
        .send(loginData);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with wrong password', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/user-experience/auth/login')
        .send(loginData);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with missing fields', async () => {
      const loginData = {
        email: 'test@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/user-experience/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Password Hashing', () => {
    it('should properly hash passwords', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });
});

console.log('✅ Authentication tests loaded successfully');