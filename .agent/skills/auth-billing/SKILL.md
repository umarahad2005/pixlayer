---
name: Authentication & Billing
description: JWT auth flow, Lemon Squeezy checkout, webhook verification, credit tracking, and subscription management for PIXLAYER
---

# Authentication & Billing

## JWT Authentication Flow

### Registration Flow
```
Client → POST /api/auth/register { email, password, name }
Server → hash password (bcrypt 12 rounds) → create User → sign JWT → return { token, user }
Client → store token in localStorage('px_token') → redirect to /dashboard
```

### Login Flow
```
Client → POST /api/auth/login { email, password }
Server → find user by email → bcrypt.compare → sign JWT → return { token, user }
Client → store token → redirect to /dashboard
```

### Session Persistence
```js
// On app load, check for existing token
const token = localStorage.getItem('px_token');
if (token) {
  // Verify token is still valid
  fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(user => setUser(user))
    .catch(() => localStorage.removeItem('px_token'));
}
```

## Lemon Squeezy Integration

### Install
```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

### Create Checkout (Server)
```js
// server/services/lemonsqueezyService.js
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY });

export async function createCheckoutUrl(userId, email) {
  const checkout = await createCheckout(
    process.env.LEMON_SQUEEZY_STORE_ID,
    process.env.LEMON_SQUEEZY_VARIANT_ID,
    {
      checkoutData: {
        email,
        custom: { user_id: userId },
      },
    }
  );
  return checkout.data.data.attributes.url;
}
```

### Webhook Handler (Server)
```js
// server/routes/billing.js
import crypto from 'crypto';
import User from '../models/User.js';

// CRITICAL: Use express.raw() for this route (not express.json())
// Must be registered BEFORE express.json() middleware
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-signature'];
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  const hmac = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  if (hmac !== signature) return res.status(401).send('Invalid signature');

  const payload = JSON.parse(req.body.toString());
  const eventName = payload.meta.event_name;
  const userId = payload.meta.custom_data?.user_id;

  switch (eventName) {
    case 'subscription_created':
      await User.findByIdAndUpdate(userId, {
        plan: 'premium',
        credits: 999,
        lemonSqueezySubscriptionId: payload.data.id,
      });
      break;
    case 'subscription_cancelled':
      // Keep premium until period ends
      await User.findByIdAndUpdate(userId, { plan: 'free' });
      break;
    case 'subscription_payment_success':
      await User.findByIdAndUpdate(userId, { credits: 999 });
      break;
  }

  res.sendStatus(200);
});
```

## Credit System

### Credit Check Middleware
```js
// server/middleware/creditCheck.js
export const creditCheck = async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });

  if (user.plan === 'premium') return next(); // Unlimited

  if (user.credits <= 0) {
    return res.status(403).json({
      error: 'No credits remaining',
      creditsUsed: 10,
      creditsTotal: 10,
      upgradeUrl: '/dashboard?upgrade=true',
    });
  }

  user.credits -= 1;
  await user.save();
  req.remainingCredits = user.credits;
  next();
};
```

### Monthly Credit Reset (node-cron)
```js
import cron from 'node-cron';

// Run at midnight on the 1st of every month
cron.schedule('0 0 1 * *', async () => {
  await User.updateMany(
    { plan: 'free', creditsResetDate: { $lt: new Date() } },
    { $set: { credits: 10, creditsResetDate: new Date(Date.now() + 30 * 86400000) } }
  );
  console.log('Monthly credit reset complete');
});
```

### Frontend Credit Display
```jsx
function CreditIndicator({ credits, total }) {
  const percentage = (credits / total) * 100;
  return (
    <div className="relative w-12 h-12">
      <svg viewBox="0 0 36 36">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#1E1E22" strokeWidth="3" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#6C63FF" strokeWidth="3"
          strokeDasharray={`${percentage}, 100`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-mono">
        {credits}
      </span>
    </div>
  );
}
```

## Route Protection Pattern
```js
// AI routes: auth + rate limit + credit check
app.use('/api/segment', authMiddleware, rateLimiter, creditCheck, segmentRoutes);
app.use('/api/inpaint', authMiddleware, rateLimiter, creditCheck, inpaintRoutes);

// Standard routes: auth only
app.use('/api/projects', authMiddleware, projectRoutes);

// Public routes: no auth
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/billing/webhook', billingRoutes); // Webhook verifies its own signature
```
