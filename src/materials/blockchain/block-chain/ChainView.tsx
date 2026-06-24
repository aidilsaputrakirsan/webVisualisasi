import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../palette'
import { BlockIcon, LinkIcon } from '../Icons'
import { short, type Block, type ChainStep } from './chain'

const BOARD_W = 740
const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

type BlockState = 'new' | 'hashing' | 'sealed' | 'idle'

function stateOf(blk: Block, step: ChainStep): BlockState {
  if (blk.id === step.activeId && step.phase === 'new') return 'new'
  if (blk.id === step.activeId && step.phase === 'hashing') return 'hashing'
  if (blk.hash !== null) return 'sealed'
  return 'idle'
}

/** One field row inside a block card. */
function Field({ label, value, tint }: { label: string; value: string; tint?: 'link' | 'self' | null }) {
  const c =
    tint === 'link'
      ? { border: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text }
      : tint === 'self'
        ? { border: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text }
        : { border: '#E2E6F0', bg: '#F7F9FD', text: '#46506A' }
  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <span className="font-mono" style={{ fontSize: 16, color: '#9098AD', width: 64, flexShrink: 0, letterSpacing: 1 }}>
        {label}
      </span>
      <span
        className="font-mono rounded-lg border"
        style={{ fontSize: 20, padding: '5px 14px', borderColor: c.border, background: c.bg, color: c.text, flex: 1 }}
      >
        {value}
      </span>
    </div>
  )
}

export default function ChainView({ step }: { step: ChainStep }) {
  return (
    <div className="flex flex-col items-center" style={{ width: BOARD_W, gap: 0 }}>
      <AnimatePresence>
        {step.blocks.map((blk, i) => {
          const st = stateOf(blk, step)
          const col =
            st === 'sealed'
              ? NODE.done
              : st === 'new' || st === 'hashing'
                ? NODE.active
                : NODE.idle
          const sealed = blk.hash !== null

          return (
            <div key={blk.id} className="flex w-full flex-col items-center">
              {/* Connector to the previous block (skip above genesis). */}
              {i > 0 && (
                <motion.div
                  className="flex items-center justify-center"
                  animate={{ color: sealed ? NODE.done.border : NODE.idle.border }}
                  transition={SPRING}
                  style={{ height: 40, gap: 8 }}
                >
                  <span style={{ width: 2, height: 14, background: 'currentColor', opacity: 0.5 }} />
                  <LinkIcon size={22} strokeWidth={2} />
                  <span style={{ width: 2, height: 14, background: 'currentColor', opacity: 0.5 }} />
                </motion.div>
              )}

              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{
                  opacity: 1,
                  scale: st === 'hashing' ? 1.02 : 1,
                  y: 0,
                  borderColor: col.border,
                  background: '#FFFFFF',
                  boxShadow: st === 'idle' ? NODE.idle.shadow : col.shadow,
                }}
                transition={SPRING}
                className="flex w-full flex-col rounded-2xl border-2"
                style={{ padding: '14px 20px', gap: 9 }}
              >
                {/* Header */}
                <div className="flex items-center" style={{ gap: 12 }}>
                  <span style={{ display: 'flex', color: col.border }}>
                    <BlockIcon size={28} strokeWidth={1.9} />
                  </span>
                  <span className="font-semibold" style={{ fontSize: 26, color: '#20243A' }}>
                    Block #{blk.index}
                  </span>
                  <span
                    className="ml-auto rounded-full font-mono font-semibold"
                    style={{ fontSize: 15, padding: '4px 13px', background: col.bg, color: col.text, border: `1px solid ${col.border}` }}
                  >
                    {st === 'sealed' ? 'terkunci' : st === 'hashing' ? 'menghitung…' : st === 'new' ? 'baru' : 'menunggu'}
                  </span>
                </div>

                <Field label="DATA" value={blk.data} />
                <Field
                  label="PREV"
                  value={blk.prevHash === '00000000' ? '00000000  (tanpa induk)' : short(blk.prevHash)}
                  tint={blk.prevHash === '00000000' ? null : sealed ? 'link' : null}
                />
                <Field
                  label="HASH"
                  value={blk.hash ? short(blk.hash) : st === 'hashing' ? 'menghitung…' : '— belum dikunci —'}
                  tint={blk.hash ? 'self' : null}
                />
              </motion.div>
            </div>
          )
        })}
      </AnimatePresence>

      {step.blocks.length === 0 && (
        <span style={{ fontSize: 22, color: '#A0A7BC', fontStyle: 'italic', paddingTop: 30 }}>
          rantai kosong — sebentar lagi blok genesis ditambahkan
        </span>
      )}
    </div>
  )
}
