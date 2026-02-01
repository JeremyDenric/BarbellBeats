# Getting Started

## Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/barbellbeats.git
cd barbellbeats
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 3. Configure Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your AWS and Spotify credentials
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Edit .env with your API endpoints
```

### 4. Deploy Backend (Local Development)

```bash
cd backend

# Install serverless globally if you haven't
npm install -g serverless

# Deploy to AWS
serverless deploy --stage dev

# Note the API URLs from the output
```

### 5. Run Frontend

```bash
cd frontend
expo start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code for physical device
```

## Development Workflow

### Backend Development

```bash
cd backend

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Deploy changes
npm run deploy
```

### Frontend Development

```bash
cd frontend

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run tests
npm test
```

## Project Structure

```
barbellbeats/
├── backend/              # AWS Lambda functions
│   ├── src/
│   │   ├── functions/   # Lambda handlers
│   │   ├── lib/         # Shared utilities
│   │   └── types/       # TypeScript types
│   ├── tests/           # Backend tests
│   └── serverless.yml   # Infrastructure config
│
├── frontend/            # React Native app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── screens/     # App screens
│   │   ├── navigation/  # Navigation config
│   │   ├── services/    # API clients
│   │   ├── hooks/       # Custom hooks
│   │   └── store/       # State management
│   └── App.tsx          # Root component
│
├── shared/              # Shared TypeScript types
│   └── src/types/       # Common types
│
└── docs/                # Documentation
```

## Key Concepts

### 1. Ranking System

Users earn **influence points** based on:
- Song quality (40%)
- Voting engagement (30%)
- Community reception (25%)
- Special activities (5%)

Ranks: Bronze → Silver → Gold → Platinum → Diamond → Legend

### 2. Weighted Voting

Higher-ranked users have more voting power:
- Bronze: 1.0x
- Silver: 1.5x
- Gold: 2.0x
- Platinum: 3.0x
- Diamond: 4.0x
- Legend: 5.0x

### 3. Real-time Updates

WebSocket connections provide instant updates:
- Vote changes
- Playlist reordering
- New songs added
- Rank level-ups
- Achievements unlocked

## Common Tasks

### Add a New API Endpoint

1. Create Lambda function in `backend/src/functions/`
2. Add function to `serverless.yml`
3. Add API method to `frontend/src/services/api.ts`
4. Deploy backend: `npm run deploy`

### Add a New Screen

1. Create screen in `frontend/src/screens/`
2. Add route to navigation
3. Create any needed components
4. Test on device/emulator

### Modify Database Schema

1. Update table definition in `serverless.yml`
2. Update TypeScript types in `shared/src/types/`
3. Update DynamoDB queries in `backend/src/lib/db/`
4. Deploy (will update tables)

## Testing

### Backend Tests

```bash
cd backend
npm test

# With coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing

Use Postman or curl to test API endpoints:

```bash
# Signup
curl -X POST https://your-api.amazonaws.com/dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "displayName": "Test User"
  }'

# Login
curl -X POST https://your-api.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### Backend Issues

**Problem**: Lambda timeout
- **Solution**: Increase timeout in `serverless.yml`

**Problem**: DynamoDB not found
- **Solution**: Ensure tables are created (check AWS Console)

**Problem**: Permission denied
- **Solution**: Check IAM role has correct permissions

### Frontend Issues

**Problem**: Cannot connect to API
- **Solution**: Check `.env` has correct API URL

**Problem**: Metro bundler error
- **Solution**: Clear cache: `expo start -c`

**Problem**: iOS simulator not showing
- **Solution**: Ensure Xcode is installed

### AWS Issues

**Problem**: Deployment fails
- **Solution**: Check AWS credentials: `aws configure list`

**Problem**: Rate limiting
- **Solution**: Request limit increase in AWS Console

## Next Steps

1. Read [Architecture Documentation](./ARCHITECTURE.md)
2. Review [API Reference](./API_REFERENCE.md)
3. Check out [Deployment Guide](./DEPLOYMENT.md)
4. Explore the code and start building!

## Getting Help

- Check [GitHub Issues](https://github.com/yourusername/barbellbeats/issues)
- Review [Documentation](./README.md)
- Ask questions in Discussions

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
