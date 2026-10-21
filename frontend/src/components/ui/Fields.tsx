import { forwardRef } from 'react';
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return <input {...props} ref={ref} />;
  },
);
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(props, ref) {
    return <select {...props} ref={ref} />;
  },
);
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea(props, ref) {
  return <textarea {...props} ref={ref} />;
});
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label>
      {label}
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}
