# 🚀 Production-Ready Checklist

## Critical Setup Required for Production

This checklist ensures your application is **secure, scalable, and production-ready**.

---

## 🔴 CRITICAL - Must Do Before Production

### 1. ✅ Generate Secure JWT Secrets

**NEVER use default secrets in production!**

```bash
# Generate JWT_SECRET (minimum 32 characters)
openssl rand -hex 32

# Generate JWT_REFRESH_SECRET (minimum 32 characters)
openssl rand -hex 32
```

Add to your `.env`:
```env
JWT_SECRET=<your-generated-secret-here>
JWT_REFRESH_SECRET=<your-different-generated-secret-here>
```

**Why Critical:** Default secrets can be exploited. Anyone with the secret can forge authentication tokens.

---

### 2. ✅ Set NODE_ENV to Production

```env
NODE_ENV=production
```

**What this does:**
- Disables verbose error messages (prevents info leaks)
- Optimizes performance
- Enables production caching
- Disables development tools

---

### 3. ✅ Configure Production Database

**Don't use localhost in production!**

Use managed database service:

**AWS RDS (Recommended):**
```env
DATABASE_URL=postgresql://username:password@your-db.region.rds.amazonaws.com:5432/dbname
```

**Heroku Postgres:**
```env
DATABASE_URL=<provided-by-heroku>
```

**Google Cloud SQL:**
```env
DATABASE_URL=postgresql://username:password@/dbname?host=/cloudsql/project:region:instance
```

**Supabase:**
```env
DATABASE_URL=postgresql://postgres:password@db.region.supabase.co:5432/postgres
```

**Why Critical:** Production needs reliable, backed-up, scalable database.

---

### 4. ✅ Set Correct CORS Origins

**Block unauthorized domains!**

```env
# Replace with your actual frontend domains
CORS_ORIGINS=https://yourapp.com,https://www.yourapp.com,https://app.yourapp.com
```

**iOS/Android apps (if applicable):**
```env
CORS_ORIGINS=https://yourapp.com,app://yourapp.com
```

**Why Critical:** Prevents unauthorized websites from accessing your API.

---

### 5. ✅ Configure Production Email

**Choose an email provider:**

**Option A: SendGrid (Recommended for production)**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=<your-sendgrid-api-key>
SMTP_FROM=noreply@yourapp.com
```

**Option B: AWS SES**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-ses-username>
SMTP_PASSWORD=<your-ses-password>
SMTP_FROM=noreply@yourapp.com
```

