import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { apiClient } from '../lib/apiClient';
import { useToast } from '../components/ui/Toast';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = isLogin
                ? { email, password }
                : { email, password, name };

            const data = await apiClient.post(endpoint, body);
            localStorage.setItem('px_token', data.token);
            toast.success(isLogin ? 'Welcome back!' : 'Account created');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-px-bg flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-px-accent rounded-sm flex items-center justify-center">
                        <span className="font-mono text-base font-bold text-white">PX</span>
                    </div>
                    <span className="font-display text-xl font-semibold tracking-wide text-px-text">
                        PIXLAYER
                    </span>
                </div>

                {/* Card */}
                <div className="bg-px-surface border border-px-border rounded-sm p-6">
                    {/* Toggle */}
                    <div className="flex items-center gap-1 mb-6 p-0.5 bg-px-bg rounded-sm border border-px-border">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 font-mono text-xs rounded-sm transition-default cursor-pointer ${isLogin
                                    ? 'bg-px-accent text-white'
                                    : 'text-px-text-muted hover:text-px-text'
                                }`}
                        >
                            Log in
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 font-mono text-xs rounded-sm transition-default cursor-pointer ${!isLogin
                                    ? 'bg-px-accent text-white'
                                    : 'text-px-text-muted hover:text-px-text'
                                }`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <InputField
                                icon={User}
                                type="text"
                                placeholder="Full name"
                                value={name}
                                onChange={setName}
                            />
                        )}
                        <InputField
                            icon={Mail}
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={setEmail}
                        />
                        <InputField
                            icon={Lock}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={setPassword}
                        />

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            icon={loading ? Loader2 : ArrowRight}
                            disabled={loading}
                        >
                            {loading
                                ? 'Please wait...'
                                : isLogin
                                    ? 'Log in'
                                    : 'Create account'}
                        </Button>
                    </form>

                    <p className="text-center font-mono text-[11px] text-px-text-muted mt-4">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-px-accent hover:text-px-accent-hover transition-default cursor-pointer"
                        >
                            {isLogin ? 'Register' : 'Log in'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

function InputField({ icon: Icon, type, placeholder, value, onChange }) {
    return (
        <div className="relative">
            <Icon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-px-text-muted"
            />
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-px-bg text-px-text font-mono text-sm border border-px-border rounded-sm outline-none focus:border-px-accent transition-default placeholder:text-px-text-muted"
            />
        </div>
    );
}
