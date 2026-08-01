export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1200,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export const SPACE_TOKENS = [
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  'section',
] as const;

export type SpaceToken = (typeof SPACE_TOKENS)[number];

export const LAYER_TOKENS = {
  content: 0,
  stickyNav: 20,
  dropdown: 40,
  dialog: 60,
  intro: 80,
} as const;
