/** The shapes of the landing page's content and its components. */

export type FeatureType = {
  index: string;
  title: string;
  detail: string;
};

export type StackRowType = {
  layer: string;
  choice: string;
  reason: string;
};

export type ShortcutRowType = {
  keys: string;
  action: string;
};

/** One row of the hero's specification plate. */
export type HeroSpecType = {
  label: string;
  value: string;
};
