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

  const roleCards = [
    { icon: GraduationCap, label: 'Student', color: 'from-primary-500 to-primary-600' },
    { icon: Shield, label: 'Admin', color: 'from-accent-500 to-accent-600' },
    { icon: Users, label: 'Staff', color: 'from-success-500 to-success-600' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-primary-900/40 via-dark-900 to-accent-900/40 flex items-center justify-center p-4 overflow-hidden relative selection:bg-primary-500/30">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-blob absolute top-20 left-10 w-96 h-96 bg-primary-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse-glow"></div>
        <div className="bg-blob absolute top-40 right-10 w-96 h-96 bg-accent-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse-glow delay-1000"></div>
        <div className="bg-blob absolute -bottom-32 left-1/2 w-96 h-96 bg-success-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-30"></div>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center z-10">
        {/* Left Side - Branding & Info */}
        <div ref={heroRef} className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/mlrit-logo.png"
                alt="MLRIT Logo"
                className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white tracking-tight">
              Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Back!</span>
            </h2>
            <p className="text-dark-300 text-lg leading-relaxed max-w-md">
              Sign in to access your personalized portal, track your academic progress, and manage your campus life.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 text-dark-200">
              <div className="w-10 h-10 bg-success-500/10 border border-success-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-success-500/10">
                <Shield className="w-5 h-5 text-success-400" />
              </div>
              <span className="font-medium">Secure & encrypted login</span>
            </div>
            <div className="flex items-center gap-4 text-dark-200">
              <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/10">
                <Users className="w-5 h-5 text-primary-400" />
              </div>
              <span className="font-medium">Unified academic portal</span>
            </div>
            <div className="flex items-center gap-4 text-dark-200">
              <div className="w-10 h-10 bg-accent-500/10 border border-accent-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/10">
                <GraduationCap className="w-5 h-5 text-accent-400" />
              </div>
              <span className="font-medium">Real-time updates & notifications</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div ref={formRef} className="w-full max-w-md mx-auto lg:mx-0">
          <div className="glass-card-dark rounded-3xl shadow-2xl p-8 lg:p-10 relative overflow-hidden group hover:border-dark-600/50 transition-all duration-500">

            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-50"></div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Sign In</h2>
              <p className="text-dark-400">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-slide-in">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Login Failed</p>
                  <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-dark-500 group-focus-within/input:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-dark-900/50 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-white placeholder-dark-600 hover:border-dark-600"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 ml-1">
                  Password
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-dark-500 group-focus-within/input:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-12 pr-4 py-3.5 bg-dark-900/50 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-white placeholder-dark-600 hover:border-dark-600"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-dark-600 rounded bg-dark-800 focus:ring-primary-500 focus:ring-offset-dark-900" />
                  <span className="ml-2 text-sm text-dark-400 group-hover:text-dark-300 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold py-3.5 px-6 rounded-xl hover:from-primary-500 hover:to-accent-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-primary-500/20 hover:-translate-y-0.5"
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

            <div className="mt-8 pt-6 border-t border-dark-700/50 text-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 text-sm text-dark-400 hover:text-white transition-colors group"
              >
                <Building className="w-4 h-4 group-hover:text-primary-400 transition-colors" />
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
