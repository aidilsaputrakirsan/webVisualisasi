import { motion } from 'framer-motion'
import { OC, type CLine } from './guide'

/**
 * The gateway console — this material's constant bottom panel (like a terminal,
 * styled as a homelab status readout). Shows real `openclaw …` commands with a
 * coloured status glyph per line and a glide highlight on the active line.
 */
export default function GatewayConsole({
  lines,
  activeLine,
  width = 980,
}: {
  lines: CLine[]
  activeLine: number
  width?: number
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ width, background: OC.panel, border: `1px solid ${OC.line}`, boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }}
    >
      <div
        className="flex items-center gap-2.5 px-6"
        style={{ height: 50, background: OC.panelSoft, borderBottom: `1px solid ${OC.lineSoft}` }}
      >
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: OC.emerald }} />
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: OC.cyan }} />
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: OC.amber }} />
        <span className="ml-3 font-mono" style={{ fontSize: 20, color: OC.inkFaint }}>
          openclaw — gateway
        </span>
      </div>

      <div className="py-4 font-mono" style={{ fontSize: 25, lineHeight: '44px' }}>
        {lines.map((line, i) => {
          const active = i === activeLine
          return (
            <div key={i} className="relative px-3">
              {active && (
                <motion.div
                  layoutId="oc-console-highlight"
                  className="absolute inset-y-0 left-0 right-0 border-l-4"
                  style={{ borderColor: OC.emerald, background: 'rgba(52,211,153,0.10)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <div className="relative flex gap-3 px-4" style={{ minHeight: 44, alignItems: 'baseline' }}>
                <span style={{ color: glyphColor(line.kind), width: 18, flexShrink: 0, textAlign: 'center' }}>
                  {glyphFor(line.kind)}
                </span>
                <pre
                  style={{
                    color: textColor(line.kind),
                    fontStyle: line.kind === 'comment' ? 'italic' : 'normal',
                    whiteSpace: 'pre-wrap',
                    opacity: active || activeLine < 0 ? 1 : 0.62,
                    transition: 'opacity 0.25s',
                  }}
                >
                  {line.text || ' '}
                </pre>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function glyphFor(kind: CLine['kind']): string {
  switch (kind) {
    case 'cmd':
      return '$'
    case 'ok':
      return '✓'
    case 'warn':
      return '!'
    case 'comment':
      return '#'
    default:
      return ' '
  }
}
function glyphColor(kind: CLine['kind']): string {
  switch (kind) {
    case 'cmd':
      return OC.emerald
    case 'ok':
      return OC.emerald
    case 'warn':
      return OC.amber
    default:
      return OC.inkFaint
  }
}
function textColor(kind: CLine['kind']): string {
  switch (kind) {
    case 'cmd':
      return OC.ink
    case 'ok':
      return OC.emeraldText
    case 'warn':
      return OC.amber
    case 'comment':
      return OC.inkFaint
    default:
      return OC.inkSoft
  }
}
