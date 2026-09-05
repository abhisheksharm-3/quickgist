/** Visibility and expiry, rendered into the status bar's publish slot. */

import { EXPIRY_NEVER } from '@/editor/constants';
import { EXPIRY_OPTIONS, VISIBILITY_OPTIONS } from '@/editor/content';
import type { PublishControlsPropsType } from '@/editor/types';
import type { VisibilityType } from '@/types';
import { SelectField } from '@/ui/SelectField';

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
