export type PollThemePalette = {
  background: string;
  panel: string;
  accent: string;
  text: string;
  muted: string;
};

export interface PollThemeOption {
  value: string;
  label: string;
  palette: PollThemePalette;
}

export interface PollLayoutOption {
  value: string;
  label: string;
  description: string;
}

export const POLL_THEMES: PollThemeOption[] = [
  {
    value: 'ember',
    label: 'Ember',
    palette: {
      background: '#23272A',
      panel: '#2C2F33',
      accent: '#A52F05',
      text: '#FFFFFF',
      muted: '#9AA0A6',
    },
  },
  {
    value: 'midnight',
    label: 'Midnight',
    palette: {
      background: '#0F172A',
      panel: '#1E293B',
      accent: '#4F46E5',
      text: '#F8FAFC',
      muted: '#94A3B8',
    },
  },
  {
    value: 'ocean',
    label: 'Ocean',
    palette: {
      background: '#082F49',
      panel: '#0C4A6E',
      accent: '#0369A1',
      text: '#F0F9FF',
      muted: '#7DD3FC',
    },
  },
  {
    value: 'forest',
    label: 'Forest',
    palette: {
      background: '#13231A',
      panel: '#1E3A2A',
      accent: '#15803D',
      text: '#F0FDF4',
      muted: '#86EFAC',
    },
  },
  {
    value: 'sunset',
    label: 'Sunset',
    palette: {
      background: '#2B1B2F',
      panel: '#432A48',
      accent: '#C2410C',
      text: '#FFF7ED',
      muted: '#FDBA74',
    },
  },
  {
    value: 'candy',
    label: 'Candy',
    palette: {
      background: '#2A1722',
      panel: '#431F33',
      accent: '#BE185D',
      text: '#FFF1F5',
      muted: '#F9A8D4',
    },
  },
  {
    value: 'mono',
    label: 'Mono',
    palette: {
      background: '#18181B',
      panel: '#27272A',
      accent: '#52525B',
      text: '#FAFAFA',
      muted: '#A1A1AA',
    },
  },
];

export const POLL_LAYOUTS: PollLayoutOption[] = [
  { value: 'bars', label: 'Bars', description: 'Full-width rows' },
  { value: 'compact', label: 'Compact', description: 'Tighter rows' },
  { value: 'cards', label: 'Cards', description: 'Two-column grid' },
  { value: 'minimal', label: 'Minimal', description: 'Slim clean lines' },
];

export function getPollTheme(value: string): PollThemeOption {
  return POLL_THEMES.find((theme) => theme.value === value) ?? POLL_THEMES[0];
}

export function getPollLayout(value: string): PollLayoutOption {
  return POLL_LAYOUTS.find((layout) => layout.value === value) ?? POLL_LAYOUTS[0];
}
