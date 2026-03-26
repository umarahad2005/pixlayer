import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ToastProvider } from './components/ui/Toast';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const Auth = lazy(() => import('./pages/Auth'));

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-px-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-px-accent rounded-sm flex items-center justify-center">
          <span className="font-mono text-sm font-bold text-white">PX</span>
        </div>
        <div className="w-6 h-6 border-2 border-px-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/editor/:projectId?" element={<Editor />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
