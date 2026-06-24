import { motion } from 'framer-motion'
import { NODE } from '../palette'
import { BlockIcon, LinkIcon } from '../Icons'
import { short } from '../block-chain/chain'
import type { TBlock, TamperStep } from './tamper'

const BOARD_W = 760
const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

function colorOf(state: TBlock['state']) {
  if (state === 'valid') return NODE.done
  if (state === 'invalid') return NODE.fail
  if (state === 'checking') return NODE.active
  return NODE.idle
}

function badgeText(state: TBlock['state']) {
  if (state === 'valid') return 'sah'
  if (state === 'invalid') return 'TIDAK SAH'
  if (state === 'checking') return 'diperiksa…'
  return 'menunggu'
}

/** One field row inside a block card. */
function Field({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  const c = danger
    ? { border: NODE.fail.border, bg: NODE.fail.bg, text: NODE.fail.text }
    : { border: '#E2E6F0', bg: '#F7F9FD', text: '#46506A' }
  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <span className="font-mono" style={{ fontSize: 16, color: '#9098AD', width: 64, flexShrink: 0, letterSpacing: 1 }}>
        {label}
      </span>
      <span
        className="font-mono rounded-lg border"
        style={{ fontSize: 20, padding: '5px 14px', borderColor: c.border, background: c.bg, color: c.text, flex: 1, fontWeight: danger ? 700 : 400 }}
      >
        {value}
      </span>
    </div>
  )
}

export default function TamperView({ step }: { step: TamperStep }) {
  return (
    <div className="flex flex-col items-center" style={{ width: BOARD_W }}>
      {step.blocks.map((blk, i) => {
        const col = colorOf(blk.state)
        const broken = blk.linkBroken
        return (
          <div key={blk.id} className="flex w-full flex-col items-center">
            {/* Connector to the previous block (skip above genesis). */}
            {i > 0 && (
              <motion.div
                className="flex items-center justify-center"
                animate={{ color: broken ? NODE.fail.border : NODE.done.border }}
                transition={SPRING}
                style={{ height: 38, gap: 8 }}
              >
                <span style={{ width: 2, height: 12, background: 'currentColor', opacity: broken ? 0.4 : 0.5 }} />
                <LinkIcon size={22} strokeWidth={2} />
                {broken && (
                  <span className="font-mono font-semibold" style={{ fontSize: 16, color: NODE.fail.border }}>
                    link putus
                  </span>
                )}
                <span style={{ width: 2, height: 12, background: 'currentColor', opacity: broken ? 0.4 : 0.5 }} />
              </motion.div>
            )}

            <motion.div
              layout
              animate={{
                borderColor: col.border,
                background: '#FFFFFF',
                boxShadow: blk.state === 'idle' ? NODE.idle.shadow : col.shadow,
                scale: blk.state === 'checking' ? 1.01 : 1,
              }}
              transition={SPRING}
              className="flex w-full flex-col rounded-2xl border-2"
              style={{ padding: '12px 20px', gap: 8 }}
            >
              {/* Header */}
              <div className="flex items-center" style={{ gap: 12 }}>
                <span style={{ display: 'flex', color: col.border }}>
                  <BlockIcon size={26} strokeWidth={1.9} />
                </span>
                <span className="font-semibold" style={{ fontSize: 24, color: '#20243A' }}>
                  Block #{blk.index}
                </span>
                <span
                  className="ml-auto rounded-full font-mono font-semibold"
                  style={{ fontSize: 15, padding: '4px 13px', background: col.bg, color: col.text, border: `1px solid ${col.border}` }}
                >
                  {badgeText(blk.state)}
                </span>
              </div>

              <Field label="DATA" value={blk.data} danger={blk.tampered} />
              <Field label="PREV" value={blk.prevHash === '00000000' ? '00000000  (tanpa induk)' : short(blk.prevHash)} danger={broken} />
              <Field label="HASH" value={short(blk.hash)} />

              {blk.note && (
                <motion.span
                  key={blk.note}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono"
                  style={{ fontSize: 16, color: blk.state === 'invalid' ? NODE.fail.text : '#7C8398', paddingLeft: 76 }}
                >
                  {blk.note}
                </motion.span>
              )}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
