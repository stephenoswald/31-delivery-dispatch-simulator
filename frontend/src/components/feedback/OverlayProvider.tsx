import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '../ui';
type Prompt = { title: string; description: string; action?: string; danger?: boolean };
interface FeedbackApi {
  toast: (message: string, tone?: 'success' | 'info') => void;
  confirm: (prompt: Prompt) => Promise<boolean>;
}
const Context = createContext<FeedbackApi | null>(null);
export function useFeedback() {
  const value = useContext(Context);
  if (!value) throw Error('Missing feedback provider');
  return value;
}
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState('');
  const [tone, setTone] = useState<'success' | 'info'>('success');
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const resolver = useRef<((yes: boolean) => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  function finish(yes: boolean) {
    resolver.current?.(yes);
    resolver.current = null;
    setPrompt(null);
    previousFocus.current?.focus();
  }
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (prompt) dialog.current?.showModal();
    else dialog.current?.close();
  }, [prompt]);
  useEffect(() => () => resolver.current?.(false), []);
  return (
    <Context.Provider
      value={{
        toast: (message, nextTone = 'success') => {
          setNotice(message);
          setTone(nextTone);
        },
        confirm: (options) =>
          new Promise((resolve) => {
            resolver.current?.(false);
            previousFocus.current = document.activeElement as HTMLElement;
            resolver.current = resolve;
            setPrompt(options);
          }),
      }}
    >
      {children}
      {notice && (
        <div className={`toast toast-${tone}`} role="status">
          {tone === 'info' ? <Info size={20} /> : <CheckCircle2 size={20} />}
          <span>{notice}</span>
          <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
            <X size={18} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="confirmation-modal"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        onKeyDown={(e) => {
          if (e.key !== 'Tab') return;
          const controls = Array.from(
            e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
          );
          const first = controls[0],
            last = controls[controls.length - 1];
          if (!first || !last) return;
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
        onCancel={(e) => {
          e.preventDefault();
          finish(false);
        }}
      >
        <div className={`modal-icon ${prompt?.danger ? 'danger' : ''}`}>
          <AlertTriangle size={25} />
        </div>
        <h2 id="confirm-title">{prompt?.title}</h2>
        <p id="confirm-description">{prompt?.description}</p>
        <div className="modal-actions">
          <Button variant="secondary" autoFocus onClick={() => finish(false)}>
            Go back
          </Button>
          <Button variant={prompt?.danger ? 'danger' : 'primary'} onClick={() => finish(true)}>
            {prompt?.action ?? 'Confirm'}
          </Button>
        </div>
      </dialog>
    </Context.Provider>
  );
}
