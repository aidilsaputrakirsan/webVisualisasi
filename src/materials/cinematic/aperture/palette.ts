/**
 * "Cinematic" look: a dark product-shot studio instead of the warm paper
 * diorama. Kept local on purpose — this series is meant to look different
 * from How It Works; the amber accent ties it back to the brand.
 */
import { theme } from '../../../shared/theme'

export const CINE = {
  bg: '#0B0A0C',
  floor: '#141216',
  blade: '#16161B',
  housing: '#2B2A30',
  housingDark: '#1B1A1F',
  light: '#FFE7C2',
  edge: '#FFB547',
  key: '#FFC98A',
  fill: '#8FB4FF',
  accent: theme.accent,
  text: '#F5F1EA',
  textSoft: '#A39C92',
} as const
