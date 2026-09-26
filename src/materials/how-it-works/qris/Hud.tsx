import { AnimatePresence, motion } from 'framer-motion'
import { NODE, theme } from '../../../shared/theme'
import { useTween, type RailStop } from '../kit/Hud'
import { WORLD } from '../kit/palette'
import { AMOUNT, BALANCE_AFTER, BALANCE_BEFORE, type Stage } from './story'

/** Journey stops for the bottom rail (ids match `Step.stage`). */
export const RAIL: readonly (RailStop & { id: Stage })[] = [
  { id: 'scan', label: 'scan', icon: 'qr' },
  { id: 'pin', label: 'PIN', icon: 'lock' },
  { id: 'issuer', label: 'e-wallet', icon: 'wallet' },
  { id: 'switch', label: 'switching', icon: 'hub' },
  { id: 'acquirer', label: 'bank', icon: 'bank' },
  { id: 'warung', label: 'warung', icon: 'store' },
]

/** Seconds with an Indonesian decimal comma: 1.8 → "1,8". */
const idSeconds = (v: number) => v.toFixed(1).replace('.', ',')

/** Elapsed time + where the money stands (your balance, merchant's bank). */
export function MoneyMeter({ timeS, debited, credited }: { timeS: number | null; debited: boolean; credited: boolean }) {
  const v = useTween(timeS ?? 0)
  return (
    <div className="flex flex-col items-center" style={{ gap: 18, minHeight: 190 }}>
      <AnimatePresence>
        {timeS !== null && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
            <span className="font-mono" style={{ fontSize: 22, letterSpacing: 4, color: theme.inkFaint }}>
              WAKTU
            </span>
            <span className="font-mono font-bold tabular-nums" style={{ fontSize: 76, lineHeight: 1.05, color: theme.ink }}>
              {idSeconds(v)}
              <span style={{ fontSize: 40, color: theme.inkSoft }}> detik</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-center" style={{ gap: 16, minHeight: 56 }}>
        <AnimatePresence>
          {timeS !== null && (
            <motion.div
              key="you"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-full border font-mono"
              style={{
                fontSize: 25,
                padding: '8px 20px',
                borderColor: debited ? WORLD.alert : theme.lineStrong,
                background: debited ? WORLD.alertSoft : theme.surface,
                color: debited ? WORLD.alert : theme.inkSoft,
              }}
            >
              Saldo kamu {debited ? BALANCE_AFTER : BALANCE_BEFORE}
            </motion.div>
          )}
          {credited && (
            <motion.div
              key="merchant"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className="rounded-full border font-mono font-semibold"
              style={{ fontSize: 25, padding: '8px 20px', borderColor: NODE.done.border, background: NODE.done.bg, color: NODE.done.text }}
            >
              Penjual +{AMOUNT}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
