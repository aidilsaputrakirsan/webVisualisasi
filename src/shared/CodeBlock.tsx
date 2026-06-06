import { motion } from 'framer-motion'

/**
 * Generic source-code panel with line numbers and an animated highlight on the
 * currently-executing line. Sized in fixed px for the 1080-wide design canvas.
 */
export default function CodeBlock({
  filename,
  source,
  activeLine,
  width = 760,
  fontSize = 23,
}: {
  filename: string
  source: string[]
  activeLine: number
  width?: number
  fontSize?: number
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ width, borderColor: '#E4DCCF', background: '#FFFFFF', boxShadow: '0 6px 18px rgba(33,28,22,0.06)' }}
    >
      <div
        className="flex items-center gap-2.5 border-b px-6 py-3.5"
        style={{ borderColor: '#EFE8DB', background: '#F6F0E6' }}
      >
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#E0C09A' }} />
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#EAD7BC' }} />
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#D9CBB3' }} />
        <span className="ml-3 font-mono" style={{ fontSize: fontSize - 4, color: '#9C8F7B' }}>
          {filename}
        </span>
      </div>

      <div className="py-3 font-mono" style={{ fontSize, lineHeight: `${Math.round(fontSize * 1.6)}px` }}>
        {source.map((line, i) => {
          const active = i === activeLine
          return (
            <div key={i} className="relative px-3">
              {active && (
                <motion.div
                  layoutId="code-highlight"
                  className="absolute inset-y-0 left-0 right-0 border-l-4"
                  style={{ borderColor: '#D97706', background: 'rgba(217,119,6,0.12)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <div className="relative flex gap-5 px-3">
                <span className="w-7 select-none text-right" style={{ color: '#C2B7A4' }}>
                  {i + 1}
                </span>
                <pre style={{ color: active ? '#92400E' : '#3A3329' }}>{line || ' '}</pre>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
