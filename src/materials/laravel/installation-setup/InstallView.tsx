import { AnimatePresence, motion } from 'framer-motion'
import { NODE, ACCENT } from '../palette'
import { BoltIcon, FolderIcon, GlobeIcon, TerminalIcon, ViewIcon } from '../Icons'
import { PROCESSES, TREE, type Step } from './install'

const PANEL_W = 880
const ROW_H = 40

/** Terminal transcript + project tree + the three dev processes. */
export default function InstallView({ step }: { step: Step }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 20 }}>
      <Terminal step={step} />
      <Tree step={step} />
      <Processes step={step} />
    </div>
  )
}

function Terminal({ step }: { step: Step }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ width: PANEL_W, borderColor: '#E0CFCA', background: '#241A18', boxShadow: '0 8px 24px rgba(42,26,23,0.16)' }}
    >
      <div className="flex items-center gap-3 border-b px-5 py-3" style={{ borderColor: '#3A2A26' }}>
        <span style={{ color: ACCENT.accent }}>
          <TerminalIcon size={22} />
        </span>
        <span className="font-mono" style={{ fontSize: 18, color: '#C9B6B0' }}>
          example-app — zsh
        </span>
      </div>
      <div className="flex flex-col justify-end px-6 py-4 font-mono" style={{ height: 216, gap: 6 }}>
        <AnimatePresence initial={false}>
          {step.lines.map((l, i) => (
            <motion.div
              key={`${i}-${l.text}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: 19, color: l.kind === 'cmd' ? '#FFB4A0' : '#9C8B86' }}
            >
              {l.kind === 'cmd' ? '$ ' : '  '}
              {l.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Tree({ step }: { step: Step }) {
  return (
    <div
      className="rounded-2xl border px-6 py-4"
      style={{ width: PANEL_W, borderColor: '#E0CFCA', background: '#FFFFFF', height: TREE.length * ROW_H + 36 }}
    >
      {TREE.map((node) => {
        const shown = step.revealed.includes(node.id)
        const focused = step.focus === node.id
        const s = focused ? NODE.active : NODE.idle
        const Icon = node.kind === 'dir' ? FolderIcon : ViewIcon
        return (
          <motion.div
            key={node.id}
            className="flex items-center"
            initial={false}
            animate={{ opacity: shown ? 1 : 0.16, x: shown ? 0 : -8 }}
            transition={{ duration: 0.25 }}
            style={{ height: ROW_H, gap: 12, paddingLeft: node.depth * 30 }}
          >
            <span style={{ color: focused ? s.text : '#B5A29C' }}>
              <Icon size={21} />
            </span>
            <motion.span
              className="rounded-md font-mono"
              animate={{ backgroundColor: focused ? s.bg : 'rgba(0,0,0,0)', color: focused ? s.text : '#4A3B37' }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: 21, padding: '2px 8px' }}
            >
              {node.label}
            </motion.span>
            <span style={{ fontSize: 18, color: '#A08F8A' }}>{shown ? node.note : ''}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

function Processes({ step }: { step: Step }) {
  return (
    <div className="flex items-center" style={{ gap: 14 }}>
      {PROCESSES.map((p) => {
        const on = step.running.includes(p.id)
        const s = on ? NODE.done : NODE.idle
        return (
          <motion.div
            key={p.id}
            className="flex items-center rounded-xl border"
            animate={{ borderColor: s.border, backgroundColor: s.bg, boxShadow: s.shadow }}
            transition={{ duration: 0.25 }}
            style={{ width: 240, height: 66, gap: 12, paddingLeft: 18 }}
          >
            <span style={{ color: s.text }}>
              <BoltIcon size={24} />
            </span>
            <span className="flex flex-col">
              <span className="font-mono font-semibold" style={{ fontSize: 19, color: s.text }}>
                {p.label}
              </span>
              <span className="font-mono" style={{ fontSize: 16, color: '#A08F8A' }}>
                {on ? p.port : 'stopped'}
              </span>
            </span>
          </motion.div>
        )
      })}

      <motion.div
        className="flex items-center rounded-xl border"
        animate={{
          borderColor: step.live ? ACCENT.accentDeep : NODE.idle.border,
          backgroundColor: step.live ? ACCENT.accentSoft : NODE.idle.bg,
          scale: step.live ? 1.04 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ width: 258, height: 66, gap: 12, paddingLeft: 18 }}
      >
        <span style={{ color: step.live ? ACCENT.accentText : '#B5A29C' }}>
          <GlobeIcon size={24} />
        </span>
        <span className="flex flex-col">
          <span className="font-mono font-semibold" style={{ fontSize: 18, color: step.live ? ACCENT.accentText : '#8A7A74' }}>
            localhost:8000
          </span>
          <span className="font-mono" style={{ fontSize: 16, color: '#A08F8A' }}>
            {step.live ? '200 OK' : 'waiting'}
          </span>
        </span>
      </motion.div>
    </div>
  )
}
