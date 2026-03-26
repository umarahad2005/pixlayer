import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, default: 'Untitled Project' },
        thumbnail: String,
        layerCount: { type: Number, default: 0 },
        layers: [
            {
                name: String,
                imageUrl: String,
                bounds: {
                    x: Number,
                    y: Number,
                    w: Number,
                    h: Number,
                },
                visible: { type: Boolean, default: true },
                locked: { type: Boolean, default: false },
            },
        ],
        exportHistory: [
            {
                format: { type: String, enum: ['svg', 'psd', 'figma'] },
                exportedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
