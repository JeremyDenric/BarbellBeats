# Code Review Checklist for AI-Generated Code

Use this checklist **every time** you receive code from Claude or any AI tool.

---

## ✅ 1. Readability & Structure

### Variable Names
- [ ] Variable names are descriptive and meaningful
- [ ] No single-letter variables (except loop counters)
- [ ] Boolean variables start with `is`, `has`, `should`, `can`
- [ ] Constants are UPPER_SNAKE_CASE
- [ ] No abbreviations unless universally understood

**Example:**
```typescript
// ❌ BAD
const u = getUserData();
const flg = true;

// ✅ GOOD
const userData = getUserData();
const isAuthenticated = true;
```

### Function Length
- [ ] Functions are under 50 lines (ideally under 30)
- [ ] Each function does ONE thing
- [ ] Function names are verbs (e.g., `createUser`, `validateInput`)
- [ ] Pure functions when possible (no side effects)

### Indentation & Formatting
- [ ] Consistent indentation (2 or 4 spaces)
- [ ] Proper spacing around operators
- [ ] No trailing whitespace
- [ ] Blank lines separate logical blocks
- [ ] Runs through Prettier/ESLint without errors

**Ask Claude:**
> "Refactor this for readability. Break down any functions over 30 lines."

---

## ✅ 2. Logical Flow

### Design Match
- [ ] Code matches the feature specification
- [ ] Input → Processing → Output flow is clear
- [ ] No unnecessary complexity
- [ ] Algorithm implementation matches pseudocode

### State Handling
- [ ] Handles "empty state" (no data yet)
- [ ] Handles "loading state"
- [ ] Handles "error state"
- [ ] Handles "success state"
- [ ] Edge cases covered (e.g., no current song, user not at gym)

**Ask Claude:**
> "Explain this function's logic step-by-step with inline comments."

---

## ✅ 3. Error Handling & Edge Cases

### Input Validation
- [ ] Required fields are checked
- [ ] Data types are validated
- [ ] Ranges are validated (e.g., weight > 0)
- [ ] String lengths are checked
- [ ] Array/object existence is checked before access

**Example:**
```typescript
// ❌ BAD
const weight = body.weight;

// ✅ GOOD
if (!body.weight || typeof body.weight !== 'number' || body.weight <= 0) {
  throw new BadRequestError('Invalid weight');
}
const weight = body.weight;
```

### Error Messages
- [ ] User-friendly error messages (not stack traces)
- [ ] Consistent error format
- [ ] Helpful context in errors
- [ ] Different errors for different scenarios

### Defensive Programming
- [ ] Optional chaining used (`?.`)
- [ ] Nullish coalescing used (`??`)
- [ ] Array methods check length before access
- [ ] Database results checked before use

**Ask Claude:**
> "Add comprehensive error handling and input validation to this code."

---

## ✅ 4. Security

### Authentication & Authorization
- [ ] Every endpoint checks authentication
- [ ] User permissions validated
- [ ] Resource ownership verified
- [ ] No user impersonation possible

**Example:**
```typescript
// ❌ BAD
const userId = event.pathParameters.userId;

// ✅ GOOD
const authenticatedUserId = getUserIdFromToken(event);
const requestedUserId = event.pathParameters.userId;

if (authenticatedUserId !== requestedUserId) {
  throw new ForbiddenError('Cannot access other user data');
}
```

### Input Sanitization
- [ ] User input is sanitized (no XSS)
- [ ] SQL injection prevented (use parameterized queries)
- [ ] NoSQL injection prevented (validate types)
- [ ] File paths validated (no directory traversal)

### Secrets Management
- [ ] NO hardcoded API keys
- [ ] NO hardcoded passwords
- [ ] Environment variables used
- [ ] Secrets stored in AWS Secrets Manager (production)

**Example:**
```typescript
// ❌ BAD
const apiKey = 'sk_live_1234567890';

// ✅ GOOD
const apiKey = process.env.SPOTIFY_CLIENT_SECRET;
if (!apiKey) {
  throw new Error('Missing SPOTIFY_CLIENT_SECRET environment variable');
}
```

### Data Exposure
- [ ] Password hashes never returned in responses
- [ ] Sensitive fields filtered from responses
- [ ] Error messages don't leak system info
- [ ] Logs don't contain passwords or tokens

**Ask Claude:**
> "Review this for security vulnerabilities. Fix any insecure patterns."

---

## ✅ 5. Performance & Scalability

### Database Queries
- [ ] Uses indexes (GSIs in DynamoDB)
- [ ] Limits result set size (pagination)
- [ ] No N+1 query problems
- [ ] Batch operations used when possible
- [ ] No full table scans

**Example:**
```typescript
// ❌ BAD - N+1 queries
const songs = await getSongs(gymId);
for (const song of songs) {
  song.user = await getUser(song.addedBy); // N queries!
}

// ✅ GOOD - Batch query
const songs = await getSongs(gymId);
const userIds = [...new Set(songs.map(s => s.addedBy))];
const users = await batchGetUsers(userIds);
const userMap = new Map(users.map(u => [u.userId, u]));
songs.forEach(song => {
  song.user = userMap.get(song.addedBy);
});
```

### Caching
- [ ] Frequently accessed data cached
- [ ] Cache invalidation strategy exists
- [ ] TTL set appropriately
- [ ] Cache keys are specific

### Resource Usage
- [ ] Large datasets streamed, not loaded entirely
- [ ] Files uploaded directly to S3 (not through Lambda)
- [ ] Heavy computation done asynchronously
- [ ] Connection pooling used

**Ask Claude:**
> "Optimize this code for 100k concurrent users. Focus on database queries."

