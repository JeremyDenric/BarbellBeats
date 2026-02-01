# Security Architecture

## Overview

This document outlines the security model, threat mitigation strategies, and best practices for BarbellBeats.

**Security Principles:**
1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal permissions by default
3. **Zero Trust**: Verify every request
4. **Fail Secure**: Deny by default on errors
5. **Audit Everything**: Comprehensive logging

---

## Threat Model

### Assets to Protect
1. **User Data**: Email, passwords, personal info, voting history
2. **Gym Data**: Locations, member lists, playlist rankings
3. **Song Data**: Votes, rankings, tier status
4. **Authentication Tokens**: JWTs, refresh tokens
5. **API Keys**: Spotify credentials, AWS secrets

### Threat Actors
1. **Malicious Users**: Spam votes, game rankings, harassment
2. **Bots/Scripts**: Automated voting, account creation
3. **Competitors**: Scraping data, DDoS attacks
4. **Insiders**: Rogue gym staff, leaked credentials

### Attack Vectors
1. **Authentication Bypass**: Stolen tokens, session hijacking
2. **Authorization Bypass**: Accessing other users' data
3. **Injection Attacks**: SQL injection, XSS, command injection
4. **DoS/DDoS**: Overwhelming API, vote spamming
5. **Data Leakage**: Enumeration, timing attacks
6. **Man-in-the-Middle**: Intercepting API calls

---

## Authentication & Authorization

### Authentication Flow

```
1. User signs up
   ↓
2. Cognito creates user pool entry
   ↓
3. Email verification (optional but recommended)
   ↓
4. User logs in with email + password
   ↓
5. Cognito returns:
   - Access Token (JWT, 1 hour expiry)
   - ID Token (JWT, 1 hour expiry)
   - Refresh Token (30 days expiry)
   ↓
6. Client stores tokens securely
   ↓
7. Client includes Access Token in Authorization header
   ↓
8. API Gateway validates JWT signature
   ↓
9. Lambda extracts userId from token
   ↓
10. Lambda authorizes action (gym membership, etc.)
```

### JWT Structure

**Access Token Claims:**
```json
{
  "sub": "user-uuid",
  "cognito:username": "john_doe",
  "email": "john@example.com",
  "email_verified": true,
  "iat": 1642608000,
  "exp": 1642611600,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/...",
  "aud": "client-id"
}
```

**Security Controls:**
- ✅ Tokens signed with RS256 (asymmetric)
- ✅ Short expiration (1 hour)
- ✅ Signature verified by API Gateway
- ✅ Cannot be forged without private key
- ✅ Refresh tokens rotated on use

### Authorization Checks

**Gym Membership Authorization:**
```typescript
async function authorizeGymAccess(userId: string, gymId: string): Promise<boolean> {
  const membership = await getUserGymRank(userId, gymId);
  if (!membership) {
    throw new Error('Unauthorized: Not a member of this gym');
  }
  return true;
}
```

**Song Ownership Authorization:**
```typescript
async function authorizeSongAction(userId: string, songId: string): Promise<boolean> {
  const song = await getSong(songId);
  if (song.addedBy !== userId) {
    throw new Error('Unauthorized: Not the song owner');
  }
  return true;
}
```

**Rank-Based Authorization:**
```typescript
function authorizeRankAction(userRank: UserRank, requiredRank: UserRank): boolean {
  const rankOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
  if (rankOrder[userRank] < rankOrder[requiredRank]) {
    throw new Error(`Unauthorized: Requires ${requiredRank} rank`);
  }
  return true;
}
```

---

## Rate Limiting

### Per-User Limits

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| `/auth/signup` | 5 requests | 1 hour | IP address |
| `/auth/login` | 10 requests | 15 minutes | Email or IP |
| `/songs/{id}/vote` | 30 requests | 1 minute | userId |
| `/songs` (POST) | 10 requests | 1 hour | userId |
| `/gyms/{id}/join` | 5 requests | 1 hour | userId |
| `/websocket/connect` | 10 requests | 1 minute | userId |
| General API | 100 requests | 1 minute | userId |

### Implementation

**DynamoDB-Based Rate Limiting:**
```typescript
interface RateLimitRecord {
  key: string;              // "endpoint:identifier"
  count: number;
  windowStart: number;
  expiresAt: number;        // TTL for auto-cleanup
}

// Check before processing request
const limit = await checkRateLimit(userId, config);
if (!limit.allowed) {
  return {
    statusCode: 429,
    body: JSON.stringify({
      error: 'Too Many Requests',
      retryAfter: limit.resetAt
    })
  };
}
```

