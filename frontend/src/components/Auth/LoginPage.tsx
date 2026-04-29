import React from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import '../../index.css';

const LoginPage: React.FC<{ goToSignup: () => void; }>
 = ({ goToSignup }) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    if (!email || !password) {
      setError("Please fill all fields.");
      setLoading(false);
      return;
    }

    try {
      // Call real backend login API
      const response = await login({ email, password });
      
      // Store token and user info (response contains { success: true, data: { token, user } })
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userToken', response.data.token); // Keep for compatibility
      localStorage.setItem('userEmail', email);
      
      // Trigger custom event to update authentication state immediately
      window.dispatchEvent(new Event('userLoggedIn'));
      
      setSuccess("Login successful! Redirecting...");
      
      // Redirect to dashboard immediately
      navigate('/dashboard', { replace: true });
      
    } catch (error: any) {
      setError(error.message || "Invalid credentials or login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f4f2] to-[#e0e7ff]">
      <div className="bg-white rounded-2xl shadow-2xl flex w-full max-w-4xl overflow-hidden border border-gray-200">
        {/* Illustration Section */}
        <div className="w-1/2 flex items-center justify-center bg-[#f5f4f2] p-8">
          <img
            src="/Login-Illustration.png"
            alt="Login Illustration"
            className="h-[420px] object-contain drop-shadow-lg rounded-xl"
            style={{ maxHeight: '420px', width: 'auto' }}
          />
        </div>
        {/* Login Form Section */}
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-2 text-blue-700" style={{ fontFamily: 'Cedarville Cursive, cursive' }}>Login</h2>
          <p className="text-gray-500 mb-6">Sign in to your account</p>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email address"
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-3 rounded-lg font-semibold transition duration-200 hover:bg-blue-700 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
          <div className="mt-6 text-center text-gray-500 text-sm">
            Don't have an account? <button type="button" className="text-blue-600 font-medium hover:underline" onClick={goToSignup}>Sign up</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;