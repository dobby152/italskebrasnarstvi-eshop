# 🧹 Production v0.1 Cleanup Plan

## Current Issues for Production:

1. **Archive folder** - 100+ development files (archive/)
2. **Duplicate frontend** - Both root/frontend and standalone frontend
3. **Test files** - Screenshots, videos, temporary files
4. **Development dependencies** - mcp-servers, playwright-mcp
5. **Large images** - Thousands of product images in public/
6. **Environment conflicts** - Multiple .env files
7. **Git submodules** - Nested repositories

## Production Structure Plan:

```
italske-brasnarstvi-eshop/
├── README.md                 ✅ Production docs
├── package.json             ✅ Root dependencies
├── vercel.json              ✅ Vercel config
├── .env.example             ✅ Environment template
├── .gitignore               ✅ Clean ignores
├── 
├── app/                     ✅ Next.js 14 app directory
├── components/              ✅ React components
├── lib/                     ✅ Utilities and types
├── contexts/                ✅ Auth & cart contexts
├── hooks/                   ✅ Custom hooks
├── public/                  ✅ Optimized assets
├── styles/                  ✅ Global styles
├── 
├── api/                     ✅ API routes (Vercel functions)
├── middleware.ts            ✅ Auth middleware
├── next.config.js           ✅ Production config
├── 
├── docs/                    ✅ Documentation
├── database/                ✅ Schema and setup
└── tests/                   ✅ Essential tests only
```

## Actions Required:

1. **Move frontend to root** (Next.js 14 structure)
2. **Delete archive folder** (development files)
3. **Optimize images** (compress and move to CDN)
4. **Clean dependencies** (remove dev-only packages)
5. **Create API routes** (for Vercel functions)
6. **Update configuration** (Vercel-optimized)
7. **Security review** (remove secrets, test files)

## Vercel Hobby Plan Limits:
- ✅ 100GB bandwidth
- ✅ 1000 serverless function executions/day
- ✅ Edge network (global CDN)
- ⚠️  Need external database (Supabase ✅)
- ⚠️  No backend server (use API routes ✅)

Ready to proceed? This will create a clean v0.1 production build.