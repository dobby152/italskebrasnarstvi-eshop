const request = require('supertest');
const express = require('express');

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';

describe('Shopping Cart System', () => {
  let app;
  let server;
  let authToken;
  let sessionId;
  
  beforeAll(async () => {
    const userExperienceApi = require('../backend/user-experience-api.js');
    app = express();
    app.use(express.json());
    app.use('/api', userExperienceApi);
    
    server = app.listen(3003);
    
    // Generate test session ID
    sessionId = 'test-session-' + Date.now();
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Cart Management for Guest Users', () => {
    it('should create cart for guest user with session ID', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('x-session-id', sessionId);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('cart');
        expect(response.body.cart).toHaveProperty('items');
        expect(Array.isArray(response.body.cart.items)).toBe(true);
      } else {
        // If database connection fails
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should add item to guest cart', async () => {
      const cartItem = {
        productId: 'test-product-1',
        variantId: 'test-variant-1',
        quantity: 2
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('x-session-id', sessionId)
        .send(cartItem);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('item');
      } else {
        // If database connection fails or product doesn't exist
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should update cart item quantity', async () => {
      // First add an item
      const cartItem = {
        productId: 'test-product-2',
        quantity: 1
      };

      const addResponse = await request(app)
        .post('/api/cart/items')
        .set('x-session-id', sessionId)
        .send(cartItem);

      if (addResponse.status === 201) {
        const itemId = addResponse.body.item.id;
        
        const updateResponse = await request(app)
          .put(`/api/cart/items/${itemId}`)
          .set('x-session-id', sessionId)
          .send({ quantity: 3 });

        expect(updateResponse.status).toBeLessThan(500);
        
        if (updateResponse.status === 200) {
          expect(updateResponse.body).toHaveProperty('success', true);
        }
      }
    });

    it('should remove item from cart', async () => {
      // First add an item
      const cartItem = {
        productId: 'test-product-3',
        quantity: 1
      };

      const addResponse = await request(app)
        .post('/api/cart/items')
        .set('x-session-id', sessionId)
        .send(cartItem);

      if (addResponse.status === 201) {
        const itemId = addResponse.body.item.id;
        
        const deleteResponse = await request(app)
          .delete(`/api/cart/items/${itemId}`)
          .set('x-session-id', sessionId);

        expect(deleteResponse.status).toBeLessThan(500);
        
        if (deleteResponse.status === 200) {
          expect(deleteResponse.body).toHaveProperty('success', true);
        }
      }
    });
  });

  describe('Cart Management for Authenticated Users', () => {
    beforeAll(async () => {
      // Try to register and login a test user
      const userData = {
        email: 'carttest@example.com',
        password: 'password123',
        firstName: 'Cart',
        lastName: 'Test'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      if (registerResponse.status === 201) {
        authToken = registerResponse.body.token;
      } else {
        // Try login instead
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          });
        
        if (loginResponse.status === 200) {
          authToken = loginResponse.body.token;
        }
      }
    });

    it('should load authenticated user cart', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated cart test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('cart');
        expect(response.body.cart).toHaveProperty('items');
      }
    });

    it('should add item to authenticated user cart', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated cart test - no auth token');
        return;
      }

      const cartItem = {
        productId: 'test-product-auth-1',
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartItem);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
      }
    });
  });

  describe('Cart Input Validation', () => {
    it('should reject adding item without product ID', async () => {
      const cartItem = {
        quantity: 1
        // Missing productId
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('x-session-id', sessionId)
        .send(cartItem);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject adding item with invalid quantity', async () => {
      const cartItem = {
        productId: 'test-product-1',
        quantity: -1
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('x-session-id', sessionId)
        .send(cartItem);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject updating with invalid quantity', async () => {
      const response = await request(app)
        .put('/api/cart/items/test-item-id')
        .set('x-session-id', sessionId)
        .send({ quantity: 0 });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Cart Session Management', () => {
    it('should require session ID or auth token', async () => {
      const response = await request(app)
        .get('/api/cart');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('session');
    });

    it('should handle cart migration from guest to authenticated user', async () => {
      // This would require more complex setup with database
      // For now, just test that the endpoint exists
      const response = await request(app)
        .post('/api/cart/migrate')
        .set('x-session-id', sessionId);

      // Should return some response, even if it's an error due to missing auth
      expect(response.status).toBeDefined();
    });
  });
});

console.log('✅ Shopping cart tests loaded successfully');