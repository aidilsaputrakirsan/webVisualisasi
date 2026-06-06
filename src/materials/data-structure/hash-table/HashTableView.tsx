import { AnimatePresence, motion } from 'framer-motion'
import { SIZE, type HashStep, type Mode } from './hashtable'
import { NODE } from '../../../shared/theme'

const ROW_H = 84
const INDEX_W = 64
const PILL_W = 76
const PILL_H = 60

export default function HashTableView({ step, mode }: { step: HashStep; mode: Mode }) {
  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      {Array.from({ length: SIZE }, (_, i) => {
        const bucket = step.table[i] ?? []
        const isHome = step.activeIndex === i
        const isProbe = step.probeIndex === i
        const justPlaced = step.placedAt === i

        return (
          <div key={i} className="flex items-center" style={{ height: ROW_H, gap: 18 }}>
            {/* index cell */}
            <motion.div
              className="flex items-center justify-center rounded-xl font-mono font-bold"
              style={{ width: INDEX_W, height: INDEX_W, borderWidth: 3, borderStyle: 'solid', fontSize: 26 }}
              animate={{
                borderColor: isHome ? NODE.active.border : '#D3C8B6',
                backgroundColor: isHome ? NODE.active.bg : '#F6F0E6',
                color: isHome ? NODE.active.text : '#6B6258',
              }}
              transition={{ duration: 0.25 }}
            >
              {i}
            </motion.div>

            <span className="font-mono" style={{ color: '#C2B7A4', fontSize: 24 }}>
              →
            </span>

            {/* bucket */}
            <div className="flex items-center" style={{ gap: 10, minHeight: PILL_H }}>
              {bucket.length === 0 ? (
                <motion.div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: PILL_W, height: PILL_H, border: '2px dashed' }}
                  animate={{
                    borderColor: isProbe ? NODE.active.border : '#E0D8CC',
                    backgroundColor: isProbe ? NODE.active.bg : 'transparent',
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="font-mono" style={{ color: '#C2B7A4', fontSize: 18 }}>
                    kosong
                  </span>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {bucket.map((key, j) => {
                    const isLast = j === bucket.length - 1
                    const placedHere = justPlaced && isLast
                    const probedHere = isProbe && mode === 'probing'
                    const t = placedHere ? NODE.done : probedHere ? NODE.active : NODE.idle
                    return (
                      <motion.div key={key} className="flex items-center" style={{ gap: 10 }}>
                        {mode === 'chaining' && j > 0 && (
                          <span className="font-mono" style={{ color: '#C2B7A4', fontSize: 22 }}>
                            →
                          </span>
                        )}
                        <motion.div
                          className="flex items-center justify-center rounded-xl font-mono font-semibold"
                          style={{ width: PILL_W, height: PILL_H, borderWidth: 3, borderStyle: 'solid', fontSize: 28 }}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            borderColor: t.border,
                            backgroundColor: t.bg,
                            color: t.text,
                            boxShadow: placedHere ? t.shadow : '0 1px 4px rgba(0,0,0,0.05)',
                          }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                        >
                          {key}
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
