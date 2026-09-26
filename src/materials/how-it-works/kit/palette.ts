/**
 * Clay-diorama colours shared by every "How It Works" episode. Derived from
 * the shared Editorial Paper tokens where a match exists; the rest are the
 * "clay" materials only the 3D world needs (land, water, metal, rack LEDs).
 */
import { NODE, theme } from '../../../shared/theme'

export const WORLD = {
  paper: theme.paper,
  landTop: '#EDE3D2',
  landSide: '#D9C8AC',
  seabed: '#E6D3AE',
  water: '#6FB7E0',
  waterDeep: '#5E9FC4',
  ink: theme.ink,
  inkSoft: theme.inkSoft,
  phoneBody: '#2A241E',
  screenOn: theme.surface,
  screenOff: '#1C1814',
  metal: '#8E8478',
  metalDark: '#5E554B',
  rack: '#3A332B',
  rackFace: '#2E2822',
  ledIdle: '#57503F',
  ledOk: NODE.done.border,
  cable: '#2F2924',
  accent: theme.accent,
  accentSoft: theme.accentSoft,
  accentDeep: theme.accentDeep,
  info: NODE.info.border,
  leaf: '#8FB573',
  leafDark: '#6E9A55',
  trunk: '#9C7B58',
  cloud: '#FFFFFF',
  tray: '#FFFFFF',
  lineStrong: theme.lineStrong,
  /** Congestion / trouble (jammed cable, stalled video). */
  alert: '#D9483B',
  alertSoft: '#FBE3DF',
  /** Satellite body + solar panels. */
  gold: '#E2B04A',
  panel: '#2E4A72',
  panelLine: '#8FA9CC',
  /** Per-satellite colours (GPS episode): amber, blue, green, violet. */
  sat1: theme.accent,
  sat2: NODE.info.border,
  sat3: NODE.done.border,
  sat4: '#7C3AED',
  /** Warung (QRIS episode). */
  wood: '#B98B5E',
  woodDark: '#8E6641',
} as const
