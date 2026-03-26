import { motion } from 'framer-motion';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    onClick,
    disabled = false,
    className = '',
    ...props
}) {
    const baseStyles =
        'inline-flex items-center justify-center gap-2 font-mono text-sm font-medium transition-default cursor-pointer select-none';

    const variants = {
        primary:
            'bg-px-accent text-white hover:bg-px-accent-hover active:scale-[0.97]',
        secondary:
            'bg-px-surface text-px-text border border-px-border hover:bg-px-surface-elevated',
        ghost:
            'bg-transparent text-px-text-muted hover:text-px-text hover:bg-px-surface',
        danger:
            'bg-px-error/10 text-px-error border border-px-error/20 hover:bg-px-error/20',
    };

    const sizes = {
        sm: 'px-2.5 py-1.5 text-xs rounded-sm',
        md: 'px-4 py-2 text-sm rounded-sm',
        lg: 'px-6 py-2.5 text-sm rounded-sm',
    };

    return (
        <motion.button
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${className}`}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
            {children}
        </motion.button>
    );
}
