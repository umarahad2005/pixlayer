export default function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-px-surface-elevated text-px-text-muted border-px-border',
        accent: 'bg-px-accent/15 text-px-accent border-px-accent/30 glow-accent',
        success: 'bg-px-success/15 text-px-success border-px-success/30',
        warning: 'bg-px-warning/15 text-px-warning border-px-warning/30',
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest border rounded-sm ${variants[variant]} ${className}`}
        >
            {children}
        </span>
    );
}
