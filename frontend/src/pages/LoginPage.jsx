import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WashingMachine, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      toast.success('Login berhasil! Selamat datang.');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      {/* Ambient blobs */}
      <div style={{
        position: 'absolute', top: '-100px', left: '15%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, var(--color-glow) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', right: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, var(--color-glow) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Grid lines decoration */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--color-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
        opacity: 0.3,
      }} />

      {/* Login Card */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Card Header */}
        <div style={{
          padding: '36px 36px 28px',
          textAlign: 'center',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--color-gradient-primary-1), var(--color-gradient-primary-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 30px var(--color-shadow-glass)',
          }}>
            <WashingMachine size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '6px' }}>
            LaundryPro
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)' }}>
            Sistem Manajemen Laundry
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 36px 36px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{
                position: 'absolute', left: '13px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="email@laundry.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                id="login-email"
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{
                position: 'absolute', left: '13px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }} />
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: '42px' }}
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '13px', fontSize: '15px', borderRadius: '12px' }}
            id="login-submit"
          >
            {isLoading ? (
              <><Loader2 size={17} style={{ animation: 'spin 0.7s linear infinite' }} /> Memproses...</>
            ) : 'Masuk ke Sistem'}
          </button>

          {/* Demo credentials */}
          <div style={{
            marginTop: '24px',
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--color-bg-table-hover)',
            border: '1px solid var(--color-border-subtle)',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>
              AKUN DEMO
            </div>
            {[
              { role: 'Admin', email: 'admin@laundry.com' },
              { role: 'Operator', email: 'operator@laundry.com' },
              { role: 'Pimpinan', email: 'pimpinan@laundry.com' },
            ].map(d => (
              <button
                type="button"
                key={d.role}
                onClick={() => { setEmail(d.email); setPassword('password123'); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 0', fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--color-text-accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}
              >
                <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>→</span>
                <strong style={{ color: 'inherit' }}>{d.role}:</strong> {d.email}
              </button>
            ))}
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              Password: password123
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
