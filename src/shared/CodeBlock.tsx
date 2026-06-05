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
      className="overflow-hidden rounded-3xl border border-neutral-800 bg-[#0d0d11] shadow-2xl"
      style={{ width }}
    >
      <div className="flex items-center gap-2.5 border-b border-neutral-800 px-6 py-3.5">
        <span className="h-4 w-4 rounded-full bg-[#ff5f56]" />
        <span className="h-4 w-4 rounded-full bg-[#ffbd2e]" />
        <span className="h-4 w-4 rounded-full bg-[#27c93f]" />
        <span className="ml-3 font-mono text-neutral-500" style={{ fontSize: fontSize - 4 }}>
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
                  className="absolute inset-y-0 left-0 right-0 border-l-4 border-amber-400 bg-amber-400/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <div className="relative flex gap-5 px-3">
                <span className="w-7 select-none text-right text-neutral-600">{i + 1}</span>
                <pre className={active ? 'text-amber-200' : 'text-neutral-300'}>{line || ' '}</pre>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
