import React, { useState } from 'react';
import { LoginUser, SendOTP } from '../../APIs/auth';
import { useNavigate } from 'react-router-dom';

type LoginStep = 'email' | 'otp' | 'success';

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic email format validation
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Fake API call to send OTP
  const sendOtp = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      // Replace with real API call, e.g.:
      // await fetch('/admins-api/send-otp', { method: 'POST', body: JSON.stringify({ email }) });

      const res = await SendOTP({ email: email })
      if (res) {
        setStep('otp');
      } else {
        throw new Error("Error while logging in")
      }
    } catch (e) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fake API call to verify OTP
  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);
    setError(null);
    try {
      // Replace with real API call, e.g.:
      // const res = await fetch('/admins-api/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
      // if (!res.ok) throw new Error('Invalid OTP');

      const res = await LoginUser({ email, otp })
      if (!res) {
        throw new Error('Invalid OTP');
      }
      navigate("/dashboard")
    } catch (e: any) {
      setError(e.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    sendOtp(email);
  };

  const onOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP sent to your email.');
      return;
    }
    verifyOtp(email, otp);
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: '5rem auto',
        padding: '2rem',
        border: '1px solid #ddd',
        borderRadius: 8,
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Admin Portal Login
      </h2>

      {step === 'email' && (
        <form onSubmit={onEmailSubmit}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 8 }}>
            Enter your admin email:
          </label>
          <input
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginBottom: '1rem',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: '1rem',
            }}
            disabled={loading}
            autoFocus
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6rem',
              backgroundColor: '#000434',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          {error && (
            <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={onOtpSubmit}>
          <p>
            OTP sent to <b>{email}</b>. Please check your email.
          </p>

          <label htmlFor="otp" style={{ display: 'block', marginBottom: 8 }}>
            Enter 6-digit OTP:
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.trim())}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginBottom: '1rem',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: '1rem',
              letterSpacing: '0.3rem',
              textAlign: 'center',
            }}
            disabled={loading}
            autoFocus
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6rem',
              backgroundColor: '#000434',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '0.5rem',
            }}
          >
            {loading ? 'Verifying OTP...' : 'Verify OTP'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => sendOtp(email)}
            style={{
              width: '100%',
              padding: '0.6rem',
              backgroundColor: 'transparent',
              color: '#000434',
              border: '1px solid #000434',
              borderRadius: 4,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Resend OTP
          </button>

          {error && (
            <p style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
        </form>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <h3>Login Successful!</h3>
          <p>Welcome back, Admin.</p>
        </div>
      )}
    </div>
  );
};

export default Login;
