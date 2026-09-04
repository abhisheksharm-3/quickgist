/** Shared prop types for the overlay primitives. */
export type SelectOptionType = {
  value: string;
  label: string;
};

export type SelectFieldPropsType = {
  label: string;
  value: string;
  options: SelectOptionType[];
  onValueChange: (value: string) => void;
  id?: string | undefined;
  disabled?: boolean | undefined;
};
