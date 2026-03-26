import User from '../models/User.js';

export const creditCheck = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Premium users skip credit check
        if (user.plan === 'premium') {
            return next();
        }

        // Free users: check and decrement credits
        if (user.credits <= 0) {
            return res.status(403).json({
                error: 'No credits remaining',
                code: 'NO_CREDITS',
                message: 'Upgrade to Premium for unlimited AI generations',
            });
        }

        await User.findByIdAndUpdate(user._id, { $inc: { credits: -1 } });
        next();
    } catch (err) {
        console.error('Credit check error:', err);
        res.status(500).json({ error: 'Credit check failed' });
    }
};
