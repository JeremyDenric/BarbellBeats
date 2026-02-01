# ADR 002: DynamoDB over PostgreSQL

## Status
Accepted

## Context
We need a database that can handle:
- High-velocity voting (30+ votes/minute per user)
- Real-time playlist updates
- Millions of vote records
- Variable workload (10 users to 10,000)
- Sub-100ms read/write latency
- Cost-effective at low scale

### Data Access Patterns
1. **Read**: Get songs for a gym's playlist (filter by gymId, sort by rank)
2. **Write**: Record vote (insert to Votes table, update song stats)
3. **Read**: Get user's rank in a gym (filter by userId + gymId)
4. **Read**: Get leaderboard (filter by gymId, sort by influence points)
5. **Stream**: Real-time updates when votes change
6. **Write**: Add new song (insert to Songs table)
7. **Read**: Get user's voting history (filter by userId)

### Options Considered

#### Option 1: PostgreSQL (RDS)
**Pros:**
- Familiar SQL syntax
- ACID transactions
- Complex joins
- Mature ecosystem
- Strong consistency

**Cons:**
- Fixed capacity planning required
- Vertical scaling limits
- Connection pooling complexity
- ~$15-50/month minimum cost
- Manual scaling operations
- Read replicas add complexity/cost

**Cost Example:**
- db.t3.micro: $15/month (1 vCPU, 1GB RAM)
- db.t3.small: $30/month (2 vCPU, 2GB RAM)
- Read replicas: +$15/month each
- Backup storage: $0.095/GB-month

**Performance:**
- Connection limit: ~100 concurrent
- IOPS: 3000 baseline (burstable)
- Latency: 10-50ms typical

#### Option 2: DynamoDB
**Pros:**
- Infinite horizontal scaling
- Pay-per-request pricing
- Built-in DynamoDB Streams
- Single-digit millisecond latency
- No connection limits
- Zero administration

**Cons:**
- NoSQL learning curve
- No joins (requires denormalization)
- Eventual consistency by default
- Query flexibility limited by indexes

**Cost Example (On-Demand):**
- Write: $1.25 per million requests
- Read: $0.25 per million requests
- Storage: $0.25 per GB-month
- Streams: Free

**Projected Cost (1,000 users):**
```
Daily votes: 30,000
Daily reads: 100,000
Monthly cost:
  Writes: 900k * $1.25 = $1.13
  Reads: 3M * $0.25 = $0.75
  Storage: 1GB * $0.25 = $0.25
  Total: ~$2.13/month
```

**Performance:**
- Throughput: Unlimited (auto-scales)
- Latency: 1-10ms typical
- Hot partition handling: Auto-sharding

#### Option 3: MongoDB Atlas
**Pros:**
- Document model flexibility
- Aggregation pipeline
- Managed service

**Cons:**
- Minimum cost: ~$25/month (M10)
- Less integrated with AWS ecosystem
- No built-in change streams at low tier
- Manual index management

## Decision
We will use **DynamoDB** (Option 2).

## Rationale

### 1. Cost at Scale
At our target scale:

| Users | Daily Votes | Monthly DynamoDB | Monthly RDS (t3.small) |
|-------|-------------|------------------|------------------------|
| 100 | 3,000 | $0.21 | $30 |
| 1,000 | 30,000 | $2.13 | $30 (struggling) |
| 10,000 | 300,000 | $21.30 | $200+ (need t3.large) |
| 100,000 | 3,000,000 | $213 | $2,000+ (multi-instance) |

DynamoDB wins at every scale.

### 2. Performance Requirements
Our voting system needs:
- **Write latency <10ms**: DynamoDB achieves 1-5ms
- **No connection pooling**: DynamoDB is HTTP-based
- **Burst handling**: DynamoDB auto-scales, RDS has fixed IOPS
- **Real-time streams**: DynamoDB Streams built-in

### 3. Access Pattern Fit
Our queries are simple:
```
✅ Get playlist by gymId → Single partition key query
✅ Get user rank by userId+gymId → Composite key query
✅ Record vote → Single-item write
✅ Get leaderboard → GSI query on gymId, sort by influencePoints
✅ Stream changes → DynamoDB Streams
```

