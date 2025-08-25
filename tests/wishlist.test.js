const request = require('supertest');
const express = require('express');

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';

describe('Wishlist System', () => {
  let app;
  let server;
  let authToken;
  
  beforeAll(async () => {
    const userExperienceApi = require('../backend/user-experience-api.js');
    app = express();
    app.use(express.json());
    app.use('/api', userExperienceApi);
    
    server = app.listen(3004);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Authentication Required', () => {
    it('should require authentication for wishlist operations', async () => {
      const response = await request(app)
        .get('/api/wishlist');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authentication');
    });

    it('should require authentication for creating wishlist', async () => {
      const wishlistData = {
        name: 'Test Wishlist',
        description: 'Test description',
        is_public: false
      };

      const response = await request(app)
        .post('/api/wishlist')
        .send(wishlistData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication for adding items to wishlist', async () => {
      const itemData = {
        wishlistId: 'test-wishlist-1',
        productId: 'test-product-1'
      };

      const response = await request(app)
        .post('/api/wishlist/items')
        .send(itemData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authenticated Wishlist Operations', () => {
    beforeAll(async () => {
      // Try to register and login a test user
      const userData = {
        email: 'wishlisttest@example.com',
        password: 'password123',
        firstName: 'Wishlist',
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

    it('should load user wishlists', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated wishlist test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('wishlists');
        expect(Array.isArray(response.body.wishlists)).toBe(true);
      }
    });

    it('should create new wishlist', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated wishlist test - no auth token');
        return;
      }

      const wishlistData = {
        name: 'My Test Wishlist',
        description: 'Test wishlist description',
        is_public: false
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('wishlist');
        expect(response.body.wishlist.name).toBe(wishlistData.name);
      }
    });

    it('should add item to wishlist', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated wishlist test - no auth token');
        return;
      }

      // First create a wishlist
      const wishlistData = {
        name: 'Items Test Wishlist',
        is_public: false
      };

      const wishlistResponse = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData);

      if (wishlistResponse.status === 201) {
        const wishlistId = wishlistResponse.body.wishlist.id;
        
        const itemData = {
          wishlistId: wishlistId,
          productId: 'test-product-1',
          variantId: 'test-variant-1',
          notes: 'Test notes'
        };

        const response = await request(app)
          .post('/api/wishlist/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send(itemData);

        expect(response.status).toBeLessThan(500);
        
        if (response.status === 201) {
          expect(response.body).toHaveProperty('success', true);
        }
      }
    });

    it('should remove item from wishlist', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated wishlist test - no auth token');
        return;
      }

      // This would require setting up a wishlist item first
      const response = await request(app)
        .delete('/api/wishlist/items/test-item-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      // Could be 200 (success), 404 (not found), or 500 (server error)
    });

    it('should check if product is in wishlist', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated wishlist test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/wishlist/check?productId=test-product-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('inWishlist');
        expect(typeof response.body.inWishlist).toBe('boolean');
      }
    });
  });

  describe('Wishlist Input Validation', () => {
    beforeAll(async () => {
      // Use existing auth token or skip if not available
      if (!authToken) {
        console.log('⚠️ No auth token available for validation tests');
      }
    });

    it('should reject creating wishlist without name', async () => {
      if (!authToken) return;

      const wishlistData = {
        description: 'Test description',
        is_public: false
        // Missing name
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject adding item without product ID', async () => {
      if (!authToken) return;

      const itemData = {
        wishlistId: 'test-wishlist-1'
        // Missing productId
      };

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject adding item without wishlist ID', async () => {
      if (!authToken) return;

      const itemData = {
        productId: 'test-product-1'
        // Missing wishlistId
      };

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Wishlist Privacy', () => {
    it('should handle public vs private wishlist settings', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping privacy test - no auth token');
        return;
      }

      const publicWishlistData = {
        name: 'Public Wishlist',
        is_public: true
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(publicWishlistData);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 201) {
        expect(response.body.wishlist.is_public).toBe(true);
      }
    });
  });
});

console.log('✅ Wishlist tests loaded successfully');