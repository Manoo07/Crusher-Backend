# Vercel Deployment Guide

This guide explains how to deploy the Crusher Backend to Vercel.

## Prerequisites

1. Vercel account (free tier available)
2. GitHub repository with your code
3. PostgreSQL database (we recommend Aiven or Neon)
4. Environment variables configured

## Project Structure for Vercel

The project has been configured for Vercel serverless deployment:

```
├── api/
│   └── index.ts          # Vercel serverless function entry point
├── src/
│   ├── app.ts           # Express app configuration (serverless-ready)
│   ├── index.ts         # Local development server
│   └── ...              # Your application code
├── vercel.json          # Vercel configuration
└── package.json         # Build scripts configured
```

## Environment Variables

Set these environment variables in your Vercel dashboard:

### Required Variables

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_SECRET="your-secure-jwt-secret"
NODE_ENV="production"
```

### Optional Variables

```env
CORS_ORIGIN="https://your-frontend-domain.com"
ADMIN_USERNAME="raj"
ADMIN_EMAIL="raj@gmail.com"
ADMIN_PASSWORD="YourSecurePassword123!"
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Connect Repository**

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**

   - In project settings → Environment Variables
   - Add all required variables listed above

3. **Deploy**
   - Vercel will automatically detect the configuration
   - First deployment will run `vercel-build` script
   - This includes: `prisma generate && prisma db push && tsc`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod
```

## Build Process

The `vercel-build` script in package.json runs:

1. `prisma generate` - Generates Prisma client
2. `prisma db push` - Pushes schema to database
3. `tsc` - Compiles TypeScript

## Database Seeding

After deployment, seed your production database:

### Option 1: Local Seeding (Recommended)

```bash
# Set your production DATABASE_URL in .env
DATABASE_URL="your-production-database-url"

# Run seed script
npm run prisma:seed
```

### Option 2: Vercel Functions (Advanced)

You can create a separate API endpoint for seeding:

```typescript
// api/seed.ts
import { seedProductionDatabase } from "../prisma/seed";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await seedProductionDatabase();
    res.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

## Domain Configuration

### Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed

### API Base URL

Your API will be available at:

- `https://your-project.vercel.app/api/`
- `https://your-domain.com/api/` (if using custom domain)

## Health Check

Test your deployment:

- Health endpoint: `https://your-project.vercel.app/api/health`
- Root endpoint: `https://your-project.vercel.app/`

## Monitoring and Logs

1. **Function Logs**

   - Vercel Dashboard → Your Project → Functions
   - View real-time logs and errors

2. **Analytics**
   - Vercel Dashboard → Your Project → Analytics
   - Monitor performance and usage

## Troubleshooting

### Common Issues

1. **Database Connection Timeout**

   ```
   Solution: Increase maxDuration in vercel.json
   ```

2. **Prisma Client Not Found**

   ```
   Solution: Ensure prisma generate runs in vercel-build
   ```

3. **Environment Variables Not Set**

   ```
   Solution: Check Vercel dashboard environment variables
   ```

4. **CORS Issues**
   ```
   Solution: Set CORS_ORIGIN environment variable
   ```

### Debug Mode

Add to environment variables for debugging:

```env
DEBUG=1
PRISMA_DEBUG=1
```

## Security Checklist

✅ **Environment Variables**

- All secrets in Vercel environment variables
- No sensitive data in code

✅ **Database Security**

- SSL/TLS enabled (sslmode=require)
- Strong database credentials
- IP restrictions if possible

✅ **API Security**

- JWT secret is strong and secure
- CORS properly configured
- Rate limiting implemented (if needed)

## Performance Optimization

1. **Function Configuration**

   - Adjust maxDuration for heavy operations
   - Use appropriate memory allocation

2. **Database Connections**

   - Prisma handles connection pooling
   - Use connection pooling for high traffic

3. **Caching**
   - Implement Redis for session storage (if needed)
   - Use Vercel Edge Network benefits

## Cost Considerations

**Vercel Pricing:**

- Hobby: Free (Generous limits for personal projects)
- Pro: $20/month (Commercial use, better limits)
- Enterprise: Custom pricing

**Key Limits (Hobby Plan):**

- 100 deployments per day
- 10 second max execution time
- 1024 MB max memory

Your current application should work well within these limits for most use cases.
