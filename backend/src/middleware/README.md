# Future-Proof Middleware System

This document explains the robust middleware system designed to prevent server hangs and ensure graceful error handling.

## 🚀 Why Future-Proof Instead of Patches?

- **Prevents Server Hangs**: All middleware is wrapped with timeout protection
- **Graceful Degradation**: Non-critical middleware failures don't break requests
- **Consistent Error Handling**: All errors are handled uniformly
- **Performance Monitoring**: Built-in performance tracking
- **Circuit Breaker Pattern**: Prevents cascading failures
- **Retry Logic**: Automatic retry for transient failures

## 📦 Available Middleware Wrappers

### 1. `robustMiddleware` - Full Protection

```javascript
const { robustMiddleware } = require('./middleware/robust');

// Critical middleware that must not fail
const criticalAuth = robustMiddleware(authFunction, {
  name: 'Critical Authentication',
  critical: true,
  timeout: 10000, // 10 seconds
  fallback: (req, res, next) => {
    // Fallback logic if auth fails
    res.status(401).json({ error: 'Authentication required' });
  }
});
```

**Options:**

- `timeout`: Maximum execution time (default: 30s)
- `fallback`: Function to run if middleware fails
- `critical`: Whether failure should stop the request
- `name`: Name for logging

### 2. `safeMiddleware` - Never Throws

```javascript
const { safeMiddleware } = require('./middleware/robust');

// Non-critical middleware that should not break requests
const loggingMiddleware = safeMiddleware((req, res, next) => {
  // This will never throw - if it fails, it just logs and continues
  console.log(`${req.method} ${req.url}`);
  next();
}, 'Request Logging');
```

### 3. `conditionalMiddleware` - Run Based on Conditions

```javascript
const { conditionalMiddleware } = require('./middleware/robust');

const cacheMiddleware = conditionalMiddleware(
  (req, res) => req.method === 'GET' && !req.user, // Condition
  cacheLogic, // Run if condition is true
  (req, res, next) => next() // Fallback if condition is false
);
```

### 4. `retryMiddleware` - Automatic Retries

```javascript
const { retryMiddleware } = require('./middleware/robust');

const databaseMiddleware = retryMiddleware(databaseOperation, {
  maxRetries: 3,
  delay: 1000, // 1 second
  backoff: 2, // Exponential backoff
  retryCondition: error => error.code === 'ECONNRESET' // Only retry connection errors
});
```

### 5. `circuitBreakerMiddleware` - Prevent Cascading Failures

```javascript
const { circuitBreakerMiddleware } = require('./middleware/robust');

const externalApiMiddleware = circuitBreakerMiddleware(externalApiCall, {
  failureThreshold: 5, // Open circuit after 5 failures
  recoveryTimeout: 60000, // Wait 1 minute before trying again
  name: 'External API'
});
```

### 6. `monitoredMiddleware` - Performance Tracking

```javascript
const { monitoredMiddleware } = require('./middleware/robust');

const slowOperation = monitoredMiddleware(async (req, res, next) => {
  // Your middleware logic
  await someSlowOperation();
  next();
}, 'Slow Operation');
```

## 🔧 Usage Examples

### Authentication Middleware

```javascript
const { robustMiddleware } = require('./middleware/robust');

const authMiddleware = robustMiddleware(
  async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }

    const user = await verifyToken(token);
    req.user = user;
    next();
  },
  {
    name: 'Authentication',
    critical: true,
    timeout: 5000
  }
);
```

### Database Middleware with Retry

```javascript
const { retryMiddleware } = require('./middleware/robust');

const dbMiddleware = retryMiddleware(
  async (req, res, next) => {
    const connection = await getDatabaseConnection();
    req.db = connection;
    next();
  },
  {
    maxRetries: 3,
    delay: 1000,
    retryCondition: error => error.code === 'ECONNRESET'
  }
);
```

### Cache Middleware with Circuit Breaker

```javascript
const { circuitBreakerMiddleware } = require('./middleware/robust');

const cacheMiddleware = circuitBreakerMiddleware(
  async (req, res, next) => {
    const cached = await redis.get(req.originalUrl);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    next();
  },
  {
    failureThreshold: 3,
    recoveryTimeout: 30000
  }
);
```