---

## ✅ 6. Testing Strategy

### Unit Tests
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Test boundary conditions
- [ ] Mocks for external dependencies

**Example Test:**
```typescript
describe('voteSong', () => {
  it('should record upvote successfully', async () => {
    const result = await voteSong(userId, songId, 1);
    expect(result.success).toBe(true);
    expect(result.voteType).toBe(1);
  });

  it('should reject vote from non-member', async () => {
    await expect(
      voteSong(nonMemberUserId, songId, 1)
    ).rejects.toThrow('You must join this gym first');
  });

  it('should handle invalid vote type', async () => {
    await expect(
      voteSong(userId, songId, 99)
    ).rejects.toThrow('Invalid vote type');
  });
});
```

**Ask Claude:**
> "Generate comprehensive Jest unit tests for this function. Include success, error, and edge cases."

---

## ✅ 7. Code Conventions

### Framework-Specific
- [ ] Follows React Native conventions (hooks, components)
- [ ] Follows Lambda conventions (single-purpose handlers)
- [ ] Follows DynamoDB conventions (partition keys, GSIs)
- [ ] TypeScript strict mode enabled

### Project Structure
- [ ] Files in correct directories
- [ ] Imports organized logically
- [ ] No circular dependencies
- [ ] Consistent naming across project

**Ask Claude:**
> "Does this follow React Native/Node/AWS best practices? Refactor if needed."

---

## ✅ 8. Documentation

### Code Comments
- [ ] Complex logic explained
- [ ] "Why" comments, not "what" comments
- [ ] Function JSDoc comments with params/returns
- [ ] TODO comments have tickets/dates

**Example:**
```typescript
/**
 * Calculates weighted vote impact based on user's rank
 *
 * Higher-ranked users have more influence, but downvotes are
 * slightly dampened (0.8x) to prevent tyranny.
 *
 * @param voteType - 1 (upvote) or -1 (downvote)
 * @param voterRank - User's rank tier
 * @returns Vote weight value (0.8 - 5.0)
 */
function calculateVoteImpact(
  voteType: 1 | -1,
  voterRank: RankTier
): number {
  // Implementation
}
```

### README Updates
- [ ] New features documented
- [ ] Environment variables documented
- [ ] Setup steps updated
- [ ] API changes noted

---

## ✅ 9. Integration Checks

### API Contracts
- [ ] Matches OpenAPI/Swagger spec
- [ ] Request/response types match frontend
- [ ] Error codes documented
- [ ] Breaking changes flagged

### Database Schema
- [ ] Matches DynamoDB table definitions
- [ ] GSIs exist for all queries
- [ ] No missing fields
- [ ] Migration path planned (if schema changed)

### Dependencies
- [ ] All imports exist
- [ ] Versions compatible
- [ ] No unused dependencies
- [ ] Security vulnerabilities checked (`npm audit`)

**Ask Claude:**
> "Does this integrate correctly with the existing database schema and API contracts?"

---

## ✅ 10. Final Review

### The Meta-Review
Paste the ENTIRE file and ask:

> "You are a senior staff engineer at Google. Review this code for:
> 1. Bugs and logic errors
> 2. Security vulnerabilities
> 3. Performance issues
> 4. Readability problems
> 5. Missing error handling
> 6. Scalability concerns
>
> Return a corrected version with inline comments explaining changes."

---

## 🎯 Quick Reference

### Before Accepting Code:

```bash
# 1. Run linter
npm run lint

# 2. Run type checker
tsc --noEmit

# 3. Run tests
npm test

# 4. Check dependencies
npm audit

# 5. Format code
npm run format
```

### Red Flags 🚩

- Functions over 100 lines
- No error handling
- Hardcoded secrets
- `any` type everywhere
- No input validation
- Database queries without indexes
- Missing authentication checks
- Unclear variable names

### Green Flags ✅

- Single responsibility functions
- Comprehensive error handling
- Type-safe (no `any`)
- Input validation on all endpoints
- Defensive programming (`?.`, `??`)
- Clear, self-documenting code
- Unit tests included
- Security best practices

---

## 📋 Review Template (Copy/Paste)

```markdown
## Code Review for [Feature Name]

**Reviewer:** [Your Name]
**Date:** [Date]
**Files Reviewed:** [List files]

### ✅ Passes
- [ ] Readability
- [ ] Logical flow
- [ ] Error handling
- [ ] Security
- [ ] Performance
- [ ] Tests
- [ ] Documentation

### ❌ Issues Found

#### High Priority
1. [Issue description]
   - Location: [File:Line]
   - Fix: [How to fix]

#### Medium Priority
1. [Issue description]

#### Low Priority (Nice to have)
1. [Issue description]

### 💡 Suggestions
1. [Improvement suggestion]

### ✅ Approved / 🔄 Changes Requested
[Decision]
```

---

## 🛠️ Claude Prompts Cheat Sheet

| Task | Prompt |
|------|--------|
| Refactor | "Refactor this for readability and proper structure." |
| Explain | "Explain this function line-by-line with comments." |
| Error handling | "Add defensive checks and comprehensive error handling." |
| Security | "Review for security flaws and fix insecure patterns." |
| Performance | "Optimize this for 100k users. Focus on database queries." |
| Tests | "Generate Jest tests with success, error, and edge cases." |
| Best practices | "Does this follow [framework] best practices? Refactor if needed." |
| Integration | "Does this integrate with existing schema and APIs correctly?" |
| Full review | "Do a senior engineer code review. Fix all issues." |

---

**Save this checklist and use it EVERY TIME you get AI-generated code!**
