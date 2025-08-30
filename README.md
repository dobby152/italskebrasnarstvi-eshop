# Italian Leather E-shop - Production v0.1

🛍️ Premium Italian leather goods e-commerce store - **Production Ready**

## 🎯 Overview
Professional e-commerce solution for Italian leather products built with Next.js 15, optimized for Vercel Hobby plan deployment with comprehensive security and performance features.

## ✨ Features

### 🛒 E-shop Frontend
- **Modern Stack**: Next.js 15 with App Router, React 19, TypeScript
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Product Catalog**: Advanced filtering, search, and categorization
- **Shopping Cart**: Persistent cart with optimized checkout flow
- **User Authentication**: Secure JWT-based authentication system

### 👨‍💼 Admin Dashboard
- **Product Management**: Create, edit, and manage product catalog
- **Order Tracking**: Real-time order status and customer management
- **Analytics**: Sales statistics and performance metrics
- **Category Management**: Organize products by categories and collections
- **Secure Access**: Protected admin routes with authentication

### 🔐 Security & Performance
- **Production Security**: CSP headers, XSS protection, CSRF prevention
- **Image Optimization**: AVIF/WebP formats with lazy loading
- **Caching Strategy**: Optimized caching for static and dynamic content
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Type Safety**: Full TypeScript implementation

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with bcrypt password hashing
- **UI Components**: Radix UI, Lucide React icons
- **Deployment**: Vercel (Hobby Plan Ready)
- **Performance**: Image optimization, code splitting, compression

## 📦 Installation & Setup

### Prerequisites
```bash
Node.js >= 18.17.0
npm >= 8.0.0
```

### Environment Variables
Create `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dbnfkzctensbpktgbsgn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Authentication
JWT_SECRET=your_secure_jwt_secret_key
NEXT_PUBLIC_JWT_SECRET=your_secure_jwt_secret_key

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
```

### Quick Start
```bash
# Clone repository
git clone https://github.com/dobby152/italskebrasnarstvi-eshop.git
cd italskebrasnarstvi-eshop

# Install dependencies
npm install

# Run development server
npm run dev
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. **Connect Repository**: Link GitHub repo to Vercel
2. **Configure Environment**: Set environment variables in Vercel dashboard
3. **Deploy**: Automatic deployment on push to main branch

### Build Commands
```bash
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint code quality check
npm run type-check   # TypeScript validation
npm run clean        # Clear build cache
```

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes (Vercel Functions)
│   ├── components/        # Reusable React components
│   ├── lib/               # Utilities and configurations
│   └── globals.css        # Global styles
├── public/                # Static assets
├── backend/               # Backend server (optional)
└── next.config.js         # Production configuration
```

### Key Directories
- **`app/api/`**: Serverless API routes for Vercel
- **`app/components/`**: Modular UI components
- **`app/lib/`**: Database, authentication, and utility functions
- **`app/admin/`**: Protected admin interface

## 🔧 Production Configuration

### Next.js Optimizations
- **Security Headers**: CSP, XSS protection, frame options
- **Image Optimization**: AVIF/WebP with device-specific sizing
- **Webpack Configuration**: Client-side optimizations
- **Compression**: Gzip enabled with ETags
- **Bundle Analysis**: Code splitting and tree shaking

### Database Schema (Supabase)
```sql
-- Users authentication
users (id, email, password_hash, role, created_at)

-- Product catalog
products (id, name, description, price, sku, category_id, images)
categories (id, name, slug, description)

-- Order management
orders (id, user_id, total, status, created_at)
order_items (id, order_id, product_id, quantity, price)
```

## 🛡️ Security Features

### Implementation
- **Content Security Policy**: Prevents XSS and injection attacks
- **JWT Authentication**: Secure token-based user sessions
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Zod schema validation
- **API Protection**: Rate limiting and request validation
- **HTTPS Only**: Secure connections enforced

### Headers Configuration
```javascript
// Security headers in next.config.js
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: strict policies
```

## 📊 Performance Metrics

### Optimizations
- **Core Web Vitals**: Optimized LCP, FID, CLS scores
- **Image Loading**: Lazy loading with placeholder blur
- **Code Splitting**: Dynamic imports for large components
- **Caching**: Strategic cache headers for static assets
- **Bundle Size**: Minimized with tree shaking

### Monitoring
- **Build Analytics**: Bundle size analysis
- **Runtime Monitoring**: Performance tracking
- **Error Logging**: Comprehensive error handling

## 🌐 API Routes (Vercel Functions)

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Session termination

### Products
- `GET /api/products` - Product catalog
- `GET /api/products/[id]` - Product details
- `POST /api/products` - Create product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Order history
- `GET /api/orders/[id]` - Order details

## 🔍 Development

### Available Scripts
```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint validation
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript validation
npm run clean        # Clean build artifacts
```

### Code Quality Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Next.js recommended configuration
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit validation

## 🚀 Production Checklist

### ✅ Completed
- [x] Code structure optimization
- [x] Production Next.js configuration
- [x] Security headers implementation
- [x] Image optimization setup
- [x] TypeScript strict mode
- [x] ESLint configuration
- [x] Vercel deployment preparation
- [x] Environment variable setup
- [x] Database schema optimization
- [x] Performance optimizations

### 🔄 Ready for Deployment
- **Vercel Hobby Plan**: Fully compatible
- **Environment Variables**: Configured
- **Build Process**: Optimized
- **Security**: Production-ready
- **Performance**: Core Web Vitals optimized

## 📝 Version Information

**Current Version**: 0.1.0 (Production Ready)  
**Release Date**: August 2024  
**Node.js**: >= 18.17.0  
**Next.js**: 15.5.2  
**React**: 19.0.0  

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**🏆 Production v0.1 - Ready for Vercel Deployment**  
Built with Next.js 15 • React 19 • TypeScript • Tailwind CSS • Supabase
