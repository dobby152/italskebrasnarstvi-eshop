# 🛍️ Italian Leather Goods E-shop

Premium Italian leather goods e-commerce platform with advanced user experience features.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Environment variables configured

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your actual values
```

### Database Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) 
2. Navigate to SQL Editor
3. Run `create_customers_prerequisite.sql`
4. Run `user_experience_schema.sql`

### Development
```bash
# Start backend server
node backend/enhanced-server-supabase.js

# Start frontend (in separate terminal)
cd frontend
npm run dev
```

## 📊 Features

### 🔐 User Authentication
- Secure registration/login
- JWT token authentication
- Password reset functionality
- Session management

### 🛒 Shopping Cart
- Persistent cart for logged-in users
- Guest cart with session storage
- Real-time cart updates
- Automatic total calculations

### ❤️ Wishlist System
- Multiple wishlists per user
- Public/private wishlist sharing
- Easy add to cart from wishlist

### 📦 Order Management
- Complete order history
- Real-time order tracking
- Order status notifications
- Invoice generation

### 👤 User Profiles
- Personal account management
- Address book
- Order preferences
- Marketing settings

## 🗂️ Project Structure

```
├── backend/
│   ├── enhanced-server-supabase.js  # Main API server
│   └── user-experience-api.js       # User experience endpoints
├── frontend/
│   ├── app/                         # Next.js pages
│   ├── components/                  # React components
│   │   ├── auth/                    # Authentication forms
│   │   ├── cart/                    # Shopping cart
│   │   ├── orders/                  # Order history
│   │   └── wishlist/                # Wishlist management
│   └── public/                      # Static assets
├── tests/                           # Test suite
├── archive/                         # Archived development files
├── user_experience_schema.sql       # Database schema
└── create_customers_prerequisite.sql # Required tables
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm run test:watch
```

## 🌐 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables for Production
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_URL=your_api_url
```

## 📡 API Endpoints

### Authentication
- `POST /api/user-experience/auth/register` - User registration
- `POST /api/user-experience/auth/login` - User login

### Shopping Cart
- `GET /api/user-experience/cart` - Get cart
- `POST /api/user-experience/cart/items` - Add to cart
- `PUT /api/user-experience/cart/items/:id` - Update cart item
- `DELETE /api/user-experience/cart/items/:id` - Remove from cart

### Wishlist
- `GET /api/user-experience/wishlist` - Get wishlists
- `POST /api/user-experience/wishlist` - Create wishlist
- `POST /api/user-experience/wishlist/items` - Add to wishlist

### Orders
- `GET /api/user-experience/orders` - Get order history
- `GET /api/user-experience/orders/track` - Track order

## 🎨 Frontend Features

### Components
- **Authentication Forms** - Login/register with validation
- **Shopping Cart** - Full cart management with persistence
- **Wishlist Manager** - Multiple wishlists with sharing
- **Order History** - Complete order tracking
- **User Profile** - Account management

### UI Framework
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality components
- **Lucide Icons** - Beautiful icons
- **Next.js 13+** - App router architecture

## 🔧 Development

### Code Quality
- **ESLint** - Code linting
- **TypeScript** - Type safety
- **Jest** - Unit testing
- **SuperTest** - API testing

### Database
- **Supabase** - PostgreSQL with real-time features
- **Row Level Security** - Data protection
- **Automatic backups** - Data safety

## 📈 Performance

- **Optimized images** - Next.js Image component
- **Code splitting** - Automatic by Next.js
- **Caching** - API response caching
- **Database indexes** - Fast queries

## 🔒 Security

- **JWT tokens** - Secure authentication
- **Password hashing** - bcrypt with salt
- **Input validation** - Server-side validation
- **CORS protection** - Cross-origin security
- **Rate limiting** - API protection

## 📞 Support

For issues and questions:
1. Check existing GitHub issues
2. Create new issue with details
3. Include error logs and steps to reproduce

## 🎯 Status

**✅ PRODUCTION READY**

All features implemented and tested. Ready for deployment after database schema setup.

---

Built with ❤️ for premium Italian leather goods.