### Response Headers
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1642611600
Retry-After: 60
```

---

## Input Validation

### Validation Strategy

**Layer 1: Schema Validation (Zod)**
```typescript
const AddSongSchema = z.object({
  gymId: z.string().uuid(),
  spotifyId: z.string().regex(/^[a-zA-Z0-9]{22}$/),
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
});
```

**Layer 2: Sanitization**
```typescript
function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')     // Remove HTML tags
    .replace(/[{}]/g, '')     // Remove template syntax
    .replace(/[$;]/g, '')     // Remove command characters
    .trim();
}
```

**Layer 3: Business Logic Validation**
```typescript
// Check if user has reached weekly song limit
const stats = await getUserStats(userId, gymId);
if (stats.songsAddedThisWeek >= stats.weeklyLimit) {
  throw new Error('Weekly song limit reached');
}
```

### Prevented Attacks

| Attack Type | Prevention |
|-------------|------------|
| **SQL Injection** | NoSQL database (DynamoDB), parameterized queries |
| **XSS** | Sanitize input, escape output, CSP headers |
| **Command Injection** | No shell execution, validate inputs |
| **Path Traversal** | Validate S3 keys, no user-controlled paths |
| **XXE** | No XML parsing |
| **SSRF** | Whitelist external URLs (Spotify API only) |

### File Upload Security

**Profile Photos:**
```typescript
// Validate before upload to S3
if (!validateFileSize(file.size, 5)) {  // 5 MB max
  throw new Error('File too large');
}

if (!['image/jpeg', 'image/png'].includes(file.type)) {
  throw new Error('Invalid file type');
}

// Generate safe S3 key
const key = `profile-photos/${userId}/${uuidv4()}.jpg`;

// Upload with restrictive ACL
await s3.putObject({
  Bucket: BUCKET_NAME,
  Key: key,
  Body: file.buffer,
  ContentType: file.type,
  ACL: 'private',  // Not public by default
  ServerSideEncryption: 'AES256',
});
```

---

## WebSocket Security

### Connection Authorization

```typescript
// On connect
const token = event.queryStringParameters.token;

// Verify JWT
const decoded = await verifyJWT(token);
const userId = decoded.sub;

// Check if user can connect
const connectionLimit = await checkConnectionLimit(userId);
if (!connectionLimit.allowed) {
  return { statusCode: 429, body: 'Too many connections' };
}

// Store connection
await storeConnection({
  connectionId: event.requestContext.connectionId,
  userId,
  gymId: event.queryStringParameters.gymId,
  connectedAt: Date.now(),
  ttl: Date.now() + 3600 * 1000, // 1 hour
});
```

### Connection Limits
- **Max connections per user**: 3 concurrent
- **Max connections per gym**: 1000 concurrent
- **Connection timeout**: 1 hour idle
- **Reconnect cooldown**: 5 seconds

### Message Validation

```typescript
// Validate all incoming messages
const message = JSON.parse(event.body);
const validation = WebSocketMessageSchema.safeParse(message);

if (!validation.success) {
  await sendToConnection(connectionId, {
    error: 'Invalid message format',
    errors: validation.error.errors,
  });
  return;
}
```

### Auto-Disconnect Policy
```typescript
// Lambda triggered every 5 minutes
export async function cleanupStaleConnections() {
  const staleConnections = await getConnectionsOlderThan(60 * 60 * 1000); // 1 hour

  for (const conn of staleConnections) {
    await apiGateway.deleteConnection({
      ConnectionId: conn.connectionId,
    });
    await deleteConnectionRecord(conn.connectionId);
  }
}
```

---

## Data Protection

### Encryption

**At Rest:**
- ✅ DynamoDB: Encrypted with AWS-managed keys (AES-256)
- ✅ S3: Server-side encryption (SSE-S3)
- ✅ Secrets Manager: Encrypted by default
- ✅ CloudWatch Logs: Encrypted

**In Transit:**
- ✅ API Gateway: HTTPS/TLS 1.2+ only
- ✅ WebSocket: WSS (TLS) only
- ✅ DynamoDB: AWS SDK uses TLS
- ✅ S3: HTTPS only

### Sensitive Data Handling

**Passwords:**
```typescript
// NEVER store plaintext passwords
const hashedPassword = await bcrypt.hash(password, 10);

// Store in Cognito (hashed + salted)
await cognito.signUp({
  Username: email,
  Password: password,  // Cognito handles hashing
});
```

**Personal Information:**
```typescript
// Minimal PII storage
interface User {
  userId: string;
  email: string;        // Required for auth
  username: string;     // Public
  displayName: string;  // Public
  // NO: SSN, phone, address, DOB
}
```

**Tokens:**
```typescript
// NEVER log tokens
logger.info('User logged in', {
  userId,
  // token: accessToken  ❌ NEVER
});

// Store refresh tokens hashed
const hashedToken = crypto
  .createHash('sha256')
  .update(refreshToken)
  .digest('hex');
```

### Data Retention

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| User accounts | Until deleted by user | Hard delete all records |
| Votes | 90 days | DynamoDB TTL |
| Song history | 1 year | DynamoDB TTL |
| Logs | 30 days | CloudWatch retention policy |
| Backups | 35 days | PITR window |

---

## Secrets Management

### AWS Secrets Manager

**Stored Secrets:**
```typescript
{
  "spotify/client-secret": "abc123...",
  "jwt/signing-key": "xyz789...",
  "database/admin-password": "secure..."
}
```

**Access Pattern:**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

export async function getSecret(secretName: string): Promise<string> {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString!;
}

// Usage
const spotifySecret = await getSecret('spotify/client-secret');
```

