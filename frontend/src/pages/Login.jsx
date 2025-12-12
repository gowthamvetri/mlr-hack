import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../services/api';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { Lock, Mail, GraduationCap, ArrowRight, Shield, Users, Building, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  /* REMOVED DUPLICATE STATE DECLARATIONS */
  // loading state is now handled by RTK mutation hook
  const [loginMutation, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // setLoading(true); // Handled by isLoading from hook if we used it, but for now we kept local state compatible
    // Actually, let's use the local state to match the existing return JSX that uses 'loading'
    setLoading(true);

    try {
      // RTK Query mutation expects one argument usually. Assuming it takes { email, password }
      const userData = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials({ ...userData, email })); // adjust based on response structure

      const role = userData.role || userData.user?.role;
      if (role === 'Student') navigate('/student');
      else if (role === 'Admin') navigate('/admin');
      else if (role === 'SeatingManager') navigate('/seating-manager');
      else if (role === 'ClubCoordinator') navigate('/club-coordinator');
      else if (role === 'Staff') navigate('/staff');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    { icon: GraduationCap, label: 'Student', color: 'from-blue-500 to-blue-600' },
    { icon: Shield, label: 'Admin', color: 'from-red-500 to-red-600' },
    { icon: Users, label: 'Staff', color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/mlrit-logo.png"
                alt="MLRIT Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Sign in to access your personalized dashboard, track your progress, and stay connected with your academic journey.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {roleCards.map((role, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700">{role.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span>Secure & encrypted login</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span>24/7 access to your portal</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <span>Real-time updates & notifications</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
              <p className="text-gray-500">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Login Failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="mt-6">
              <Link
                to="/"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Building className="w-4 h-4" />
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