**Option C: Mailgun**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASSWORD=<your-mailgun-password>
SMTP_FROM=noreply@yourapp.com
```

**Why Critical:** Gmail has sending limits. Production apps need reliable email delivery.

---

### 6. ✅ Set Up Error Tracking (Sentry)

1. **Sign up at https://sentry.io** (free tier available)
2. **Create a new project** (choose Node.js)
3. **Copy your DSN**
4. **Add to `.env`:**

```env
SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/123456
```

**Why Critical:** Know when errors happen in production before users complain.

---

### 7. ✅ Configure Production Redis

**Use managed Redis service:**

**AWS ElastiCache:**
```env
REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379
```

**Redis Cloud:**
```env
REDIS_URL=redis://username:password@redis-12345.cloud.redislabs.com:12345
```

**Upstash (Serverless Redis):**
```env
REDIS_URL=rediss://default:password@region.upstash.io:6379
```

**Why Critical:** In-memory storage doesn't persist across restarts. Production needs reliable caching.

---

### 8. ✅ Set Frontend URL

```env
FRONTEND_URL=https://yourapp.com
```

**Why Critical:** Used for email links (password reset, verification). Must point to production domain.

---

### 9. ✅ Run Database Migrations

**Never use db:push in production!**

```bash
# Deploy migrations (production-safe)
npm run db:migrate:deploy
```

**NOT this:**
```bash
npm run db:push  # ❌ Development only!
```

**Why Critical:** `db:push` can cause data loss. Migrations are reversible and trackable.

---

### 10. ✅ Enable HTTPS/SSL

**Your API must be served over HTTPS in production.**

**Most deployment platforms handle this automatically:**
- ✅ Vercel
- ✅ Railway
- ✅ Render
- ✅ Fly.io
- ✅ AWS (with ALB)
- ✅ Google Cloud (with Load Balancer)

**If self-hosting, use:**
- Let's Encrypt (free SSL)
- Cloudflare (free SSL + CDN)
- Nginx with SSL certificate

**Why Critical:** HTTP is insecure. JWT tokens can be intercepted.

---

## 🟡 IMPORTANT - Highly Recommended

### 11. ✅ Adjust Rate Limits for Production

```env
# Increase for production traffic
RATE_LIMIT_MAX=1000          # 1000 requests per window
RATE_LIMIT_WINDOW=60000      # 1 minute (in milliseconds)
```

**Consider different limits for different endpoints:**
- Login: 5 attempts per 15 minutes
- API calls: 1000 per minute
- File uploads: 10 per hour

**Why Important:** Prevents abuse and DDoS attacks.

---

### 12. ✅ Set Up Database Backups

**Automated backups are critical!**

**AWS RDS:**
- Enable automated backups (retention: 7-30 days)
- Enable point-in-time recovery

**Heroku Postgres:**
```bash
heroku pg:backups:schedule DATABASE_URL --at '02:00 America/Los_Angeles'
```

**Google Cloud SQL:**
- Enable automated backups
- Set backup window during low traffic

**Why Important:** Protect against data loss, corruption, or disasters.

---

### 13. ✅ Configure Logging

**Set up structured logging:**

```typescript
// Add to src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

**Or use cloud logging:**
- AWS CloudWatch
- Google Cloud Logging
- Datadog
- LogDNA

**Why Important:** Debug production issues without SSH access.

---

### 14. ✅ Set Up Health Monitoring

**Use uptime monitoring service:**

