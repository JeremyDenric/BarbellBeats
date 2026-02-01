# Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- Node.js 20+ installed
- Serverless Framework installed globally: `npm install -g serverless`
- Spotify Developer Account

## Backend Deployment

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1)
```

### 2. Set Environment Variables

Create `backend/.env` file:

```env
AWS_REGION=us-east-1
STAGE=dev
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
JWT_SECRET=your_secure_jwt_secret
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Deploy to AWS

**Development:**
```bash
npm run deploy
```

**Production:**
```bash
npm run deploy:prod
```

This will:
- Create DynamoDB tables
- Deploy Lambda functions
- Set up API Gateway (REST + WebSocket)
- Configure Cognito User Pool
- Create S3 buckets

### 5. Note Output Values

After deployment, save these values:

- API Gateway URL
- WebSocket URL
- Cognito User Pool ID
- Cognito Client ID

You'll need these for the frontend configuration.

## Frontend Deployment

### 1. Configure Environment

Create `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
EXPO_PUBLIC_WS_URL=wss://your-websocket-url.amazonaws.com/prod
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
SPOTIFY_CLIENT_ID=your_spotify_client_id
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Build and Deploy

**iOS:**
```bash
expo build:ios
```

**Android:**
```bash
expo build:android
```

**Web (optional):**
```bash
npm run web
```

## CI/CD with GitHub Actions

The repository includes GitHub Actions workflows:

### Backend Auto-Deploy

Automatically deploys on push to `main` branch.

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SPOTIFY_CLIENT_SECRET`

Configure in: Repository Settings → Secrets and variables → Actions

## Database Setup

After first deployment, you may want to seed initial data:

```bash
cd backend
npm run seed
```

This creates sample gyms and initial data for testing.

## Monitoring

### CloudWatch Dashboards

View logs and metrics:

```bash
serverless logs -f functionName -t
```

### DynamoDB Console

Check tables and data:
- AWS Console → DynamoDB → Tables

## Troubleshooting

### Lambda Cold Starts

If experiencing slow cold starts:
- Consider provisioned concurrency for critical functions
- Reduce bundle size with tree-shaking

### DynamoDB Throttling

If seeing throttling errors:
- Switch to provisioned capacity
- Enable auto-scaling

### CORS Issues

Ensure API Gateway has proper CORS headers configured in `serverless.yml`.

## Rollback

To rollback a deployment:

```bash
serverless rollback -t TIMESTAMP
```

## Cost Optimization

- Use DynamoDB on-demand billing for unpredictable workloads
- Set up CloudWatch billing alerts
- Review Lambda execution times and optimize

**Estimated Monthly Costs:**
- Development: ~$5-10
- Production (1K users): ~$20-50
- Production (10K users): ~$200-400

## Security Checklist

- [ ] Rotate AWS credentials regularly
- [ ] Enable MFA on AWS account
- [ ] Set up CloudTrail for audit logging
- [ ] Configure VPC for sensitive Lambdas (if needed)
- [ ] Enable encryption at rest for DynamoDB
- [ ] Set up AWS WAF rules for API Gateway
- [ ] Regularly update dependencies

## Support

For issues, check:
- CloudWatch Logs
- Serverless Dashboard
- AWS Support
