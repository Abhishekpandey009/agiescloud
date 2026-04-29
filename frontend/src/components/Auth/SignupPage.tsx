import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../api/auth';
import '../../index.css';

const SignupPage: React.FC = () => {
  useEffect(() => {
    // Dynamically add Cedarville Cursive font from Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  // State for form
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill all fields.");
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Call real backend signup API
      const response = await signup({ username: name, email, password });
      
      // Store token and user info (response contains { success: true, data: { token, user } })
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userToken', response.data.token); // Keep for compatibility
      localStorage.setItem('userEmail', email);
      
      // Trigger custom event to update authentication state immediately
      window.dispatchEvent(new Event('userLoggedIn'));
      
      setSuccess("Account created successfully! Redirecting to dashboard...");
      
      // Redirect to dashboard after successful signup
      navigate('/dashboard', { replace: true });
      
    } catch (error: any) {
      setError(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f4f2] to-[#e0e7ff]">
      <div className="bg-white rounded-2xl shadow-2xl flex w-full max-w-4xl overflow-hidden border border-gray-200 mt-20">
        {/* Illustration Section */}
        <div className="w-1/2 flex items-center justify-center bg-[#f5f4f2] p-8">
          <img
            src="/Signup-Illustration.png"
            alt="Signup Illustration"
            className="h-[420px] object-contain drop-shadow-lg rounded-xl"
            style={{ maxHeight: '420px', width: 'auto' }}
          />
        </div>
        {/* Signup Form Section */}
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-2 text-blue-700" style={{ fontFamily: 'Cedarville Cursive, cursive' }}>Sign up</h2>
          <p className="text-gray-500 mb-6">Tired of Local storage ?? Create an account...</p>
          <div className="flex gap-4 mb-6">
            <button className="flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100">
              <span className="w-6 h-6 flex items-center justify-center">
                {/* ...existing code... */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
                  <g>
                    <path fill="#4285F4" d="M24 9.5c3.54 0 6.36 1.22 8.29 2.25l6.18-6.18C34.36 2.16 29.52 0 24 0 14.64 0 6.4 5.64 2.44 13.86l7.6 5.91C12.36 13.36 17.76 9.5 24 9.5z"/>
                    <path fill="#34A853" d="M46.1 24.5c0-1.54-.14-3.02-.39-4.45H24v8.43h12.44c-.54 2.9-2.18 5.36-4.64 7.02l7.2 5.6C43.6 37.36 46.1 31.36 46.1 24.5z"/>
                    <path fill="#FBBC05" d="M10.04 28.77c-.48-1.44-.76-2.98-.76-4.77s.28-3.33.76-4.77l-7.6-5.91C.86 16.64 0 20.2 0 24c0 3.8.86 7.36 2.44 10.68l7.6-5.91z"/>
                    <path fill="#EA4335" d="M24 48c5.52 0 10.16-1.82 13.89-4.95l-7.2-5.6c-2.01 1.36-4.59 2.17-6.69 2.17-5.24 0-9.64-3.86-11.56-9.27l-7.6 5.91C6.4 42.36 14.64 48 24 48z"/>
                  </g>
                </svg>
              </span>
              Google
            </button>
            <button className="flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100">
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" className="w-5 h-5" />
              Apple ID
            </button>
          </div>
          <div className="flex items-center mb-6">
            <div className="flex-grow border-t" />
            <span className="mx-2 text-gray-400">or</span>
            <div className="flex-grow border-t" />
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Name"
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email address"
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <div>
              <input
                type="password"
                placeholder="Password"
                className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must contain at least one uppercase letter, lowercase letter, and number (min 6 characters)
              </p>
            </div>
            <input
              type="password"
              placeholder="Confirm Password"
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-3 rounded-lg font-semibold transition duration-200 hover:bg-blue-700 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <div className="mt-6 text-center text-gray-500 text-sm">
            Already have an account? <a href="/login" className="text-blue-600 font-medium hover:underline">Login</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
