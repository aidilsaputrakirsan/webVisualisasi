import { motion } from 'framer-motion'
import { CC, type TLine } from './guide'

/**
 * Dark "terminal" panel — this material's bespoke replacement for the light
 * shared CodeBlock. Renders a CLI transcript with a coral highlight gliding to
 * the line currently under discussion.
 */
export default function Terminal({
  lines,
  activeLine,
  width = 980,
}: {
  lines: TLine[]
  activeLine: number
  width?: number
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        width,
        background: CC.panel,
        border: `1px solid ${CC.line}`,
        boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
      }}
    >
      {/* title bar */}
      <div
        className="flex items-center gap-2.5 px-6"
        style={{ height: 52, background: CC.panelSoft, borderBottom: `1px solid ${CC.lineSoft}` }}
      >
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#E0654B' }} />
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#E0A458' }} />
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#86B86B' }} />
        <span className="ml-3 font-mono" style={{ fontSize: 22, color: CC.inkFaint }}>
          claude — your project
        </span>
      </div>

      <div className="py-4 font-mono" style={{ fontSize: 26, lineHeight: '46px' }}>
        {lines.map((line, i) => {
          const active = i === activeLine
          return (
            <div key={i} className="relative px-3">
              {active && (
                <motion.div
                  layoutId="cc-term-highlight"
                  className="absolute inset-y-0 left-0 right-0 border-l-4"
                  style={{ borderColor: CC.coral, background: 'rgba(217,119,87,0.12)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <div className="relative flex gap-3 px-4" style={{ minHeight: 46, alignItems: 'baseline' }}>
                <Prefix line={line} />
                <pre
                  style={{
                    color: colorFor(line),
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

function Prefix({ line }: { line: TLine }) {
  const map: Record<TLine['kind'], string> = {
    cmd: '$',
    slash: '›',
    agent: '●',
    out: ' ',
    ok: ' ',
    comment: '#',
  }
  const colorMap: Record<TLine['kind'], string> = {
    cmd: CC.coral,
    slash: CC.violet,
    agent: CC.coral,
    out: CC.inkFaint,
    ok: CC.green,
    comment: CC.inkFaint,
  }
  return (
    <span style={{ color: colorMap[line.kind], width: 18, flexShrink: 0, textAlign: 'center' }}>
      {map[line.kind]}
    </span>
  )
}

function colorFor(line: TLine): string {
  switch (line.kind) {
    case 'cmd':
      return CC.ink
    case 'slash':
      return CC.coralText
    case 'agent':
      return CC.inkSoft
    case 'ok':
      return CC.green
    case 'comment':
      return CC.inkFaint
    default:
      return CC.inkSoft
  }
}
