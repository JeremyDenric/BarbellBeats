# System Architecture

## Overview

BarbellBeats is a serverless, real-time music voting platform built on AWS. The architecture prioritizes scalability, low latency, and cost-efficiency.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│                                                             │
│  React Native App (iOS + Android)                          │
│  - Expo Framework                                          │
│  - React Navigation                                        │
│  - React Query (Server State)                             │
│  - Zustand (Local State)                                  │
│  - Socket.io Client (WebSocket)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/WSS
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      AWS CLOUD                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           Amazon CloudFront (CDN)                    │  │
│  │           - Global edge caching                      │  │
│  │           - DDoS protection                          │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────▼───────────────────────────┐  │
│  │         Amazon API Gateway                          │  │
│  │         - REST API (HTTP requests)                  │  │
│  │         - WebSocket API (real-time)                 │  │
│  │         - Request validation                        │  │
│  │         - Rate limiting                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────▼───────────────────────────┐  │
│  │         AWS Lambda Functions                        │  │
│  │         - Node.js 20.x                              │  │
│  │         - Stateless compute                         │  │
│  │         - Auto-scaling                              │  │
│  │                                                      │  │
│  │   Auth:                                             │  │
│  │   • signup.ts  • login.ts                          │  │
│  │                                                      │  │
│  │   Gyms:                                             │  │
│  │   • getNearbyGyms.ts  • getGymDetails.ts           │  │
│  │   • joinGym.ts                                      │  │
│  │                                                      │  │
│  │   Playlist:                                         │  │
│  │   • getPlaylist.ts  • addSong.ts  • voteSong.ts   │  │
│  │                                                      │  │
│  │   Ranks:                                            │  │
│  │   • getUserRank.ts  • getLeaderboard.ts            │  │
│  │                                                      │  │
│  │   WebSocket:                                        │  │
│  │   • connect.ts  • disconnect.ts  • broadcast.ts    │  │
│  │                                                      │  │
│  │   Scheduled:                                        │  │
│  │   • dailyRankUpdate.ts  • analyticsAggregation.ts │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────▼───────────────────────────┐  │
│  │         Amazon DynamoDB                             │  │
│  │         - NoSQL database                            │  │
│  │         - Pay-per-request billing                   │  │
│  │         - Single-table design                       │  │
│  │         - GSIs for access patterns                  │  │
│  │                                                      │  │
│  │   Tables:                                           │  │
│  │   • Users                                           │  │
│  │   • Gyms                                            │  │
│  │   • Songs                                           │  │
│  │   • Votes                                           │  │
│  │   • UserGymRanks                                    │  │
│  │   • PRLogs                                          │  │
│  │   • Achievements                                    │  │
│  │   • CrowdDJSessions                                 │  │
│  │   • WebSocketConnections                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Amazon Cognito                              │  │
│  │         - User authentication                       │  │
│  │         - JWT token management                      │  │
│  │         - Social login (Google, Apple)              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Amazon S3                                   │  │
│  │         - Profile photos                            │  │
│  │         - Gym images                                │  │
│  │         - Static assets                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Amazon EventBridge                          │  │
│  │         - Scheduled events (cron jobs)              │  │
│  │         - Daily rank calculations                   │  │
│  │         - Weekly analytics                          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Amazon SQS                                  │  │
│  │         - Async job processing                      │  │
│  │         - Achievement unlocks                       │  │
│  │         - Email notifications                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Amazon CloudWatch                           │  │
│  │         - Logging                                   │  │
│  │         - Metrics & Dashboards                      │  │
│  │         - Alarms                                    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐     │
│  │    Spotify API       │    │   Apple Music API    │     │
│  │    - Song search     │    │   - Song search      │     │
│  │    - Metadata        │    │   - Metadata         │     │
│  │    - Preview URLs    │    │   - Preview URLs     │     │
│  └──────────────────────┘    └──────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Vote on Song

### Step-by-Step Flow

1. **User Action**: User taps upvote button on song
   - Frontend sends POST request to `/songs/{songId}/vote`

2. **API Gateway**:
   - Validates JWT token via Cognito authorizer
   - Forwards request to `voteSong` Lambda

3. **Lambda Processing**:
   - Extracts user ID from JWT
   - Fetches song from DynamoDB
   - Fetches user's rank at gym
   - Calculates vote weight based on rank
   - Checks for existing vote
   - Updates song's weighted score
   - Saves/updates vote record
   - Updates user stats

4. **DynamoDB Stream**:
   - Song update triggers stream
   - Invokes `broadcast` Lambda

5. **WebSocket Broadcast**:
   - `broadcast` Lambda queries all active connections for gym
   - Sends vote update to all connected clients
   - Clients update UI in real-time

**Total Latency**: ~200ms

## Key Technical Decisions

### Why Serverless?

1. **Cost**: Pay only for usage (~$0.0045 per user/month)
2. **Scalability**: Auto-scales from 0 to millions
3. **Maintenance**: No server management
4. **Speed**: Fast iteration and deployment

### Why DynamoDB?

1. **Performance**: Single-digit millisecond latency
2. **Scalability**: Handles any scale automatically
3. **Cost**: Pay-per-request model
4. **Integration**: Native with Lambda

### Why WebSocket?

1. **Real-time**: Sub-100ms update propagation
2. **Efficiency**: Persistent connection, less overhead
3. **User Experience**: Instant feedback

### Why React Native?

1. **Cross-platform**: iOS + Android from one codebase
2. **Developer Experience**: Hot reload, large ecosystem
3. **Performance**: Near-native performance
4. **Community**: Huge community and libraries

## Security Architecture

### Authentication Flow

```
User → Frontend → API Gateway → Cognito → Lambda
                    ↓ (JWT)
              Validates token
                    ↓
              Authorizes request
```

### Data Protection

- **At Rest**: DynamoDB encryption enabled
- **In Transit**: TLS 1.2+ for all connections
- **Authentication**: Cognito User Pools with MFA support
- **Authorization**: Resource-based IAM policies

## Scalability Considerations

### Current Capacity

- **Users**: Unlimited
- **Gyms**: Unlimited
- **Songs**: Unlimited
- **Votes/second**: 10,000+
- **WebSocket Connections**: 10,000+

### Bottlenecks & Solutions

| Bottleneck | Solution |
|------------|----------|
| Lambda concurrency | Reserved/provisioned concurrency |
| DynamoDB throttling | Auto-scaling or provisioned capacity |
| API Gateway limits | Request caching, CloudFront CDN |
| WebSocket connections | Connection pooling, Redis cache |

## Cost Breakdown (1000 MAU)

```
DynamoDB:             $0.61
API Gateway:          $1.05
Lambda:               $0.00 (free tier)
S3:                   $0.25
CloudWatch:           $2.56
Cognito:              $0.00 (free tier)
────────────────────────────
TOTAL:                ~$4.50/month
```

## Monitoring & Observability

### Metrics Tracked

- API response times
- Lambda duration & errors
- DynamoDB read/write capacity
- WebSocket connection count
- Vote processing latency
- User engagement metrics

### Alerting

- Lambda error rate > 1%
- API 5xx errors > 10/5min
- DynamoDB throttling events
- High Lambda duration (cold starts)

## Future Enhancements

1. **Redis Cache**: Hot playlist caching for sub-50ms reads
2. **Multi-Region**: Deploy to multiple AWS regions
3. **GraphQL**: Switch to AppSync for more efficient data fetching
4. **ML Recommendations**: Personalized song suggestions
5. **Edge Computing**: Lambda@Edge for ultra-low latency
