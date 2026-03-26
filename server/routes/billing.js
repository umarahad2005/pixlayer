import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createCheckoutUrl, verifyWebhookSignature } from '../services/lemonsqueezyService.js';
import User from '../models/User.js';

const router = Router();

// Create checkout session — protected
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.plan === 'premium') {
            return res.status(400).json({ error: 'Already on premium plan' });
        }

        const checkoutUrl = await createCheckoutUrl(user._id.toString(), user.email);
        res.json({ checkoutUrl });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Failed to create checkout' });
    }
});

// Webhook handler — public, raw body
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-signature'];
        const rawBody = req.body;

        if (!verifyWebhookSignature(rawBody, signature)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = JSON.parse(rawBody.toString());
        const eventName = event.meta?.event_name;
        const userId = event.meta?.custom_data?.user_id;

        if (!userId) {
            return res.sendStatus(200);
        }

        switch (eventName) {
            case 'subscription_created':
            case 'subscription_resumed': {
                await User.findByIdAndUpdate(userId, {
                    plan: 'premium',
                    credits: 999999,
                    lemonSqueezyCustomerId: event.data?.attributes?.customer_id?.toString(),
                    lemonSqueezySubscriptionId: event.data?.id?.toString(),
                });
                break;
            }
            case 'subscription_cancelled':
            case 'subscription_expired': {
                await User.findByIdAndUpdate(userId, {
                    plan: 'free',
                    credits: 10,
                });
                break;
            }
            case 'subscription_payment_success': {
                // Renew credits on payment
                await User.findByIdAndUpdate(userId, { credits: 999999 });
                break;
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('Webhook error:', err);
        res.sendStatus(500);
    }
});

export default router;