**Rotation Policy:**
- Spotify client secret: Manual rotation quarterly
- JWT signing keys: Rotate annually
- Database passwords: Rotate every 90 days

### Environment Variables

**Allowed in Lambda:**
```typescript
process.env.TABLE_NAME = 'Songs'  // ✅ Non-sensitive config
process.env.REGION = 'us-east-1'  // ✅ Non-sensitive
process.env.LOG_LEVEL = 'info'    // ✅ Non-sensitive
```

**Forbidden in Lambda:**
```typescript
process.env.SPOTIFY_SECRET = '...'  // ❌ Use Secrets Manager
process.env.JWT_KEY = '...'         // ❌ Use Secrets Manager
process.env.API_KEY = '...'         // ❌ Use Secrets Manager
```

---

## Logging & Monitoring

### What to Log

**✅ DO LOG:**
- User actions (vote, add song, join gym)
- Authentication events (login, logout, failed attempts)
- Authorization failures
- Rate limit violations
- Errors and exceptions
- Performance metrics

**❌ DO NOT LOG:**
- Passwords (plaintext or hashed)
- JWT tokens
- Refresh tokens
- Credit card numbers
- Social Security Numbers
- Any PII beyond userId

### Structured Logging

```typescript
logger.info('User voted on song', {
  userId: 'uuid-123',
  gymId: 'uuid-456',
  songId: 'uuid-789',
  voteType: 1,
  timestamp: Date.now(),
  // NO sensitive data
});
```

### Security Alerts

**CloudWatch Alarms:**
- Failed login attempts > 10/minute
- Rate limit violations > 100/minute
- 5xx errors > 1%
- DynamoDB throttling events
- IAM unauthorized access attempts

**SNS Topics:**
```
security-critical → PagerDuty
security-warning → Email
cost-alert → Email + Slack
```

---

## Incident Response Plan

### Severity Levels

| Level | Definition | Response Time |
|-------|------------|---------------|
| **Critical** | Data breach, RCE, auth bypass | < 15 minutes |
| **High** | DoS, unauthorized access | < 1 hour |
| **Medium** | Information disclosure | < 4 hours |
| **Low** | Minor vulnerabilities | < 1 week |

### Response Steps

**1. Detection**
- CloudWatch alarms trigger
- User reports suspicious activity
- Security scan finds vulnerability

**2. Containment**
- Disable compromised API keys immediately
- Revoke affected JWTs via Cognito
- Block malicious IPs at WAF/API Gateway
- Isolate affected resources

**3. Investigation**
- Review CloudWatch Logs
- Check DynamoDB for anomalous patterns
- Analyze access logs (S3, CloudFront)
- Identify attack vector

**4. Eradication**
- Patch vulnerability
- Rotate compromised secrets
- Update security rules
- Deploy fixes

**5. Recovery**
- Restore from backups if needed
- Notify affected users
- Monitor for continued attacks
- Document lessons learned

**6. Post-Incident**
- Update security policies
- Improve monitoring/alerts
- Conduct security training
- Update this document

---

## Compliance & Best Practices

### OWASP Top 10 Mitigation

| Vulnerability | Mitigation |
|---------------|------------|
| **A01: Broken Access Control** | Authorization checks on every endpoint, principle of least privilege |
| **A02: Cryptographic Failures** | TLS everywhere, encrypted at rest, bcrypt for passwords |
| **A03: Injection** | Parameterized queries, input validation, NoSQL (no SQL injection) |
| **A04: Insecure Design** | Threat modeling, ADRs, security reviews |
| **A05: Security Misconfiguration** | IAM policies reviewed, no default credentials, security headers |
| **A06: Vulnerable Components** | Dependabot alerts, regular npm audit |
| **A07: Auth Failures** | Cognito managed auth, JWT validation, rate limiting |
| **A08: Software/Data Integrity** | Code signing, hash verification, SRI for CDN |
| **A09: Logging Failures** | Structured logging, CloudWatch alerts, no sensitive data logged |
| **A10: SSRF** | Whitelist external URLs, validate redirects |

### Security Headers

```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

---

## Security Checklist

### Pre-Deployment
- [ ] All secrets in Secrets Manager
- [ ] Rate limiting enabled on all endpoints
- [ ] Input validation with Zod schemas
- [ ] Authorization checks in every Lambda
- [ ] HTTPS/TLS only
- [ ] Security headers configured
- [ ] Logging enabled (CloudWatch)
- [ ] Monitoring alarms set up
- [ ] IAM policies follow least privilege
- [ ] No hardcoded credentials in code

### Regular Security Tasks
- [ ] Weekly: Review CloudWatch security logs
- [ ] Monthly: Run `npm audit` and patch vulnerabilities
- [ ] Quarterly: Rotate Spotify client secret
- [ ] Quarterly: Security audit of IAM policies
- [ ] Annually: Penetration testing
- [ ] Annually: Rotate JWT signing keys

---

## Contact

**Security Issues:** security@gymmusicshare.com
**Bug Bounty:** Coming soon

## Last Updated
2025-01-22
