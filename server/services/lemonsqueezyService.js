import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import crypto from 'crypto';

// Initialize Lemon Squeezy
lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY });

export async function createCheckoutUrl(userId, email) {
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

    const checkout = await createCheckout(storeId, variantId, {
        checkoutData: {
            email,
            custom: { user_id: userId },
        },
        productOptions: {
            redirectUrl: `${process.env.CLIENT_URL}/dashboard?upgraded=true`,
        },
    });

    return checkout.data.data.attributes.url;
}

export function verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const digest = hmac.digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    );
}
