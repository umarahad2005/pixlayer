---
name: Security Hardening
description: JWT auth, input validation, HTTP headers, NoSQL injection prevention, and CORS for PIXLAYER
---

# Security Hardening

## JWT Authentication

### Token Creation
```js
import jwt from 'jsonwebtoken';

const createToken = (user) => jwt.sign(
  { userId: user._id, email: user.email, plan: user.plan },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

### Token Verification Middleware
```js
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

### Frontend Token Storage
```js
// Store
localStorage.setItem('px_token', token);

// Retrieve for API calls
const token = localStorage.getItem('px_token');
fetch('/api/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
});

// Logout
localStorage.removeItem('px_token');
```

## Password Hashing
```js
import bcrypt from 'bcryptjs';

// Registration — ALWAYS 12 rounds
const hash = await bcrypt.hash(password, 12);

// Login verification
const isValid = await bcrypt.compare(inputPassword, user.passwordHash);
```

## Request Body Validation (Zod)
```js
import { z } from 'zod';

// Define schemas per route
const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
});

const segmentSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().min(1).max(500).trim(),
});

// Validation middleware factory
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req.body = result.data; // Use parsed (sanitized) data
  next();
};

// Usage in routes
router.post('/register', validate(registerSchema), async (req, res) => { /* ... */ });
```

## HTTP Security Headers (Helmet)
```js
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"], // Required for WASM
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.replicate.com"],
    },
  },
}));
```

## NoSQL Injection Prevention
```js
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize()); // Strips $ and . from req.body/query/params
```

## CORS Configuration
```js
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL // Whitelist frontend domain only
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
```

## Input Sanitization

### Filename Sanitization
```js
export const sanitizeFilename = (name) =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Strip special chars
    .replace(/_{2,}/g, '_')              // Collapse multiple underscores
    .slice(0, 100);                       // Max 100 chars
```

### Rate Limiting
```js
import rateLimit from 'express-rate-limit';

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, try again later' },
});

// Strict limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts' },
});
```

## Security Checklist
- [ ] JWT_SECRET is ≥ 32 chars, stored only in .env
- [ ] All passwords hashed with bcrypt (12 rounds)
- [ ] All request bodies validated with Zod
- [ ] Helmet enabled with CSP directives
- [ ] express-mongo-sanitize enabled
- [ ] CORS whitelist set in production
- [ ] Webhook endpoints verify signatures
- [ ] File uploads validated (type + size)
- [ ] Rate limiting on auth + AI routes
- [ ] HTTPS enforced in production (nginx)
