import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Layers,
    Wand2,
    Download,
    ArrowRight,
    Sparkles,
    Zap,
    Shield,
} from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
    {
        icon: Wand2,
        title: 'AI Segmentation',
        desc: 'Click or type to isolate any element. SAM 2 runs locally in your browser — no uploads needed.',
    },
    {
        icon: Layers,
        title: 'Smart Layers',
        desc: 'Every segment becomes an independent layer with full transparency, positioning, and metadata.',
    },
    {
        icon: Download,
        title: 'Multi-Format Export',
        desc: 'Export as SVG with vector paths, PSD with named layers, or Figma JSON for direct import.',
    },
];

const stats = [
    { value: '< 500ms', label: 'Segmentation' },
    { value: '3 formats', label: 'SVG / PSD / Figma' },
    { value: 'Client-side', label: 'AI Processing' },
];

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-px-bg overflow-y-auto">
            {/* Nav */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-px-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-px-accent rounded-sm flex items-center justify-center">
                        <span className="font-mono text-sm font-bold text-white">PX</span>
                    </div>
                    <span className="font-display text-base font-semibold tracking-wide text-px-text">
                        PIXLAYER
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/auth')}
                        className="font-mono text-xs text-px-text-muted hover:text-px-text transition-default cursor-pointer"
                    >
                        Log in
                    </button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/auth')}>
                        Start for Free
                    </Button>
                </div>
            </nav>

            {/* Hero */}
            <section className="flex flex-col items-center text-center px-8 pt-24 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 bg-px-accent/10 border border-px-accent/20 rounded-sm">
                        <Sparkles size={14} className="text-px-accent" />
                        <span className="font-mono text-[11px] text-px-accent tracking-wide">
                            AI-POWERED LAYER EXTRACTION
                        </span>
                    </div>

                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-px-text leading-tight max-w-4xl mb-6">
                        From flat AI output to{' '}
                        <span className="text-px-accent">layered design file.</span>{' '}
                        Instantly.
                    </h1>

                    <p className="font-body text-lg text-px-text-muted max-w-2xl mb-10">
                        Upload any AI-generated image. Our AI segments it into discrete layers.
                        Export as SVG, PSD, or Figma — ready for your design workflow.
                    </p>

                    <div className="flex items-center gap-4 justify-center">
                        <Button
                            variant="primary"
                            size="lg"
                            icon={ArrowRight}
                            onClick={() => navigate('/editor')}
                        >
                            Start for Free
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => {
                                document
                                    .getElementById('features')
                                    ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            See how it works
                        </Button>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-center gap-12 mt-16 pt-8 border-t border-px-border"
                >
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="font-display text-xl font-bold text-px-accent">
                                {stat.value}
                            </div>
                            <div className="font-mono text-[11px] text-px-text-muted uppercase tracking-wider mt-1">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* Features */}
            <section id="features" className="px-8 py-20 border-t border-px-border">
                <div className="max-w-5xl mx-auto">
                    <h2 className="font-display text-3xl font-bold text-px-text text-center mb-4">
                        Professional-grade layer extraction
                    </h2>
                    <p className="font-body text-sm text-px-text-muted text-center mb-12 max-w-xl mx-auto">
                        PIXLAYER combines state-of-the-art AI segmentation with a production-ready
                        export engine. No Photoshop needed.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="p-6 bg-px-surface border border-px-border rounded-sm hover:border-px-accent/30 transition-default group"
                            >
                                <div className="w-10 h-10 bg-px-accent/10 rounded-sm flex items-center justify-center mb-4 group-hover:bg-px-accent/20 transition-default">
                                    <feature.icon size={20} className="text-px-accent" />
                                </div>
                                <h3 className="font-display text-base font-semibold text-px-text mb-2">
                                    {feature.title}
                                </h3>
                                <p className="font-body text-sm text-px-text-muted leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-8 py-20 border-t border-px-border">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Zap size={20} className="text-px-accent" />
                        <Shield size={20} className="text-px-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-px-text mb-3">
                        Ready to start?
                    </h2>
                    <p className="font-body text-sm text-px-text-muted mb-8">
                        10 free AI generations per month. No credit card required.
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        icon={ArrowRight}
                        onClick={() => navigate('/editor')}
                    >
                        Launch Editor
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-8 py-6 border-t border-px-border text-center">
                <span className="font-mono text-[11px] text-px-text-muted">
                    © 2026 PIXLAYER. Built for creators who demand more from AI.
                </span>
            </footer>
        </div>
    );
}
