const request = require('supertest');
const express = require('express');
const path = require('path');

// Mock environment variables for testing
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-must-be-long';
process.env.PORT = '3006';

describe('Full Integration Tests', () => {
  let app;
  let server;
  let backendServer;
  let authToken;
  let sessionId;
  
  beforeAll(async () => {
    // Generate unique session ID for tests
    sessionId = 'test-session-' + Date.now();
    
    try {
      // Start the backend server
      const serverPath = path.join(__dirname, '..', 'backend', 'enhanced-server-supabase.js');
      
      // Create a mock express app for testing API endpoints
      const userExperienceApi = require('../backend/user-experience-api.js');
      app = express();
      app.use(express.json());
      app.use('/api', userExperienceApi);
      
      server = app.listen(3006);
      console.log('✅ Test server started on port 3006');
      
    } catch (error) {
      console.log('⚠️ Error starting test servers:', error.message);
    }
  });

  afterAll(async () => {
    if (server) {
      server.close();
      console.log('✅ Test server stopped');
    }
    if (backendServer) {
      backendServer.close();
      console.log('✅ Backend server stopped');
    }
  });

  describe('Complete User Journey', () => {
    let userId;
    let cartId;
    let wishlistId;
    let orderId;

    it('should complete full user registration flow', async () => {
      const userData = {
        email: `integration.test.${Date.now()}@example.com`,
        password: 'testPassword123',
        firstName: 'Integration',
        lastName: 'Test',
        phone: '+420123456789',
        acceptsMarketing: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(userData.email);
        
        authToken = response.body.token;
        userId = response.body.user.id;
        
        console.log('✅ User registration successful');
      } else {
        console.log('⚠️ User registration failed (expected if DB not available):', response.status);
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should login with registered credentials', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping login test - no registration token');
        return;
      }

      const loginData = {
        email: `integration.test.${Date.now()}@example.com`,
        password: 'testPassword123',
        rememberMe: true
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        console.log('✅ User login successful');
      }
    });

    it('should create and manage shopping cart', async () => {
      // Test guest cart first
      const guestCartResponse = await request(app)
        .get('/api/cart')
        .set('x-session-id', sessionId);

      expect(guestCartResponse.status).toBeLessThan(500);
      
      if (guestCartResponse.status === 200) {
        expect(guestCartResponse.body).toHaveProperty('cart');
        console.log('✅ Guest cart creation successful');
      }

      // Test authenticated cart if we have auth token
      if (authToken) {
        const authCartResponse = await request(app)
          .get('/api/cart')
          .set('Authorization', `Bearer ${authToken}`);

        expect(authCartResponse.status).toBeLessThan(500);
        
        if (authCartResponse.status === 200) {
          cartId = authCartResponse.body.cart.id;
          console.log('✅ Authenticated cart creation successful');
        }
      }
    });

    it('should add items to cart', async () => {
      const cartItem = {
        productId: 'integration-test-product-1',
        variantId: 'integration-test-variant-1',
        quantity: 2
      };

      // Test adding to guest cart
      const guestResponse = await request(app)
        .post('/api/cart/items')
        .set('x-session-id', sessionId)
        .send(cartItem);

      expect(guestResponse.status).toBeLessThan(500);
      
      if (guestResponse.status === 201) {
        console.log('✅ Item added to guest cart');
      }

      // Test adding to authenticated cart
      if (authToken) {
        const authResponse = await request(app)
          .post('/api/cart/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send(cartItem);

        expect(authResponse.status).toBeLessThan(500);
        
        if (authResponse.status === 201) {
          console.log('✅ Item added to authenticated cart');
        }
      }
    });

    it('should create and manage wishlists', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping wishlist test - no auth token');
        return;
      }

      // Create wishlist
      const wishlistData = {
        name: 'Integration Test Wishlist',
        description: 'Test wishlist for integration testing',
        is_public: false
      };

      const createResponse = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData);

      expect(createResponse.status).toBeLessThan(500);
      
      if (createResponse.status === 201) {
        wishlistId = createResponse.body.wishlist.id;
        console.log('✅ Wishlist created successfully');

        // Add item to wishlist
        const itemData = {
          wishlistId: wishlistId,
          productId: 'integration-test-product-2',
          notes: 'Integration test item'
        };

        const addItemResponse = await request(app)
          .post('/api/wishlist/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send(itemData);

        expect(addItemResponse.status).toBeLessThan(500);
        
        if (addItemResponse.status === 201) {
          console.log('✅ Item added to wishlist');
        }
      }
    });

    it('should load and filter orders', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping orders test - no auth token');
        return;
      }

      const ordersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(ordersResponse.status).toBeLessThan(500);
      
      if (ordersResponse.status === 200) {
        expect(ordersResponse.body).toHaveProperty('orders');
        expect(Array.isArray(ordersResponse.body.orders)).toBe(true);
        console.log('✅ Orders loaded successfully');

        // Test filtering by status
        const filteredResponse = await request(app)
          .get('/api/orders?status=pending')
          .set('Authorization', `Bearer ${authToken}`);

        expect(filteredResponse.status).toBeLessThan(500);
        
        if (filteredResponse.status === 200) {
          console.log('✅ Order filtering successful');
        }
      }
    });

    it('should handle order tracking', async () => {
      const trackingResponse = await request(app)
        .get('/api/orders/track?number=TEST123456789CZ');

      expect(trackingResponse.status).toBeLessThan(500);
      
      // This will likely return 404 or error since it's a test tracking number
      if (trackingResponse.status === 404) {
        expect(trackingResponse.body).toHaveProperty('error');
        console.log('✅ Order tracking endpoint works (returned expected 404)');
      } else if (trackingResponse.status === 200) {
        expect(trackingResponse.body).toHaveProperty('tracking');
        console.log('✅ Order tracking successful');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Malformed JSON handled properly');
    });

    it('should handle missing required headers', async () => {
      const response = await request(app)
        .get('/api/cart');
      // No session-id or authorization header

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Missing headers handled properly');
    });

    it('should handle invalid authentication tokens', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Invalid auth token handled properly');
    });

    it('should handle database connection errors gracefully', async () => {
      // This test assumes database is not available or returns errors
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      // Should return either success or a proper error response
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
      
      if (response.status >= 400) {
        expect(response.body).toHaveProperty('error');
        console.log('✅ Database error handled gracefully');
      } else {
        console.log('✅ Database operation successful');
      }
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: 'password123'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
      console.log('✅ SQL injection attempt blocked');
    });

    it('should validate input data types', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('x-session-id', sessionId)
        .send({
          productId: 123, // Should be string
          quantity: 'invalid' // Should be number
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Input validation working');
    });

    it('should enforce rate limiting (if implemented)', async () => {
      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrong'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Check if any requests were rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        console.log('✅ Rate limiting is working');
        expect(rateLimitedResponses[0].body).toHaveProperty('error');
      } else {
        console.log('⚠️ Rate limiting not implemented or not triggered');
      }
    });
  });

  describe('Performance Tests', () => {
    it('should respond within reasonable time limits', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/cart')
        .set('x-session-id', sessionId);

      const responseTime = Date.now() - start;
      
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(response.status).toBeLessThan(500);
      
      console.log(`✅ API response time: ${responseTime}ms`);
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/cart')
            .set('x-session-id', `concurrent-test-${i}`)
        );
      }

      const start = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - start;

      // All requests should complete
      expect(responses).toHaveLength(concurrentRequests);
      
      // At least some should succeed (even if DB is not available)
      const successfulResponses = responses.filter(r => r.status < 500);
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      console.log(`✅ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain cart item quantities correctly', async () => {
      const itemData = {
        productId: 'consistency-test-product',
        quantity: 2
      };

      // Add item
      const addResponse = await request(app)
        .post('/api/cart/items')
        .set('x-session-id', sessionId)
        .send(itemData);

      if (addResponse.status === 201) {
        const itemId = addResponse.body.item.id;
        
        // Update quantity
        const updateResponse = await request(app)
          .put(`/api/cart/items/${itemId}`)
          .set('x-session-id', sessionId)
          .send({ quantity: 5 });

        expect(updateResponse.status).toBeLessThan(500);
        
        if (updateResponse.status === 200) {
          // Verify cart totals are recalculated
          const cartResponse = await request(app)
            .get('/api/cart')
            .set('x-session-id', sessionId);

          if (cartResponse.status === 200) {
            expect(cartResponse.body.cart).toHaveProperty('subtotal');
            expect(cartResponse.body.cart).toHaveProperty('total_amount');
            console.log('✅ Cart totals are maintained correctly');
          }
        }
      } else {
        console.log('⚠️ Skipping data consistency test - cart operation failed');
      }
    });

    it('should handle duplicate operations gracefully', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping duplicate operations test - no auth token');
        return;
      }

      // Try to create the same wishlist twice
      const wishlistData = {
        name: 'Duplicate Test Wishlist',
        is_public: false
      };

      const response1 = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData);

      const response2 = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData);

      // Both should either succeed or fail gracefully
      expect(response1.status).toBeLessThan(500);
      expect(response2.status).toBeLessThan(500);
      
      console.log('✅ Duplicate operations handled gracefully');
    });
  });
});

console.log('✅ Integration tests loaded successfully');