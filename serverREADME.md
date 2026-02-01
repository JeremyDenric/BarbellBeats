# Hono Backend - Modern TypeScript API

A modern, production-ready backend built with [Hono](https://hono.dev/) - an ultra-fast web framework for edge and Node.js.

## 🚀 Features

- **⚡️ Blazing Fast** - Hono is one of the fastest web frameworks available
- **🔒 Security First** - Built-in security headers, CORS, rate limiting
- **📝 Type-Safe** - Full TypeScript support with Zod validation
- **🎯 Modern Architecture** - Clean separation of concerns with routes, services, and middleware
- **🔐 Authentication** - JWT-based auth with refresh tokens
- **✅ Validation** - Request validation with Zod schemas
- **🛡️ Error Handling** - Consistent error responses and error boundaries
- **📊 Rate Limiting** - Built-in rate limiting to prevent abuse
- **🔍 Request Tracing** - Unique request IDs for debugging
- **📖 Well Documented** - Comprehensive inline documentation

## 📦 Installation

```bash
cd server
npm install
```

## 🔧 Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the environment variables in `.env`:
   - **IMPORTANT**: Change `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
   - Generate secure secrets with: `openssl rand -hex 32`
   - Configure CORS origins for your frontend
   - Adjust rate limiting as needed

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reloading.

### Production Mode
```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Checks

#### GET /health
Health check endpoint
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "memory": {...}
}
```

### Authentication

#### POST /api/auth/register
Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

#### POST /api/auth/login
Login with email and password
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### POST /api/auth/refresh
Refresh access token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

#### GET /api/auth/me
Get current user (requires authentication)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer your-access-token"
```

### Users

#### GET /api/users
List all users (admin only)
```bash
curl http://localhost:3000/api/users?page=1&limit=20 \
  -H "Authorization: Bearer your-access-token"
```

#### GET /api/users/:id
Get user by ID
```bash
curl http://localhost:3000/api/users/user-123 \
  -H "Authorization: Bearer your-access-token"
```

#### PATCH /api/users/:id
Update user profile
```bash
curl -X PATCH http://localhost:3000/api/users/user-123 \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "bio": "Software developer"
  }'
```

### Examples

#### GET /api/examples
List examples with pagination
```bash
curl http://localhost:3000/api/examples?page=1&limit=20
```

#### POST /api/examples
Create a new example
```bash
curl -X POST http://localhost:3000/api/examples \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Example",
    "description": "This is an example",
    "tags": ["test", "demo"]
  }'
```

#### GET /api/examples/search
Search examples
```bash
curl "http://localhost:3000/api/examples/search?q=test&sortBy=name"
```

## 🏗️ Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment configuration with Zod validation
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication middleware
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── rateLimiter.ts     # Rate limiting middleware
│   │   ├── requestId.ts       # Request ID middleware
│   │   └── validate.ts        # Request validation middleware
│   ├── routes/
│   │   ├── index.ts           # Route aggregation
│   │   ├── auth.routes.ts     # Authentication routes
│   │   ├── user.routes.ts     # User management routes
│   │   └── example.routes.ts  # Example routes
│   ├── services/
│   │   ├── auth.service.ts    # Authentication business logic
│   │   └── user.service.ts    # User management business logic
│   ├── utils/
│   │   ├── crypto.ts          # Password hashing utilities
│   │   └── errors.ts          # Custom error classes
│   └── index.ts               # Application entry point
├── .env.example               # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Security Features

- **Secure Headers** - Automatically added with `secure-headers` middleware
- **CORS Protection** - Configurable CORS with credentials support
- **Rate Limiting** - Prevents abuse with configurable limits
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Using scrypt with salt
- **Request Validation** - Zod schema validation for all inputs
- **Error Sanitization** - Sensitive error details hidden in production

## 🎨 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {...}
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 🔧 Middleware

### Custom Middleware Order
1. **Request ID** - Adds unique ID to each request
2. **Logger** - Logs all requests
3. **Security Headers** - Adds security headers
4. **CORS** - Handles cross-origin requests
5. **Compression** - Compresses responses
6. **Timeout** - Prevents long-running requests
7. **Rate Limiter** - Limits request rate

## 🚀 Deployment

### Environment Variables
Make sure to set these in production:
- `NODE_ENV=production`
- `JWT_SECRET` - Strong random secret
- `JWT_REFRESH_SECRET` - Strong random secret
- `DATABASE_URL` - Your database connection string
- `CORS_ORIGINS` - Your frontend URLs

### Docker (Optional)
Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t hono-backend .
docker run -p 3000:3000 --env-file .env hono-backend
```

## 📝 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🛠️ Development

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Adding a New Route

1. Create route file in `src/routes/`:
```typescript
import { Hono } from "hono";

export const myRoutes = new Hono();

myRoutes.get("/", async (c) => {
  return c.json({ message: "Hello!" });
});
```

2. Register in `src/routes/index.ts`:
```typescript
import { myRoutes } from "./my.routes";

apiRoutes.route("/my-route", myRoutes);
```

### Adding Database Support

This backend uses in-memory mock data by default. To add a real database:

1. Install Prisma (recommended):
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

2. Define your schema in `prisma/schema.prisma`

3. Generate Prisma Client:
```bash
npx prisma generate
```

4. Replace mock data in services with Prisma queries

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT

## 🙏 Acknowledgments

- [Hono](https://hono.dev/) - The fast web framework
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- Built with ❤️ for modern TypeScript applications
