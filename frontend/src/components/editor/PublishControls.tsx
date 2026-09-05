/** Visibility and expiry, rendered into the status bar's publish slot. */

import { SelectField } from '@/components/ui/SelectField';
import { EXPIRY_NEVER } from '@/constants/editor';
import { EXPIRY_OPTIONS, VISIBILITY_OPTIONS } from '@/content/editor';
import type { PublishControlsPropsType } from '@/types/editor';
import type { VisibilityType } from '@/types/index';

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
