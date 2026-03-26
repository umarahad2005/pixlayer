import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        name: { type: String, trim: true },
        plan: { type: String, enum: ['free', 'premium'], default: 'free' },
        credits: { type: Number, default: 10 },
        creditsResetDate: { type: Date, default: () => new Date() },
        lemonSqueezyCustomerId: String,
        lemonSqueezySubscriptionId: String,
    },
    { timestamps: true }
);

userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
    },
});

export default mongoose.model('User', userSchema);
