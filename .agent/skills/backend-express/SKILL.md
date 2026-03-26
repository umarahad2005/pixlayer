---
name: Backend Express Development
description: Node.js Express API patterns, Mongoose models, middleware chains, and error handling for PIXLAYER
---

# Backend Express Development

## Project Structure
```
server/
├── index.js              # Entry point — Express app setup
├── routes/
│   ├── auth.js           # POST /register, /login, GET /me
│   ├── projects.js       # CRUD for user projects
│   ├── segmentation.js   # POST /segment/text, /inpaint/*
│   ├── billing.js        # POST /checkout, /webhook
│   └── export.js         # POST /export (server-side if needed)
├── models/
│   ├── User.js           # User schema + methods
│   └── Project.js        # Project schema
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   ├── rateLimiter.js     # express-rate-limit configs
│   └── creditCheck.js     # Free user credit enforcement
├── services/
│   ├── replicateService.js # Replicate API wrapper
│   └── storageService.js   # Cloudinary/S3 upload
└── utils/
    └── errors.js           # Custom error classes
```

## ES Module Configuration
**CRITICAL**: The server uses ES modules. `package.json` must include:
```json
{ "type": "module" }
```
All imports must use `.js` extension:
```js
import { authMiddleware } from './middleware/authMiddleware.js';
```

## Express App Setup Pattern
```js
// server/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing — IMPORTANT: raw parser for webhooks BEFORE json parser
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/segment', authMiddleware, segmentationRoutes);
app.use('/api/billing', billingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Database + Start
mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 })
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(console.error);
```

## Route Pattern
```js
// server/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    // Validate with Zod (see security skill)
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, name });
    const token = jwt.sign(
      { userId: user._id, email: user.email, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: user._id, email, name, plan: user.plan } });
  } catch (err) {
    next(err);
  }
});

export default router;
```

## Middleware Chain Order
```
Request → helmet → cors → morgan → bodyParser
  → authMiddleware (verify JWT)
    → rateLimiter (check rate limits)
      → creditCheck (for AI routes only)
        → route handler
          → error handler
```

## Mongoose Model Pattern
```js
// server/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, trim: true },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  credits: { type: Number, default: 10 },
  creditsResetDate: { type: Date, default: () => new Date() },
  lemonSqueezyCustomerId: String,
  lemonSqueezySubscriptionId: String,
}, { timestamps: true });

// Never return passwordHash in queries
userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.passwordHash; return ret; }
});

export default mongoose.model('User', userSchema);
```

## Error Handling
```js
// server/utils/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}
```

## Auth Middleware Pattern
```js
// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedError('No token provided');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, plan }
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid token'));
  }
};
```

## Environment Variables
All env vars are accessed via `process.env.VAR_NAME`. Never hardcode secrets.
Required vars are documented in `.env.example`.
