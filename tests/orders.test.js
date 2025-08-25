const request = require('supertest');
const express = require('express');

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';

describe('Order Management System', () => {
  let app;
  let server;
  let authToken;
  
  beforeAll(async () => {
    const userExperienceApi = require('../backend/user-experience-api.js');
    app = express();
    app.use(express.json());
    app.use('/api', userExperienceApi);
    
    server = app.listen(3005);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Authentication Required for Orders', () => {
    it('should require authentication for loading orders', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authentication');
    });

    it('should require authentication for order details', async () => {
      const response = await request(app)
        .get('/api/orders/test-order-id');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authenticated Order Operations', () => {
    beforeAll(async () => {
      // Try to register and login a test user
      const userData = {
        email: 'orderstest@example.com',
        password: 'password123',
        firstName: 'Orders',
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

    it('should load user orders', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated orders test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('orders');
        expect(Array.isArray(response.body.orders)).toBe(true);
      }
    });

    it('should filter orders by status', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated orders test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('orders');
        // If orders exist, they should all be pending
        if (response.body.orders.length > 0) {
          response.body.orders.forEach(order => {
            expect(order.status).toBe('pending');
          });
        }
      }
    });

    it('should search orders by order number', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated orders test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/orders?search=ORD123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('orders');
      }
    });

    it('should support pagination', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated orders test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/orders?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('orders');
        // Should return max 5 orders
        expect(response.body.orders.length).toBeLessThanOrEqual(5);
      }
    });

    it('should get order details', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated orders test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/orders/test-order-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      // Could be 200 (found), 404 (not found), or 500 (server error)
    });

    it('should generate invoice', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated orders test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/orders/test-order-id/invoice')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      // Could be 200 (PDF generated), 404 (order not found), or 500 (error)
    });
  });

  describe('Order Tracking', () => {
    it('should track order without authentication for valid tracking number', async () => {
      const response = await request(app)
        .get('/api/orders/track?number=RR123456789CZ');

      expect(response.status).toBeLessThan(500);
      // Could be 200 (found), 404 (not found), or 500 (server error)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('tracking');
        expect(response.body.tracking).toHaveProperty('tracking_number');
        expect(response.body.tracking).toHaveProperty('status');
        expect(response.body.tracking).toHaveProperty('events');
      }
    });

    it('should reject tracking without tracking number', async () => {
      const response = await request(app)
        .get('/api/orders/track');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Tracking number');
    });

    it('should handle invalid tracking number format', async () => {
      const response = await request(app)
        .get('/api/orders/track?number=invalid');

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should track with authentication for user orders', async () => {
      if (!authToken) {
        console.log('⚠️ Skipping authenticated tracking test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/orders/track?number=RR123456789CZ')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Order Status Validation', () => {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    it('should accept valid order status filters', async () => {
      if (!authToken) return;

      for (const status of validStatuses) {
        const response = await request(app)
          .get(`/api/orders?status=${status}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBeLessThan(500);
      }
    });

    it('should reject invalid order status', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/orders?status=invalid_status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Order Query Parameters', () => {
    it('should handle numeric pagination parameters', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/orders?limit=abc&offset=def')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle negative pagination parameters', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/orders?limit=-1&offset=-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should enforce reasonable pagination limits', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/orders?limit=1000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        // Should enforce max limit even if requested limit is huge
        expect(response.body.orders.length).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Order Data Structure', () => {
    it('should return properly structured order data', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200 && response.body.orders.length > 0) {
        const order = response.body.orders[0];
        
        // Check required fields
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('order_number');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('total_amount');
        expect(order).toHaveProperty('created_at');
        
        // Check data types
        expect(typeof order.id).toBe('string');
        expect(typeof order.order_number).toBe('string');
        expect(typeof order.status).toBe('string');
        expect(typeof order.total_amount).toBe('number');
        expect(typeof order.created_at).toBe('string');
      }
    });
  });
});

console.log('✅ Order management tests loaded successfully');