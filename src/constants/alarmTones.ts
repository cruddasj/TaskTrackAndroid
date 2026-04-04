export const ALARM_TONES = ['clock_bell', 'fallout', 'chirp', 'digital'] as const;

export type AlarmTone = (typeof ALARM_TONES)[number];

const ALARM_TONE_LABELS: Record<AlarmTone, string> = {
  clock_bell: 'Clock Bell',
  fallout: 'Fallout',
  chirp: 'Chirp',
  digital: 'Digital',
};

export const DEFAULT_ALARM_TONE: AlarmTone = 'clock_bell';

export const LEGACY_ALARM_TONE_MAP: Partial<Record<string, AlarmTone>> = {
  bell: 'clock_bell',
  chime: 'chirp',
  gentle: 'clock_bell',
  pulse: 'fallout',
};

export const isAlarmTone = (value: unknown): value is AlarmTone =>
  typeof value === 'string' && (ALARM_TONES as readonly string[]).includes(value);

export const normalizeAlarmTone = (value: unknown): AlarmTone => {
  if (isAlarmTone(value)) return value;
  if (typeof value === 'string' && value in LEGACY_ALARM_TONE_MAP) {
    return LEGACY_ALARM_TONE_MAP[value] ?? DEFAULT_ALARM_TONE;
  }
  return DEFAULT_ALARM_TONE;
};

export const getAlarmToneLabel = (tone: AlarmTone): string => ALARM_TONE_LABELS[tone];
