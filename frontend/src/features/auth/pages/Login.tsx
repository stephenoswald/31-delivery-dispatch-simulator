import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ShieldCheck,
  Bike,
  UserRound,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Brand, Button, Feedback } from '../../../components/ui';
import { DEMO_PASSWORD } from '../../../lib/constants';
import type { Role } from '../../../types/user';
export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [role, setRole] = useState<Role>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) navigate(`/${user.role}`, { replace: true });
  }, [user, navigate]);
  function demo(next: Role) {
    setRole(next);
    setEmail(next === 'admin' ? 'admin@example.com' : `${next}01@example.com`);
    setPassword(DEMO_PASSWORD);
    setError('');
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const account = await login({ email, password }, remember);
      navigate(`/${account.role}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={`auth-page auth-${role}`}>
      <section className="auth-art auth-photo">
        <img
          className="auth-rider-photo"
          src="/assets/swiftdispatch-rider.jpg"
          srcSet="/assets/swiftdispatch-rider-small.jpg 427w, /assets/swiftdispatch-rider.jpg 1024w"
          sizes="(max-width: 767px) 100vw, 48vw"
          width={1024}
          height={1536}
          alt="SwiftDispatch rider on a motorcycle with a branded delivery bag"
          fetchPriority="high"
        />
        <Brand />
        <div className="auth-art-copy">
          <span className="eyebrow">SWIFTDISPATCH · PORT HARCOURT</span>
          <h1>
            {role === 'admin' ? (
              <>
                Operational control.
                <br />
                Made simple.
              </>
            ) : role === 'rider' ? (
              <>
                Your next delivery.
                <br />
                Your next opportunity.
              </>
            ) : (
              <>
                Across your city.
                <br />
                Closer to your people.
              </>
            )}
          </h1>
          <p>
            {role === 'admin'
              ? 'Manage deliveries, coordinate riders, and keep your city connected.'
              : role === 'rider'
                ? 'Go online, find nearby requests, and deliver with confidence.'
                : 'Send packages with trusted riders. Follow every step from pickup to doorstep.'}
          </p>
          <span className="auth-zone">
            <MapPin size={15} />
            Port Harcourt delivery zone
          </span>
        </div>
        <div className="auth-art-footer">
          <ShieldCheck size={15} />
          One platform. Every delivery connected.
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-top">
          <Brand />
          <span>DELIVERY OPERATIONS PLATFORM</span>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-emblem">
            {role === 'admin' ? (
              <ShieldCheck size={25} />
            ) : role === 'rider' ? (
              <Bike size={25} />
            ) : (
              <UserRound size={25} />
            )}
          </div>
          <p className="eyebrow">{role.toUpperCase()} PORTAL</p>
          <h2>
            {role === 'admin'
              ? 'Admin login'
              : role === 'rider'
                ? 'Welcome back, rider.'
                : 'Welcome back.'}
          </h2>
          <p className="auth-subtitle">Sign in to your SwiftDispatch account.</p>
          <div className="role-tabs" aria-label="Choose account portal">
            {(['customer', 'rider', 'admin'] as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                aria-pressed={role === r}
                className={role === r ? 'selected' : ''}
                onClick={() => demo(r)}
              >
                {r === 'customer' ? (
                  <UserRound size={16} />
                ) : r === 'rider' ? (
                  <Bike size={16} />
                ) : (
                  <ShieldCheck size={16} />
                )}
                <span>{r[0].toUpperCase() + r.slice(1)}</span>
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <label>
              Email address
              <div className="input-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                />
              </div>
            </label>
            <label>
              Password
              <div className="input-icon">
                <LockKeyhole size={18} />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  minLength={8}
                  maxLength={128}
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <div className="auth-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <span>
                <ShieldCheck size={14} />
                Secure access
              </span>
            </div>
            <Feedback error={error} />
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
              <ArrowRight size={18} />
            </Button>
          </form>
        </div>
        <footer className="auth-footer">
          © {new Date().getFullYear()} SwiftDispatch<span>Port Harcourt, Nigeria</span>
        </footer>
      </section>
    </div>
  );
}
