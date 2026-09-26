import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Warehouse,
  Boxes,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  Package,
  Truck,
  X
} from 'lucide-react';
import logoDarkSvg from '../assets/logo.svg';
import faviconSvg from '../assets/fevicon.svg';
import { authApi } from '../services/api';

export default function Login({ onLoginSuccess }) {
  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState('signin');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState('INVENTORY_MANAGER');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot Password / OTP Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1: Enter Email, 2: Verify OTP Only, 3: Set New Password, 4: Success
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const navigate = useNavigate();

  // Handle Sign In Submission
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signInEmail || !signInEmail.includes('@')) {
      setErrorMessage('Please provide a valid corporate email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login(signInEmail, signInPassword);
      const user = response?.data?.user || {
        name: signInEmail.split('@')[0],
        email: signInEmail,
        role: 'INVENTORY_MANAGER'
      };
      onLoginSuccess(user);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up (Registration) Submission
  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signUpName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!signUpEmail || !signUpEmail.includes('@')) {
      setErrorMessage('Please provide a valid work email.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.register({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        role: signUpRole,
        department: signUpRole === 'INVENTORY_MANAGER' ? 'Inventory Management' : 'Warehouse Floor'
      });

      const user = response?.data?.user;
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        onLoginSuccess(user);
        navigate('/dashboard');
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Credentials Filler for Hackathon Evaluation
  const handleAutofillCredentials = (role) => {
    setAuthMode('signin');
    setErrorMessage('');
    if (role === 'ADMIN') {
      setSignInEmail('admin@stocksense.io');
      setSignInPassword('Admin@1234');
    } else if (role === 'INVENTORY_MANAGER') {
      setSignInEmail('sarah.jenkins@stocksense.io');
      setSignInPassword('Manager@1234');
    } else {
      setSignInEmail('marcus.vance@stocksense.io');
      setSignInPassword('Staff@1234');
    }
  };

  // OTP Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    try {
      await authApi.sendOtp(resetEmail);
      setOtpStep(2);
    } catch (err) {
      setResetError(err.message || 'Failed to dispatch verification code. Please check email.');
    } finally {
      setResetLoading(false);
    }
  };

  // OTP Step 2: Pre-verify the OTP code first before revealing password fields
  const handleVerifyOtpCode = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetOtp || resetOtp.trim().length !== 6) {
      setResetError('Please enter the complete 6-digit verification code.');
      return;
    }

    setResetLoading(true);
    try {
      await authApi.checkOtp(resetEmail, resetOtp.trim());
      setOtpStep(3); // Advance to set new password step ONLY after OTP is confirmed!
    } catch (err) {
      setResetError(err.message || 'Invalid or expired OTP code. Please verify and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // OTP Step 3: Set and Confirm New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setResetLoading(true);
    try {
      await authApi.resetPassword(resetEmail, resetOtp.trim(), resetNewPassword);
      setOtpStep(4);
    } catch (err) {
      setResetError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowForgotModal(false);
    setOtpStep(1);
    setResetOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError('');
  };

  return (
    <div className="login-page">
      {/* Brand Hero Showcase Side */}
      <div className="login-brand">
        <div className="login-brand-content">
          <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
            <img
              src={logoDarkSvg}
              alt="StockSense by CyberCreatures"
              style={{ height: '48px', width: 'auto', maxWidth: '280px', objectFit: 'contain' }}
            />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', padding: '6px 14px', borderRadius: 'var(--radius-full)', marginBottom: '24px', backdropFilter: 'blur(8px)' }}>
            <img src={faviconSvg} alt="StockSense" style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Modular Inventory Management System</span>
          </div>

          <h1>Real-Time Stock. Zero Mismatches.</h1>
          <p>
            Digitize your inventory operations with real-time stock ledgers, automated receipts, pick-pack delivery validation, and location-level tracking.
          </p>

          {/* Core Roles Highlight */}
          <div className="login-features" style={{ marginTop: '32px' }}>
            <div className="login-feature">
              <Warehouse size={20} />
              <div>
                <strong>Inventory Managers</strong>
                <div style={{ fontSize: '12px', opacity: 0.85 }}>Oversee incoming receipts, delivery dispatches & stock balance</div>
              </div>
            </div>
            <div className="login-feature">
              <Boxes size={20} />
              <div>
                <strong>Warehouse Staff</strong>
                <div style={{ fontSize: '12px', opacity: 0.85 }}>Perform rack transfers, order picking, shelving & physical counts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="login-form-side">
        <div className="login-form-container">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <img
              src={logoDarkSvg}
              alt="StockSense by CyberCreatures"
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', background: 'var(--color-neutral-100)', padding: '4px', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                background: authMode === 'signin' ? 'var(--color-neutral-0)' : 'transparent',
                color: authMode === 'signin' ? 'var(--color-primary-600)' : 'var(--color-neutral-500)',
                boxShadow: authMode === 'signin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                background: authMode === 'signup' ? 'var(--color-neutral-0)' : 'transparent',
                color: authMode === 'signup' ? 'var(--color-primary-600)' : 'var(--color-neutral-500)',
                boxShadow: authMode === 'signup' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', padding: '10px 14px', marginBottom: '16px' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-danger-600)', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', padding: '10px 14px', marginBottom: '16px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-success-600)', flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="signin-email">
                  Work Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signin-email"
                    type="email"
                    className="form-input"
                    placeholder="name@company.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signin-password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signin-password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)' }} />
                </div>
              </div>

              <div className="login-extras">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember session</span>
                </label>

                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    setResetEmail(signInEmail);
                    setOtpStep(1);
                    setResetError('');
                    setShowForgotModal(true);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Authenticating...
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Sign In to Dashboard
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sarah Jenkins"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">
                  Corporate Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-email"
                    type="email"
                    className="form-input"
                    placeholder="name@company.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-role">
                  Operational Role
                </label>
                <select
                  id="signup-role"
                  className="form-select"
                  value={signUpRole}
                  onChange={(e) => setSignUpRole(e.target.value)}
                  style={{ height: '42px', fontSize: 'var(--font-size-sm)' }}
                >
                  <option value="INVENTORY_MANAGER">Inventory Manager (Inbound/Outbound/Control)</option>
                  <option value="STAFF">Warehouse Staff (Picking/Shelving/Counting)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">
                  Password (min. 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-password"
                    type="password"
                    className="form-input"
                    placeholder="Create a strong password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)' }} />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Creating Profile...
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Create Account & Enter
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Clean Quick Credentials Fillers */}
          <div className="login-divider">Quick Demo Credentials</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleAutofillCredentials('ADMIN')}
              title="Pre-fills credentials for Admin role"
              style={{ padding: '6px 4px', fontSize: '11px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Shield size={13} style={{ color: 'var(--color-primary-500)' }} /> Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleAutofillCredentials('INVENTORY_MANAGER')}
              title="Pre-fills credentials for Inventory Manager role"
              style={{ padding: '6px 4px', fontSize: '11px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Package size={13} style={{ color: 'var(--color-warning-500)' }} /> Inv. Mgr
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleAutofillCredentials('STAFF')}
              title="Pre-fills credentials for Warehouse Staff role"
              style={{ padding: '6px 4px', fontSize: '11px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Truck size={13} style={{ color: 'var(--color-success-500)' }} /> Staff
            </button>
          </div>
        </div>
      </div>

      {/* OTP-Based Password Reset Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={closeResetModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} style={{ color: 'var(--color-primary-600)' }} />
                <h3 className="modal-title">OTP Password Recovery</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeResetModal}
                aria-label="Close recovery modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {resetError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)', padding: '8px 12px', marginBottom: '14px' }}>
                  <AlertCircle size={16} style={{ color: 'var(--color-danger-600)', flexShrink: 0 }} />
                  <span>{resetError}</span>
                </div>
              )}

              {otpStep === 1 && (
                <form onSubmit={handleSendOtp}>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-600)', marginBottom: '16px' }}>
                    Enter your registered email address. We will transmit a 6-digit one-time verification code (OTP).
                  </p>
                  <div className="form-group">
                    <label className="form-label">Registered Work Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. sarah.jenkins@stocksense.io"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                    <button type="button" className="btn btn-secondary" onClick={closeResetModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                      {resetLoading ? 'Sending OTP...' : 'Send 6-Digit OTP'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Input and verify OTP code ONLY */}
              {otpStep === 2 && (
                <form onSubmit={handleVerifyOtpCode}>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-600)', marginBottom: '16px' }}>
                    A 6-digit one-time code was sent to <strong>{resetEmail}</strong>. Please enter the code below to verify your identity.
                  </p>
                  <div className="form-group" style={{ marginBottom: '18px' }}>
                    <label className="form-label">6-Digit Verification Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 549210"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: '6px', textAlign: 'center', fontWeight: 700, fontSize: '20px', height: '48px' }}
                      required
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setOtpStep(1)}
                      style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ArrowLeft size={14} /> Re-enter email
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn btn-secondary" onClick={closeResetModal}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={resetLoading || resetOtp.length !== 6}>
                        {resetLoading ? 'Verifying Code...' : 'Verify OTP Code'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Step 3: Enter and Confirm New Password (ONLY after OTP verified) */}
              {otpStep === 3 && (
                <form onSubmit={handleResetPassword}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-success-50)', color: 'var(--color-success-700)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '16px' }}>
                    <CheckCircle2 size={16} />
                    <span>OTP Verified! Enter your new password below.</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">New Password (min. 6 characters)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter new password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Re-enter new password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                    <button type="button" className="btn btn-secondary" onClick={closeResetModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                      {resetLoading ? 'Updating Password...' : 'Save & Update Password'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: Success Confirmation */}
              {otpStep === 4 && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <CheckCircle2 size={48} style={{ color: 'var(--color-success-500)', margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>Password Reset Complete!</h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)', marginTop: '6px', marginBottom: '20px' }}>
                    Your credentials have been securely updated. You can now sign in with your new password.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      setSignInEmail(resetEmail);
                      closeResetModal();
                    }}
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
