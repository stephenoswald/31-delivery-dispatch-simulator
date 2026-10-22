import { DEMO_PASSWORD } from '../../../lib/constants';
export function DemoNote() {
  return (
    <div className="demo-login">
      <span className="demo-label">TAKE A LOOK AROUND</span>
      <p>Exploring? Choose an account above to fill in demo credentials.</p>
      <span>
        All demo accounts use <code>{DEMO_PASSWORD}</code>
      </span>
    </div>
  );
}
