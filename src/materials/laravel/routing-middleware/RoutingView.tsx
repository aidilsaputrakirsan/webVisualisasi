import { AnimatePresence, motion } from 'framer-motion'
import { NODE, ACCENT } from '../palette'
import { RouteIcon, ShieldIcon } from '../Icons'
import { LAYERS, ROUTES, type LayerState, type RouteState, type Step } from './routing'

const TABLE_W = 900
const ROW_H = 52
const ONION_W = 880
const ONION_H = 360
const INSET_X = 56
const INSET_Y = 42

function routeStyle(s: RouteState) {
  if (s === 'match') return NODE.done
  if (s === 'miss') return NODE.fail
  if (s === 'testing') return NODE.active
  return NODE.idle
}

function layerStyle(s: LayerState) {
  if (s === 'blocked') return NODE.fail
  if (s === 'entering') return NODE.active
  if (s === 'inside') return NODE.info
  if (s === 'exiting' || s === 'done') return NODE.done
  return NODE.idle
}

/** Route table on top, middleware onion below, one packet moving between them. */
export default function RoutingView({ step }: { step: Step }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 26 }}>
      <RouteTable step={step} />
      <Onion step={step} />
    </div>
  )
}

function RouteTable({ step }: { step: Step }) {
  return (
    <div
      className="rounded-2xl border px-5 py-4"
      style={{
        width: TABLE_W,
        borderColor: '#E0CFCA',
        background: '#FFFFFF',
        boxShadow: '0 6px 18px rgba(42,26,23,0.06)',
      }}
    >
      <div className="mb-3 flex items-center" style={{ gap: 12 }}>
        <span style={{ color: ACCENT.accentText }}>
          <RouteIcon size={24} />
        </span>
        <span className="font-mono" style={{ fontSize: 19, color: '#8A7A74' }}>
          routes/web.php
        </span>
        <span className="ml-auto flex items-center" style={{ gap: 10 }}>
          <AnimatePresence>
            {step.params && (
              <motion.span
                key="params"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full border font-mono"
                style={{
                  fontSize: 18,
                  padding: '5px 14px',
                  borderColor: NODE.done.border,
                  background: NODE.done.bg,
                  color: NODE.done.text,
                }}
              >
                {Object.entries(step.params)
                  .map(([k, v]) => `${k} = ${v}`)
                  .join(' · ')}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>

      {ROUTES.map((r, i) => {
        const s = routeStyle(step.routes[i])
        const on = step.routes[i] !== 'idle'
        return (
          <motion.div
            key={r.id}
            className="flex items-center rounded-xl border"
            animate={{
              borderColor: on ? s.border : 'rgba(0,0,0,0)',
              backgroundColor: on ? s.bg : 'rgba(0,0,0,0)',
              opacity: step.routes[i] === 'miss' ? 0.55 : 1,
            }}
            transition={{ duration: 0.22 }}
            style={{ height: ROW_H - 6, marginBottom: 6, gap: 16, paddingLeft: 14, paddingRight: 14 }}
          >
            <span
              className="rounded-md font-mono font-semibold"
              style={{
                fontSize: 17,
                width: 62,
                textAlign: 'center',
                padding: '3px 0',
                color: on ? s.text : '#8A7A74',
                border: `1px solid ${on ? s.border : '#E0CFCA'}`,
              }}
            >
              {r.method}
            </span>
            <span className="font-mono" style={{ fontSize: 21, color: on ? s.text : '#4A3B37', width: 300 }}>
              {r.uri}
            </span>
            <span className="font-mono" style={{ fontSize: 18, color: '#A08F8A' }}>
              {r.action}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function Onion({ step }: { step: Step }) {
  return (
    <div className="relative" style={{ width: ONION_W, height: ONION_H }}>
      {LAYERS.map((layer, i) => {
        const s = layerStyle(step.layers[i])
        const skipped = step.layers[i] === 'skipped'
        const w = ONION_W - 2 * INSET_X * i
        const h = ONION_H - 2 * INSET_Y * i
        return (
          <motion.div
            key={layer.id}
            className="absolute rounded-2xl border-2"
            animate={{
              borderColor: s.border,
              backgroundColor: s.bg,
              opacity: skipped ? 0.3 : 1,
              boxShadow: step.layers[i] === 'entering' ? s.shadow : '0 1px 4px rgba(42,26,23,0.05)',
            }}
            transition={{ duration: 0.25 }}
            style={{ left: INSET_X * i, top: INSET_Y * i, width: w, height: h }}
          >
            <div className="flex items-center" style={{ gap: 10, padding: '9px 18px' }}>
              <span style={{ color: s.text }}>
                <ShieldIcon size={19} />
              </span>
              <span className="font-mono font-semibold" style={{ fontSize: 20, color: s.text }}>
                {layer.label}
              </span>
              <span className="font-mono" style={{ fontSize: 16, color: '#A08F8A' }}>
                {layer.note}
              </span>
            </div>
          </motion.div>
        )
      })}

      {/* The packet riding into and out of the onion. */}
      <motion.div
        className="absolute flex items-center justify-center rounded-full border font-mono font-semibold"
        animate={{
          y: step.packetAt < 0 ? -46 : INSET_Y * step.packetAt + 62,
          opacity: step.packet ? 1 : 0,
          backgroundColor: step.responseCode
            ? step.responseCode.startsWith('200')
              ? '#15803D'
              : '#DC2626'
            : ACCENT.accent,
          borderColor: '#00000022',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          left: ONION_W / 2 - 90,
          top: 0,
          width: 180,
          height: 42,
          fontSize: 18,
          color: '#FFFFFF',
        }}
      >
        {step.packet ?? ''}
      </motion.div>
    </div>
  )
}
