import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loginUser, registerUser } from '../services/api';
import './Login.css';

export default function Login() {
  const { login, register } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign In Form States
  const [signInInput, setSignInInput] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form States
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInInput || !signInPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await loginUser({
        usernameOrEmail: signInInput,
        password: signInPassword,
      });
      login(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signUpUsername || !signUpEmail || !signUpPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await registerUser({
        username: signUpUsername,
        email: signUpEmail,
        password: signUpPassword,
      });
      register(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(prev => !prev);
    setError('');
  };

  return (
    <div className="login-container">
      <div className={`login-card ${isSignUp ? 'signup-active' : ''}`}>
        
        {/* Forms Container */}
        <div className="forms-container">
          
          {/* Sign In Form */}
          <form className="form form-signin" onSubmit={handleSignIn}>
            <h2 className="form-title">Sign In</h2>
            <div className="social-container">
              <a href="#" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a href="#" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>
            </div>
            <span className="form-subtitle">or use your email account</span>
            
            {error && !isSignUp && <div className="auth-error">{error}</div>}
            
            <input 
              type="text" 
              placeholder="Email / Username" 
              className="auth-input" 
              required
              value={signInInput}
              onChange={(e) => setSignInInput(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="auth-input" 
              required
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
            />
            <a href="#" className="forgot-password-link">Forgot password?</a>
            <button className="btn-auth" type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'SIGN IN'}
            </button>
            <button type="button" className="btn-auth-toggle-mobile" onClick={toggleMode}>
              Don't have an account? Sign Up
            </button>
          </form>

          {/* Sign Up Form */}
          <form className="form form-signup" onSubmit={handleSignUp}>
            <h2 className="form-title">Create Account</h2>
            <div className="social-container">
              <a href="#" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a href="#" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>
            </div>
            <span className="form-subtitle">or use your email for registration</span>
            
            {error && isSignUp && <div className="auth-error">{error}</div>}

            <input 
              type="text" 
              placeholder="Username" 
              className="auth-input" 
              required
              value={signUpUsername}
              onChange={(e) => setSignUpUsername(e.target.value)}
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="auth-input" 
              required
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="auth-input" 
              required
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
            />
            <button className="btn-auth" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'SIGN UP'}
            </button>
            <button type="button" className="btn-auth-toggle-mobile" onClick={toggleMode}>
              Already have an account? Sign In
            </button>
          </form>

        </div>

        {/* Sliding Panel Container */}
        <div className="overlay-container">
          <div className="overlay">
            
            {/* Left Overlay Panel (Visible when Sign Up is active, has SIGN IN button) */}
            <div className="overlay-panel overlay-left">
              <h2 className="overlay-title">Welcome Back!</h2>
              <p className="overlay-description">
                Sign in to track your most recent expenses and savings in your secure vault.
              </p>
              <button className="btn-overlay-toggle" onClick={toggleMode}>
                SIGN IN
              </button>
            </div>

            {/* Right Overlay Panel (Visible when Sign In is active, has SIGN UP button) */}
            <div className="overlay-panel overlay-right">
              <h2 className="overlay-title">Hey There!</h2>
              <p className="overlay-description">
                Start your journey here and begin securing your personal financial data right away.
              </p>
              <button className="btn-overlay-toggle" onClick={toggleMode}>
                SIGN UP
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