We don't need:
```
❌ Complex joins (denormalize instead)
❌ Aggregations (calculate in application layer)
❌ Ad-hoc queries (we know all access patterns)
```

### 4. Operational Simplicity
DynamoDB:
- Zero maintenance
- No patching
- No backup configuration (built-in PITR)
- No scaling decisions

RDS:
- Must choose instance size
- Manual scaling operations
- Backup window configuration
- Version upgrades
- Connection pool tuning

### 5. Serverless Alignment
DynamoDB pairs perfectly with Lambda:
- Both scale to zero
- Both pay-per-use
- No connection management
- Built-in AWS SDK integration

## Data Model Design

### Tables

**1. Songs**
```
PK: gymId#songId
SK: tier#netVotes
Attributes: title, artist, tier, netVotes, addedBy, ...
GSI-1: gymId, tier#rankInTier (for tier-based queries)
```

**2. Votes**
```
PK: userId#gymId
SK: songId#timestamp
Attributes: voteType, voterRank, influenceGranted
GSI-1: gymId#songId (for song's vote history)
```

**3. UserGymRanks**
```
PK: userId#gymId
Attributes: rank, influencePoints, goldSongs, ...
GSI-1: gymId, influencePoints (for leaderboard)
```

**4. Users**
```
PK: userId
Attributes: email, username, displayName, ...
GSI-1: email (for login)
```

### Why Not Single-Table Design?
Initially considered single-table, but:
- Separate tables are simpler to understand
- Easier to apply different TTL policies
- Clearer permission boundaries
- Lower risk of hot partitions
- Can add GSIs independently

Trade-off: 4 tables instead of 1, but still only $0.25/GB storage.

## Consequences

### Positive
- **Cost savings**: ~90% cheaper at low scale
- **No capacity planning**: Auto-scales infinitely
- **Zero ops**: No database administration
- **Real-time streams**: Built-in change data capture
- **Global distribution**: Can add global tables later

### Negative
- **NoSQL mindset**: Team must learn denormalization patterns
- **No joins**: Must denormalize user data into Songs table
- **Eventual consistency**: Must use strongly consistent reads where needed
- **Query limitations**: Cannot add arbitrary filters without new GSI

### Mitigation Strategies

**For Missing Joins:**
- Denormalize: Include user data in song records
- Use batch gets: Fetch related items in parallel
- Cache frequently accessed data in application

**For Consistency:**
- Use `ConsistentRead: true` for critical paths
- Implement optimistic locking with version numbers
- Use DynamoDB Transactions for multi-item updates

**For Complex Queries:**
- Pre-compute leaderboards in GSIs
- Use DynamoDB Streams + Lambda for aggregations
- Export to S3 + Athena for analytics

## Hot Partition Risks

**Problem**: All votes for a popular gym go to same partition.

**Solutions:**
1. **Sharding**: Use `gymId#shard-{0-9}` as PK
2. **Caching**: Read-through cache for hot items (ElastiCache)
3. **Burst capacity**: DynamoDB provides temporary burst above provisioned
4. **On-demand mode**: Unlimited throughput (higher cost)

**Monitoring:**
- CloudWatch metrics: `ConsumedReadCapacityUnits`, `ConsumedWriteCapacityUnits`
- Alert on throttled requests
- Watch for hot partition warnings

## Migration Path (if needed)

If DynamoDB becomes limiting:
1. Export DynamoDB to S3 (Athena for analytics)
2. Replicate to Aurora Serverless (for complex queries)
3. Keep DynamoDB for transactional workload
4. Use PostgreSQL for reporting queries

## Performance Benchmarks

Expected latencies:
- Single-item get: 1-3ms
- Query with limit 50: 5-10ms
- Batch get (100 items): 10-20ms
- Transactional write: 10-15ms
- Scan (full table): Avoid, use GSI queries

## References
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single-Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Choosing the Right Database](https://aws.amazon.com/getting-started/hands-on/design-a-database-for-a-mobile-app-with-dynamodb/)

## Date
2025-01-22

## Authors
BarbellBeats Team

## Revisions
- 2025-01-22: Initial decision for DynamoDB
