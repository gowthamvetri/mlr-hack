import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../services/api';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { Lock, Mail, GraduationCap, ArrowRight, Shield, Users, Building, AlertCircle } from 'lucide-react';
import gsap from 'gsap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMutation, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // GSAP Refs
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const formRef = useRef(null);
  const cardsRef = useRef(null);

  // GSAP Entry Animations - using fromTo for guaranteed visibility
  useEffect(() => {
    if (!containerRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Background blobs animation
        gsap.to('.bg-blob', {
          scale: 1.1,
          duration: 4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: 0.5
        });

        // Hero section animation
        if (heroRef.current) {
          gsap.fromTo(heroRef.current.children,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
          );
        }

        // Role cards animation
        if (cardsRef.current) {
          gsap.fromTo(cardsRef.current.children,
            { opacity: 0, y: 20, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)', delay: 0.3 }
          );
        }

        // Form animation - animate the whole card first
        if (formRef.current) {
          gsap.fromTo(formRef.current,
            { opacity: 0, x: 30 },
            { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', delay: 0.2 }
          );
        }
      }, containerRef);

      return () => ctx.revert();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials({ ...userData, email }));

      const role = userData.role || userData.user?.role;
      if (role === 'Student') navigate('/student');
      else if (role === 'Admin') navigate('/admin');
      else if (role === 'SeatingManager') navigate('/seating-manager');
      else if (role === 'ClubCoordinator') navigate('/club-coordinator');
      else if (role === 'Staff') navigate('/staff');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.data?.message || err.message || 'Login failed');
      // Shake animation on error
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: [-10, 10, -10, 10, 0],
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 overflow-hidden relative selection:bg-violet-100">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-blob absolute top-20 left-10 w-96 h-96 bg-violet-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse-glow"></div>
        <div className="bg-blob absolute top-40 right-10 w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse-glow delay-1000"></div>
        <div className="bg-blob absolute -bottom-32 left-1/2 w-96 h-96 bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-60"></div>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center z-10">
        {/* Left Side - Branding & Info */}
        <div ref={heroRef} className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/mlrit-logo.png"
                alt="MLRIT Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">
              Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">Back!</span>
            </h2>
            <p className="text-zinc-600 text-lg leading-relaxed max-w-md">
              Sign in to access your personalized portal, track your academic progress, and manage your campus life.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 text-zinc-700">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="font-medium">Secure & encrypted login</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-700">
              <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <span className="font-medium">Unified academic portal</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-700">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium">Real-time updates & notifications</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div ref={formRef} className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-3xl shadow-xl border border-zinc-200 p-8 lg:p-10 relative overflow-hidden group hover:border-zinc-300 transition-all duration-500">

            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500 opacity-80"></div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Sign In</h2>
              <p className="text-zinc-500">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-slide-in">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Login Failed</p>
                  <p className="text-xs text-red-600/80 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-zinc-400 group-focus-within/input:text-violet-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 placeholder-zinc-400 hover:border-zinc-300"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">
                  Password
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-zinc-400 group-focus-within/input:text-violet-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 placeholder-zinc-400 hover:border-zinc-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 text-violet-600 border-zinc-300 rounded bg-white focus:ring-violet-500" />
                  <span className="ml-2 text-sm text-zinc-500 group-hover:text-zinc-700 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="opacity-90">Signing in...</span>
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors group"
              >
                <Building className="w-4 h-4 group-hover:text-violet-600 transition-colors" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
