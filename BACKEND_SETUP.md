# 🚀 Backend Setup Guide

Your modern Hono backend is ready! Follow these steps to get started.

## 📋 Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- (Optional) Docker for containerized deployment

## 🔧 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

**Important**: Edit `.env` and update these values:

```env
# Generate secure secrets (minimum 32 characters)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Add your frontend URL
CORS_ORIGINS=http://localhost:8081,http://localhost:19000,http://localhost:19006
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000` 🎉

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

## 📱 Connect to React Native App

### 1. Copy API Client

The API client is already created at `/api/api-client.ts`. Copy it to your React Native project:

```bash
cp api/api-client.ts /path/to/your/app/src/services/api-client.ts
```

### 2. Install Dependencies in React Native

```bash
npm install @react-native-async-storage/async-storage
```

### 3. Use in Your App

```typescript
import { apiClient } from './services/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';

// Login example
function LoginScreen() {
  const loginMutation = useMutation({
    mutationFn: (credentials) => apiClient.login(credentials),
    onSuccess: (data) => {
      if (data.success) {
        // Navigate to home
        navigation.navigate('Home');
      }
    },
  });

  const handleLogin = () => {
    loginMutation.mutate({
      email: 'test@example.com',
      password: 'TestPass123',
    });
  };

  return (
    <Button 
      onPress={handleLogin}
      loading={loginMutation.isPending}
    >
      Login
    </Button>
  );
}
```

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
cd server

# Build the image
docker build -t hono-backend .

# Run the container
docker run -p 3000:3000 --env-file .env hono-backend
```

### Or use Docker Compose

```bash
docker-compose up -d
```

## 📊 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript for production
- `npm start` - Run production build
- `npm test` - Run test suite
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random values
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGINS`
- [ ] Set up HTTPS/SSL
- [ ] Enable rate limiting (already configured)
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure database connection (if using)
- [ ] Review and adjust rate limits
- [ ] Set up proper logging

## 🎯 Next Steps

### Add Database Support

1. **Install Prisma** (recommended):
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

2. **Define your schema** in `prisma/schema.prisma`:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

3. **Run migrations**:
```bash
npx prisma migrate dev --name init
```

4. **Update services** to use Prisma instead of mock data

### Add Redis for Rate Limiting

```bash
npm install redis
```

Update `rateLimiter.ts` to use Redis instead of in-memory storage.

### Add Email Service

```bash
npm install nodemailer
```

Implement email sending in `auth.service.ts` for password reset.

## 📚 API Documentation

Full API documentation is available in `/server/README.md`

### Key Endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `GET /api/examples` - List examples
- `POST /api/examples` - Create example
- `GET /api/examples/search` - Search examples

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3001
```

### CORS Issues
Make sure your React Native dev server URL is in `CORS_ORIGINS`:
```env
CORS_ORIGINS=http://localhost:8081,http://192.168.1.100:8081
```

### Token Issues
- Tokens are stored in AsyncStorage
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- The API client handles automatic token refresh

## 📞 Support

Need help? Check out:
- [Hono Documentation](https://hono.dev/)
- [Zod Documentation](https://zod.dev/)
- Server logs in console
- Error responses include detailed information in dev mode

## 🎉 You're All Set!

Your modern backend is ready to use. Start building amazing features! 🚀
