import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';

const placeholderProjects = [
    {
        id: '1',
        name: 'Hero Illustration',
        layers: 4,
        date: '2 days ago',
        color: '#6C63FF',
    },
    {
        id: '2',
        name: 'Product Mockup',
        layers: 7,
        date: '5 days ago',
        color: '#22C55E',
    },
    {
        id: '3',
        name: 'Character Design',
        layers: 3,
        date: '1 week ago',
        color: '#F59E0B',
    },
];

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-full bg-px-bg overflow-y-auto">
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
                <div className="w-8 h-8 rounded-sm bg-px-surface border border-px-border flex items-center justify-center">
                    <span className="font-mono text-xs text-px-text-muted">U</span>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-10">
                {/* Greeting */}
                <div className="mb-8">
                    <h1 className="font-display text-2xl font-bold text-px-text mb-2">
                        Welcome back
                    </h1>
                    <p className="font-body text-sm text-px-text-muted">
                        AI-powered image layer extraction — powered by SAM 2 &amp; Gemini.
                    </p>
                </div>

                {/* Feature card */}
                <div className="p-5 bg-gradient-to-br from-px-accent/10 to-px-accent/5 border border-px-accent/20 rounded-sm mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-px-accent" />
                        <span className="font-display text-sm font-semibold text-px-text">
                            Free AI Segmentation
                        </span>
                    </div>
                    <p className="font-body text-xs text-px-text-muted">
                        Upload any AI-generated image. Point-click or text-prompt to extract layers.
                        Export as SVG, PSD, or Figma — all free.
                    </p>
                </div>

                {/* Projects */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-px-text">
                        Recent Projects
                    </h2>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={Plus}
                        onClick={() => navigate('/editor')}
                    >
                        New Project
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {placeholderProjects.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            onClick={() => navigate('/editor')}
                            className="group p-4 bg-px-surface border border-px-border rounded-sm cursor-pointer hover:border-px-accent/30 transition-default"
                        >
                            {/* Thumbnail */}
                            <div
                                className="w-full h-32 rounded-sm mb-3 flex items-center justify-center border border-px-border"
                                style={{ backgroundColor: `${project.color}15` }}
                            >
                                <FolderOpen
                                    size={24}
                                    className="text-px-text-muted group-hover:text-px-accent transition-default"
                                />
                            </div>
                            <h3 className="font-mono text-sm text-px-text mb-1">
                                {project.name}
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px] text-px-text-muted">
                                    {project.layers} layers
                                </span>
                                <span className="font-mono text-[11px] text-px-text-muted">
                                    {project.date}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
