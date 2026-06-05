import { motion } from 'framer-motion'
import { PYTHON_SOURCE } from './insertionSort'

export default function CodePanel({ activeLine }: { activeLine: number }) {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-neutral-800 bg-[#0d0d11] shadow-2xl"
      style={{ width: 720 }}
    >
      <div className="flex items-center gap-2.5 border-b border-neutral-800 px-6 py-4">
        <span className="h-4 w-4 rounded-full bg-[#ff5f56]" />
        <span className="h-4 w-4 rounded-full bg-[#ffbd2e]" />
        <span className="h-4 w-4 rounded-full bg-[#27c93f]" />
        <span className="ml-3 font-mono text-neutral-500" style={{ fontSize: 20 }}>
          insertion_sort.py
        </span>
      </div>

      <div className="py-4 font-mono" style={{ fontSize: 24, lineHeight: '40px' }}>
        {PYTHON_SOURCE.map((line, i) => {
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
