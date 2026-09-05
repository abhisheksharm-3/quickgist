/**
 * A form field.
 *
 * The hint is always present rather than appearing only on failure, so a password
 * rule is something you read before typing instead of after being rejected.
 */
import type { AuthFieldPropsType } from '@/types/auth';
export function AuthField({
  name,
  label,
  type = 'text',
  hint,
  error,
  autoComplete,
  required = true,
  minLength,
  value,
  onChange,
  prefix,
}: AuthFieldPropsType) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="font-mono text-[10px] tracking-[0.13em] text-[var(--faint)] uppercase"
      >
        {label}
      </label>

      <div
        className={`flex items-center border bg-[var(--panel-2)] focus-within:border-[var(--blue-action)] ${
          error ? 'border-[var(--blue-action)]' : 'border-[var(--border-strong)]'
        }`}
      >
        {prefix ? (
          <span className="pl-3 font-mono text-[13px] text-[var(--faint)]">{prefix}</span>
        ) : null}
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className="w-full bg-transparent px-3 py-2 text-[13px] text-[var(--text)] outline-none"
        />
      </div>

      {error ? (
        <p id={`${name}-error`} className="text-[11.5px] text-[var(--body)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-[11.5px] text-[var(--faint)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