**Free options:**
- UptimeRobot (https://uptimerobot.com)
- Pingdom (https://pingdom.com)
- Better Uptime (https://betteruptime.com)

**Monitor:**
```
GET https://yourapi.com/health
```

**Alert channels:**
- Email
- SMS
- Slack
- PagerDuty

**Why Important:** Know immediately when your API goes down.

---

### 15. ✅ Implement API Versioning

```typescript
// Instead of:
app.route("/api", apiRoutes);

// Use:
app.route("/api/v1", apiRoutes);
```

**Why Important:** Allows breaking changes without disrupting existing clients.

---

### 16. ✅ Add Request ID Logging

Already included! But ensure it's used everywhere:

```typescript
// In your logs
console.log(`[${requestId}] User login successful`);
```

**Why Important:** Trace requests across distributed systems.

---

### 17. ✅ Configure Session Expiry

```env
# Adjust based on your security needs
JWT_EXPIRES_IN=15m           # Access token: 15 minutes
JWT_REFRESH_EXPIRES_IN=7d    # Refresh token: 7 days
```

**For high-security apps:**
```env
JWT_EXPIRES_IN=5m            # 5 minutes
JWT_REFRESH_EXPIRES_IN=24h   # 1 day
```

**Why Important:** Balance security with user experience.

---

### 18. ✅ Database Connection Pooling

**Prisma handles this, but configure for production:**

```typescript
// In prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Production settings
  connection_limit = 10
  pool_timeout = 20
}
```

**Or in DATABASE_URL:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

**Why Important:** Prevents "too many connections" errors under load.

---

## 🟢 RECOMMENDED - Best Practices

### 19. ✅ Environment-Specific Configs

Create separate `.env` files:

```
.env.development
.env.staging
.env.production
```

**Load with:**
```bash
# Development
cp .env.development .env

# Staging
cp .env.staging .env

# Production
cp .env.production .env
```

---

### 20. ✅ Set Up CDN for Assets

If serving images, videos, or files:

**Options:**
- Cloudflare (free)
- AWS CloudFront
- Vercel Edge Network
- BunnyCDN

**Why Recommended:** Faster global access, reduced server load.

---

### 21. ✅ Implement Request Timeout

Already configured to 30 seconds. Adjust if needed:

```typescript
// In src/index.ts
app.use("*", timeout(30000)); // 30 seconds

// For long-running operations, increase:
app.use("/api/reports/*", timeout(300000)); // 5 minutes
```

---

### 22. ✅ Add Database Indexes

Review your Prisma schema and add indexes:

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  
  @@index([email])          // Fast email lookups
  @@index([createdAt])      // Fast sorting
  @@index([role, verified]) // Composite index
}
```

**Why Recommended:** Dramatically improves query performance.

---

### 23. ✅ Implement Graceful Degradation

**Already included!** But test these scenarios:

- Redis down → API still works (without cache)
- Email down → API still works (logs error)
- Database slow → Request times out gracefully

---

### 24. ✅ Security Headers Validation

Already configured with `secure-headers`, but verify:

```bash
curl -I https://yourapi.com
```

Should see:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

### 25. ✅ Password Policy

Already enforced in validation:
- ✅ Minimum 8 characters
- ✅ Uppercase letter
- ✅ Lowercase letter
- ✅ Number

**For higher security, add:**
- Special character requirement
- Password history (prevent reuse)
- Expiration policy

---

### 26. ✅ API Documentation

**Consider adding Swagger/OpenAPI:**

```bash
npm install @hono/swagger-ui
```

```typescript
import { swaggerUI } from '@hono/swagger-ui';

app.get('/docs', swaggerUI({ url: '/api/openapi.json' }));
```

**Why Recommended:** Makes API easier for frontend developers.

---

### 27. ✅ Implement Audit Logging

Already included in Activity model! Ensure you log:
- ✅ User registration
- ✅ Login/logout
- ✅ Password changes
- ✅ Data modifications
- ✅ Permission changes

---

### 28. ✅ Set Up Staging Environment

**Test everything before production!**

```
Development → Staging → Production
```

**Staging should:**
- Use production-like database
- Use production-like infrastructure
- Use production environment variables
- NOT use production data (use anonymized)

---

### 29. ✅ Container Registry

If using Docker:

**Push images to registry:**
- Docker Hub
- AWS ECR
- Google Container Registry
- GitHub Container Registry

```bash
docker build -t yourapp/backend:latest .
docker push yourapp/backend:latest
```

---

### 30. ✅ Performance Testing

**Load test your API:**

**Tools:**
- k6 (https://k6.io)
- Apache JMeter
- Artillery

**Test scenarios:**
- 100 concurrent users
- 1000 requests per second
- Sustained load for 10 minutes

---

## 📋 Pre-Launch Checklist

### Environment Variables ✅
- [ ] `NODE_ENV=production`
- [ ] Strong `JWT_SECRET` (32+ chars)
- [ ] Strong `JWT_REFRESH_SECRET` (32+ chars)
- [ ] Production `DATABASE_URL`
- [ ] Production `REDIS_URL`
- [ ] Correct `CORS_ORIGINS`
- [ ] Production email configured
- [ ] `SENTRY_DSN` set
- [ ] Correct `FRONTEND_URL`

### Database ✅
- [ ] Migrations deployed (`npm run db:migrate:deploy`)
- [ ] Backups configured
- [ ] Connection pooling configured
- [ ] Indexes added for performance
- [ ] No test/seed data in production

### Security ✅
- [ ] HTTPS/SSL enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection
- [ ] CSRF protection (if needed)

### Monitoring ✅
- [ ] Sentry error tracking active
- [ ] Uptime monitoring configured
- [ ] Health checks working
- [ ] Logging configured
- [ ] Alerts set up

### Infrastructure ✅
- [ ] Auto-scaling configured (if applicable)
- [ ] Load balancer configured (if applicable)
- [ ] CDN configured (if serving assets)
- [ ] Database replicas (for high availability)
- [ ] Redis cluster (for high availability)

### Performance ✅
- [ ] Response compression enabled
- [ ] Caching strategy implemented
- [ ] Database queries optimized
- [ ] Connection pooling configured
- [ ] Request timeouts set

### Testing ✅
- [ ] All tests passing
- [ ] Load testing completed
- [ ] Security testing done
- [ ] Staging environment tested
- [ ] Rollback plan prepared

### Documentation ✅
- [ ] API documentation available
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created
- [ ] Team trained on production access

---

## 🚨 Common Production Mistakes to Avoid

### ❌ Don't:
1. Use default JWT secrets
2. Expose error stack traces
3. Use `db:push` in production
4. Skip database backups
5. Ignore monitoring
6. Use development email in production
7. Allow unlimited rate limits
8. Skip HTTPS
9. Use weak passwords
10. Deploy without testing

### ✅ Do:
1. Generate strong secrets
2. Sanitize error messages
3. Use migrations
4. Automate backups
5. Set up alerts
6. Use production email service
7. Implement rate limiting
8. Enforce HTTPS
9. Require strong passwords
10. Test in staging first

---

## 🔧 Quick Production Setup Script

```bash
#!/bin/bash
# production-setup.sh

echo "🚀 Production Setup Checklist"
echo ""

# Check NODE_ENV
if [ "$NODE_ENV" != "production" ]; then
    echo "❌ NODE_ENV is not set to production"
    exit 1
fi

# Check JWT secrets
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "❌ JWT_SECRET is too short (minimum 32 characters)"
    exit 1
fi

if [ ${#JWT_REFRESH_SECRET} -lt 32 ]; then
    echo "❌ JWT_REFRESH_SECRET is too short (minimum 32 characters)"
    exit 1
fi

# Check database
if [[ $DATABASE_URL == *"localhost"* ]]; then
    echo "⚠️  WARNING: DATABASE_URL points to localhost"
fi

# Check CORS
if [[ $CORS_ORIGINS == *"localhost"* ]]; then
    echo "⚠️  WARNING: CORS_ORIGINS includes localhost"
fi

# Check Sentry
if [ -z "$SENTRY_DSN" ]; then
    echo "⚠️  WARNING: SENTRY_DSN not configured"
fi

# Check email
if [ -z "$SMTP_HOST" ]; then
    echo "⚠️  WARNING: Email not configured"
fi

echo ""
echo "✅ Production setup checks completed"
```

---

## 📚 Deployment Platforms

### Railway (Easiest)
```bash
railway login
railway init
railway up
```

### Render (Free Tier Available)
1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically

### Fly.io (Global Edge)
```bash
fly launch
fly deploy
```

### Vercel (Serverless)
```bash
vercel --prod
```

### AWS (Full Control)
- EC2 + RDS + ElastiCache
- ECS with Fargate
- Elastic Beanstalk

### Google Cloud
- Cloud Run
- App Engine
- Compute Engine + Cloud SQL

---

## ✅ Final Production Verification

After deployment, verify:

```bash
# 1. Health check
curl https://yourapi.com/health

# 2. Authentication
curl -X POST https://yourapi.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 3. Protected endpoint
curl https://yourapi.com/api/auth/me \
  -H "Authorization: Bearer <token>"

# 4. Error tracking (check Sentry dashboard)

# 5. Email (test password reset)

# 6. Performance (response time < 200ms)
```

---

## 🎉 You're Production Ready When:

✅ All critical items completed  
✅ Staging environment tested  
✅ Backups configured  
✅ Monitoring active  
✅ Team knows how to access logs  
✅ Rollback plan prepared  
✅ Load testing passed  
✅ Security audit done  

---

## 📞 Production Support

### Emergency Checklist
1. Check Sentry for errors
2. Check uptime monitor
3. Check database connections
4. Check Redis status
5. Review recent deployments
6. Check rate limit logs
7. Verify SSL certificate

### Useful Commands
```bash
# Check database connection
npx prisma db pull

# View logs (Docker)
docker-compose logs -f api

# Check Redis
redis-cli ping

# Database backup
pg_dump $DATABASE_URL > backup.sql

# Restart service
docker-compose restart api
```

---

**Remember: Production is not the time to learn. Test everything in staging first!** 🚀

Good luck! 🍀
