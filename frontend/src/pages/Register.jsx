import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Briefcase } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'Student',
    department: '', year: '', rollNumber: '', clubName: '', office: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary-600">Create Account</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex items-center border rounded px-3 py-2">
            <User className="text-gray-400 mr-2" size={20} />
            <input name="name" placeholder="Full Name" className="w-full outline-none" onChange={handleChange} required />
          </div>

          <div className="flex items-center border rounded px-3 py-2">
            <Mail className="text-gray-400 mr-2" size={20} />
            <input name="email" type="email" placeholder="Email Address" className="w-full outline-none" onChange={handleChange} required />
          </div>

          <div className="flex items-center border rounded px-3 py-2">
            <Lock className="text-gray-400 mr-2" size={20} />
            <input name="password" type="password" placeholder="Password" className="w-full outline-none" onChange={handleChange} required />
          </div>

          <div className="flex items-center border rounded px-3 py-2">
            <Briefcase className="text-gray-400 mr-2" size={20} />
            <select name="role" className="w-full outline-none bg-transparent" onChange={handleChange} value={formData.role}>
              <option value="Student">Student</option>
              <option value="Admin">Admin</option>
              <option value="SeatingManager">Seating Manager</option>
              <option value="ClubCoordinator">Club Coordinator</option>
            </select>
          </div>

          {/* Role Specific Fields */}
          {formData.role === 'Student' && (
            <>
              <input name="department" placeholder="Department (e.g. CSE)" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="year" placeholder="Year (e.g. 3)" className="w-full border rounded px-3 py-2" onChange={handleChange} />
              <input name="rollNumber" placeholder="Roll Number" className="w-full border rounded px-3 py-2" onChange={handleChange} />
            </>
          )}

          {formData.role === 'ClubCoordinator' && (
            <input name="clubName" placeholder="Club Name" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          )}

          {formData.role === 'Admin' && (
            <input name="office" placeholder="Office / Department" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          )}

          <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700 transition duration-200">
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