## 🛡️ Error Handling Best Practices

### 1. Always Use Wrappers

```javascript
// ❌ Bad - can cause server hangs
app.use(async (req, res, next) => {
  await someAsyncOperation();
  next();
});

// ✅ Good - protected against hangs
app.use(
  safeMiddleware(async (req, res, next) => {
    await someAsyncOperation();
    next();
  }, 'Some Operation')
);
```

### 2. Handle Errors Properly

```javascript
// ❌ Bad - error might not be handled
const middleware = async (req, res, next) => {
  const result = await riskyOperation();
  req.data = result;
  next();
};

// ✅ Good - proper error handling
const middleware = robustMiddleware(
  async (req, res, next) => {
    try {
      const result = await riskyOperation();
      req.data = result;
      next();
    } catch (error) {
      logger.error('Risky operation failed:', error);
      next(new ApiError(500, 'Operation failed'));
    }
  },
  {
    name: 'Risky Operation',
    critical: false
  }
);
```

### 3. Use Appropriate Timeouts

```javascript
// For fast operations
const fastMiddleware = robustMiddleware(operation, {
  timeout: 1000, // 1 second
  name: 'Fast Operation'
});

// For slow operations
const slowMiddleware = robustMiddleware(operation, {
  timeout: 30000, // 30 seconds
  name: 'Slow Operation'
});
```

## 📊 Monitoring and Logging

All middleware automatically logs:

- Performance metrics (duration, memory usage)
- Error details with stack traces
- Request context (URL, method, IP)
- Circuit breaker state changes
- Retry attempts

### Example Log Output

```
[INFO] Authentication middleware took 45ms to complete
[WARN] Cache middleware failed but continuing
[ERROR] Database middleware failed after 3 attempts
[INFO] External API circuit breaker transitioning to HALF_OPEN
```

## 🔄 Migration Guide

### From Basic Middleware

```javascript
// Old way
app.use(async (req, res, next) => {
  await someOperation();
  next();
});

// New way
app.use(
  safeMiddleware(async (req, res, next) => {
    await someOperation();
    next();
  }, 'Some Operation')
);
```

### From Error-Prone Middleware

```javascript
// Old way
app.use((req, res, next) => {
  try {
    someOperation();
    next();
  } catch (error) {
    next(error);
  }
});

// New way
app.use(
  robustMiddleware(
    (req, res, next) => {
      someOperation();
      next();
    },
    {
      name: 'Some Operation',
      critical: false
    }
  )
);
```

## 🎯 When to Use Each Wrapper

| Wrapper                    | Use Case                | Example                         |
| -------------------------- | ----------------------- | ------------------------------- |
| `robustMiddleware`         | Critical operations     | Authentication, database writes |
| `safeMiddleware`           | Non-critical operations | Logging, metrics, caching       |
| `conditionalMiddleware`    | Conditional logic       | Feature flags, A/B testing      |
| `retryMiddleware`          | Network operations      | API calls, database connections |
| `circuitBreakerMiddleware` | External services       | Third-party APIs, microservices |
| `monitoredMiddleware`      | Performance tracking    | Slow operations, bottlenecks    |

## 🚨 Critical vs Non-Critical

### Critical Middleware

- Authentication
- Authorization
- Database writes
- Payment processing
- Security checks

### Non-Critical Middleware

- Logging
- Metrics collection
- Caching
- Analytics
- Feature flags

## 🔧 Configuration

Set environment variables for global configuration:

```bash
# Timeout settings
MIDDLEWARE_DEFAULT_TIMEOUT=30000
MIDDLEWARE_AUTH_TIMEOUT=10000
MIDDLEWARE_CACHE_TIMEOUT=5000

# Retry settings
MIDDLEWARE_MAX_RETRIES=3
MIDDLEWARE_RETRY_DELAY=1000

# Circuit breaker settings
MIDDLEWARE_CIRCUIT_FAILURE_THRESHOLD=5
MIDDLEWARE_CIRCUIT_RECOVERY_TIMEOUT=60000
```

This system ensures your application is resilient, performant, and maintainable as it scales.
