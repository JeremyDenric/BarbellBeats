# ADR 001: Serverless Architecture

## Status
Accepted

## Context
We need to build a real-time music voting platform for gyms that:
- Scales from 10 to 10,000+ concurrent users per gym
- Handles real-time updates with sub-200ms latency
- Minimizes operational overhead
- Keeps costs low during early adoption
- Supports rapid iteration and deployment

### Options Considered

#### Option 1: Traditional EC2 + Load Balancer
**Pros:**
- Full control over infrastructure
- Predictable performance
- Can optimize for specific workloads

**Cons:**
- Fixed costs regardless of usage
- Manual scaling configuration
- Requires DevOps maintenance
- Higher minimum cost (~$50-100/month idle)
- Deployment complexity

#### Option 2: Container-based (ECS/Fargate)
**Pros:**
- Better resource utilization than EC2
- Container portability
- Some autoscaling capabilities

**Cons:**
- Still has baseline costs
- More complex than serverless
- Requires container orchestration knowledge
- Cold start issues with Fargate

#### Option 3: Serverless (Lambda + API Gateway + DynamoDB)
**Pros:**
- Zero cost when idle
- Automatic scaling (0 to millions)
- No server management
- Pay only for actual usage
- Built-in high availability
- Fast deployment cycles

**Cons:**
- Cold start latency (mitigated with provisioned concurrency)
- 15-minute Lambda timeout limit
- Vendor lock-in to AWS
- Limited execution environment customization

## Decision
We will use **AWS Serverless Architecture** (Option 3) with:
- **AWS Lambda** for compute
- **API Gateway** for HTTP/REST endpoints
- **API Gateway WebSocket** for real-time updates
- **DynamoDB** for database
- **EventBridge** for event routing
- **S3** for static assets
- **CloudFront** for CDN
- **Cognito** for authentication

## Rationale

### Cost Efficiency
With serverless, our cost structure is:
```
Lambda: $0.20 per 1M requests
DynamoDB: Pay-per-request pricing
API Gateway: $1.00 per 1M requests
WebSocket: $1.00 per 1M messages

Projected costs for 1,000 active users:
- ~$4.50/month for database
- ~$2.00/month for Lambda
- ~$1.50/month for API Gateway
Total: ~$8/month vs $50-100/month for EC2
```

### Scalability
- Lambda scales to 1,000 concurrent executions per region automatically
- DynamoDB auto-scales read/write capacity
- No manual intervention needed for traffic spikes
- Geographic distribution built-in

### Development Velocity
- Deploy in seconds via Serverless Framework
- No infrastructure provisioning delays
- Built-in logging with CloudWatch
- Easy CI/CD integration

### Real-Time Requirements
- WebSocket API Gateway provides persistent connections
- DynamoDB Streams trigger Lambda for real-time events
- Sub-200ms typical response times
- EventBridge for fan-out patterns

### Team Expertise
- Team familiar with JavaScript/TypeScript
- Lambda's Node.js runtime is well-documented
- Large ecosystem of serverless tools
- Easier to hire JavaScript developers than DevOps engineers

## Consequences

### Positive
- **Low barrier to entry**: Can start with $0/month
- **Automatic HA**: Multi-AZ by default
- **Focus on features**: No infrastructure management
- **Fast iteration**: Deploy changes in seconds
- **Built-in monitoring**: CloudWatch Logs/Metrics included

### Negative
- **Cold starts**: First request to idle Lambda ~1-2s
  - *Mitigation*: Provisioned concurrency for critical functions
- **Vendor lock-in**: Tightly coupled to AWS
  - *Mitigation*: Abstract business logic into shared packages
- **Debugging complexity**: Distributed systems are harder to debug
  - *Mitigation*: Structured logging, X-Ray tracing
- **Lambda limits**: 15min timeout, 10GB memory max
  - *Mitigation*: Break long operations into Step Functions

### Technical Debt
- Will need to refactor if:
  - Long-running background jobs exceed 15 minutes
  - Need custom binary dependencies
  - Costs exceed $500/month (consider hybrid approach)
- Plan to abstract data layer behind repository pattern for potential migration

## Monitoring Strategy
- CloudWatch Alarms for Lambda errors, throttles, duration
- DynamoDB consumed capacity monitoring
- WebSocket connection count tracking
- API Gateway 4xx/5xx error rates
- Cost budgets with SNS alerts

## Migration Path (if needed)
If serverless becomes limiting:
1. Move compute-heavy operations to Fargate
2. Migrate DynamoDB to Aurora Serverless (if needed)
3. Keep API Gateway + Lambda for API layer
4. Use ECS for long-running background workers

## References
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## Date
2025-01-22

## Authors
BarbellBeats Team
