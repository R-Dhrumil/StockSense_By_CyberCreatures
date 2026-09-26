import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  BarChart,
  Warehouse,
  Boxes
} from 'lucide-react';
import logoSvg from '../assets/logo.svg';
import faviconSvg from '../assets/fevicon.svg';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('a.vance@stocksense.io');
  const [password, setPassword] = useState('••••••••••••');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid business email address.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Please enter your secure password.');
      return;
    }
    if (is2FAEnabled && twoFactorCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Authenticator verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        id: 'USR-01',
        name: 'Alexandria Vance',
        email: email,
        role: 'Admin',
        avatar: 'AV'
      });
      navigate('/dashboard');
    }, 700);
  };

  const handleQuickRoleLogin = (role, emailAddr, name, avatar) => {
    setEmail(emailAddr);
    setPassword('demopassword123');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        id: 'DEMO-' + role.substring(0, 3).toUpperCase(),
        name: name,
        email: emailAddr,
        role: role,
        avatar: avatar
      });
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="login-page">
      {/* Brand Hero Showcase Side */}
      <div className="login-brand">
        <div className="login-brand-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', padding: '6px 14px', borderRadius: 'var(--radius-full)', marginBottom: '24px', backdropFilter: 'blur(8px)' }}>
            <img src={faviconSvg} alt="StockSense" style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Next-Gen Cloud Inventory OS</span>
          </div>

          <h1>Real-Time Precision. Zero Stockouts.</h1>
          <p>
            Unify your multi-warehouse stock, automate purchase replenishment, and track end-to-end fulfillment with military-grade telemetry.
          </p>

          {/* Feature Highlights Grid */}
          <div className="login-features">
            <div className="login-feature">
              <Warehouse size={20} />
              <span>Multi-Warehouse Balance</span>
            </div>
            <div className="login-feature">
              <Boxes size={20} />
              <span>Batch & Serial Tracking</span>
            </div>
            <div className="login-feature">
              <BarChart size={20} />
              <span>Turnover & Aging Analytics</span>
            </div>
            <div className="login-feature">
              <ShieldCheck size={20} />
              <span>Audit-Compliant Logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-form-header">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px' }}>
              <img 
                src={logoSvg} 
                alt="StockSense by CyberCreatures" 
                style={{ height: '48px', width: 'auto', objectFit: 'contain' }} 
              />
            </div>

            <h2>Sign in to your console</h2>
            <p>Enter your corporate credentials or choose a 1-click demo role below.</p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', padding: '10px 14px' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-danger-600)' }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">
                Work Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email-input"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password-input"
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)' }} />
              </div>
            </div>

            {/* 2FA Toggle & Code input */}
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-neutral-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-neutral-700)' }}>
                  Two-Factor Authentication (2FA)
                </span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={is2FAEnabled}
                    onChange={(e) => setIs2FAEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {is2FAEnabled && (
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    Authenticator 6-Digit Code
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 592810"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="login-extras">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember this workstation</span>
              </label>

              <button
                type="button"
                className="forgot-link"
                onClick={() => setShowForgotModal(true)}
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
                  Verifying Secure Session...
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  Access Enterprise Dashboard
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="login-divider">or test drive as demo role</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickRoleLogin('Admin', 'a.vance@stocksense.io', 'Alexandria Vance', 'AV')}
            >
              👑 Admin Mode
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickRoleLogin('Inventory Manager', 's.jenkins@stocksense.io', 'Sarah Jenkins', 'SJ')}
            >
              📦 Inventory Mgr
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickRoleLogin('Warehouse Staff', 'm.vance@stocksense.io', 'Marcus Vance', 'MV')}
            >
              🚚 Warehouse Staff
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickRoleLogin('Viewer', 'j.sterling@cybercreatures.com', 'Julian Sterling', 'JS')}
            >
              👁️ Viewer Mode
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Your Master Password</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {forgotSuccess ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle2 size={48} style={{ color: 'var(--color-success-500)', margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>Reset link dispatched!</h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)', marginTop: '6px' }}>
                    Check your inbox at <strong>{forgotEmail}</strong> for instructions to reset your password.
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-600)', marginBottom: '16px' }}>
                    Enter the corporate email associated with your StockSense profile. We'll send a 15-minute temporary reset token.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Corporate Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. your.name@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {forgotSuccess ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowForgotModal(false)}
                >
                  Return to Login
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (forgotEmail.includes('@')) setForgotSuccess(true);
                    }}
                  >
                    Send Recovery Email
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
