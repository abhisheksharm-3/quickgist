/** Visibility and expiry, rendered into the status bar's publish slot. */

import type { VisibilityType } from '@/types';
import { SelectField } from '@/ui/SelectField';
import type { SelectOptionType } from '@/ui/types';

const VISIBILITY_OPTIONS: SelectOptionType[] = [
  { value: 'unlisted', label: 'unlisted' },
  { value: 'public', label: 'public' },
  { value: 'private', label: 'private' },
];

/**
 * `never` is a sentinel rather than an empty string, because Radix reserves the
 * empty string to mean a cleared selection and would render a blank trigger.
 */
export const EXPIRY_NEVER = 'never';

const EXPIRY_OPTIONS: SelectOptionType[] = [
  { value: EXPIRY_NEVER, label: 'never expires' },
  { value: '1', label: 'expires in 1 day' },
  { value: '7', label: 'expires in 7 days' },
  { value: '30', label: 'expires in 30 days' },
];

type PublishControlsPropsType = {
  visibility: VisibilityType;
  onVisibilityChange: (visibility: VisibilityType) => void;
  expiryDays: string;
  onExpiryDaysChange: (days: string) => void;
  disabled?: boolean | undefined;
};

/**
 * The publish settings.
 *
 * They live in the status bar rather than a form or a settings page, because they are
 * two choices with sane defaults and neither deserves a screen of its own.
 */
export function PublishControls({
  visibility,
  onVisibilityChange,
  expiryDays,
  onExpiryDaysChange,
  disabled = false,
}: PublishControlsPropsType) {
  const handleVisibilityChange = (value: string): void => {
    onVisibilityChange(value as VisibilityType);
  };

  return (
    <div className="flex items-center gap-4">
      <SelectField
        id="publish-visibility"
        label="Visibility"
        value={visibility}
        options={VISIBILITY_OPTIONS}
        onValueChange={handleVisibilityChange}
        disabled={disabled}
      />
      <SelectField
        id="publish-expiry"
        label="Expiry"
        value={expiryDays === '' ? EXPIRY_NEVER : expiryDays}
        options={EXPIRY_OPTIONS}
        onValueChange={(value) => onExpiryDaysChange(value === EXPIRY_NEVER ? '' : value)}
        disabled={disabled}
      />
    </div>
  );
}
