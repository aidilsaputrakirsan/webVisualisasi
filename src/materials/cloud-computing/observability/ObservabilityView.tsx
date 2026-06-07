import { AnimatePresence, motion } from 'framer-motion'
import { ACCENT, NODE } from '../palette'
import { CID, EDGES, NODES, edgeBetween, type Level, type LogRow, type NodeId, type ObsStep, type Signals, type Tone } from './arch'
import { BoxIcon, BrowserIcon, GatewayIcon, ShieldIcon } from './Icons'

const CHAIN_W = 900
const CHAIN_H = 118

const FAIL = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B', shadow: '0 4px 18px rgba(220,38,38,0.22)' }

const NODE_ICON: Record<NodeId, ({ size }: { size?: number }) => JSX.Element> = {
  fe: BrowserIcon,
  gw: GatewayIcon,
  item: BoxIcon,
  auth: ShieldIcon,
}

const TONE: Record<Tone, { stroke: string; bg: string; text: string }> = {
  request: { stroke: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  pass: { stroke: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
  fail: { stroke: FAIL.border, bg: FAIL.bg, text: FAIL.text },
}

const LEVEL: Record<Level, { border: string; bg: string; text: string }> = {
  INFO: { border: '#15803D', bg: '#DCFCE7', text: '#166534' },
  WARN: { border: '#D97706', bg: '#FDEBC8', text: '#92400E' },
  ERROR: { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B' },
}

function point(from: NodeId, to: NodeId) {
  const e = edgeBetween(from, to)
  if (!e) return null
  const fromIsA = e.a === from
  return {
    sx: fromIsA ? e.ax : e.bx,
    sy: fromIsA ? e.ay : e.by,
    tx: fromIsA ? e.bx : e.ax,
    ty: fromIsA ? e.by : e.ay,
  }
}

export default function ObservabilityView({ step, stepKey }: { step: ObsStep; stepKey: number }) {
  const active = new Set(step.activeNodes)
  const activeEdge = step.packet ? edgeBetween(step.packet.from, step.packet.to) : undefined
  const pts = step.packet ? point(step.packet.from, step.packet.to) : null
  const tone = step.packet ? TONE[step.packet.tone] : null

  const errorCount = step.logs.filter((l) => l.level === 'ERROR').length

  return (
    <div className="flex flex-col items-center" style={{ gap: 20 }}>
      {/* ── Service chain ─────────────────────────── */}
      <div className="relative" style={{ width: CHAIN_W, height: CHAIN_H }}>
        <svg width={CHAIN_W} height={CHAIN_H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {EDGES.map((e, i) => {
            const on = activeEdge && activeEdge.a === e.a && activeEdge.b === e.b
            const color = on ? (tone?.stroke ?? NODE.active.border) : '#D3C8B6'
            return <motion.line key={i} x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by} animate={{ stroke: color, strokeWidth: on ? 3.5 : 2 }} strokeLinecap="round" />
          })}
        </svg>

        {Object.values(NODES).map((n) => {
          const isActive = active.has(n.id)
          const st = isActive ? NODE.active : NODE.idle
          const Icon = NODE_ICON[n.id]
          return (
            <motion.div
              key={n.id}
              className="absolute flex items-center rounded-2xl border-2"
              animate={{ borderColor: st.border, background: isActive ? st.bg : '#FFFFFF', boxShadow: isActive ? st.shadow : '0 1px 4px rgba(0,0,0,0.05)', scale: isActive ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{ left: n.cx - n.w / 2, top: n.cy - n.h / 2, width: n.w, height: n.h, gap: 11, padding: '0 16px' }}
            >
              <motion.span animate={{ color: st.border }} style={{ display: 'flex', flexShrink: 0 }}>
                <Icon size={29} />
              </motion.span>
              <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
                <span className="font-semibold" style={{ fontSize: 21, color: '#211C16', whiteSpace: 'nowrap' }}>
                  {n.label}
                </span>
                <span className="font-mono" style={{ fontSize: 15, color: '#9C8F7B' }}>
                  {n.sub}
                </span>
              </div>
            </motion.div>
          )
        })}

        {/* Travelling packet (carries the correlation id) */}
        <AnimatePresence>
          {step.packet && pts && tone && (
            <motion.div
              key={stepKey}
              className="absolute flex items-center rounded-full border font-mono"
              initial={{ left: pts.sx, top: pts.sy, opacity: 0, scale: 0.7, x: '-50%', y: '-50%' }}
              animate={{ left: pts.tx, top: pts.ty, opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              style={{ gap: 7, padding: '6px 14px', fontSize: 17, whiteSpace: 'nowrap', borderColor: tone.stroke, background: tone.bg, color: tone.text, zIndex: 20 }}
            >
              {step.packet.tag}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Golden Signals dashboard (metrics mode) ── */}
      {step.signals ? (
        <MetricsDashboard signals={step.signals} />
      ) : (
      /* ── Structured log stream (trace modes) ────── */
      <div className="overflow-hidden rounded-2xl border" style={{ width: CHAIN_W, borderColor: '#E4DCCF', background: '#FFFFFF', boxShadow: '0 6px 18px rgba(33,28,22,0.06)' }}>
        {/* header with live metric readout */}
        <div className="flex items-center border-b" style={{ borderColor: '#EFE8DB', background: '#F6F0E6', padding: '11px 20px', gap: 12 }}>
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#E0C09A' }} />
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#EAD7BC' }} />
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#D9CBB3' }} />
          <span className="ml-2 font-mono" style={{ fontSize: 16, color: '#9C8F7B' }}>
            all-services.log
          </span>
          <span className="ml-auto flex items-center font-mono" style={{ fontSize: 15, gap: 14 }}>
            <span style={{ color: '#6B6258' }}>entri: <b style={{ color: '#211C16' }}>{step.logs.length}</b></span>
            <span style={{ color: errorCount ? FAIL.text : '#6B6258' }}>error: <b style={{ color: errorCount ? FAIL.border : '#211C16' }}>{errorCount}</b></span>
            <span style={{ color: '#6B6258' }}>latency: <b style={{ color: '#211C16' }}>{step.lastMs != null ? `${step.lastMs}ms` : '—'}</b></span>
          </span>
        </div>

        {/* rows — older entries compact, newest expanded to full JSON */}
        <div className="flex flex-col" style={{ padding: '12px 16px', gap: 8, minHeight: 300 }}>
          {step.logs.length === 0 && (
            <div className="font-mono" style={{ fontSize: 16, color: '#B7AB95', padding: '8px 4px' }}>
              menunggu request…
            </div>
          )}
          <AnimatePresence initial={false}>
            {step.logs.map((log, i) =>
              i === step.logs.length - 1 ? (
                <LogJson key={i} log={log} cidAction={step.cidAction ?? null} />
              ) : (
                <LogLine key={i} log={log} />
              ),
            )}
          </AnimatePresence>
        </div>
      </div>
      )}
    </div>
  )
}

/** Compact single-line entry (older log rows). */
function LogLine({ log }: { log: LogRow }) {
  const lv = LEVEL[log.level]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 0.85, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="flex items-center rounded-lg font-mono"
      style={{ gap: 12, padding: '6px 14px', background: 'transparent', fontSize: 16 }}
    >
      <span
        className="rounded-md font-semibold"
        style={{ fontSize: 13, padding: '2px 9px', minWidth: 60, textAlign: 'center', background: lv.bg, color: lv.text, border: `1px solid ${lv.border}` }}
      >
        {log.level}
      </span>
      <span style={{ color: '#57503F', minWidth: 128 }}>{log.service}</span>
      <span className="rounded-md" style={{ fontSize: 14, padding: '2px 8px', background: ACCENT.accentSoft, color: ACCENT.accentText, border: `1px solid ${ACCENT.accent}55`, whiteSpace: 'nowrap' }}>
        cid={CID}
      </span>
      <span style={{ color: '#3A3329', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.msg}</span>
    </motion.div>
  )
}

/** Newest entry, expanded to the full structured JSON record. */
function LogJson({ log, cidAction }: { log: LogRow; cidAction: 'generate' | 'reuse' | null }) {
  const lv = LEVEL[log.level]
  const fields: { k: string; v: string; hl?: boolean; num?: boolean }[] = [
    { k: 'timestamp', v: `"${log.ts}"` },
    { k: 'level', v: `"${log.level}"` },
    { k: 'service', v: `"${log.service}"` },
    { k: 'correlation_id', v: `"${CID}"`, hl: true },
    ...(log.method ? [{ k: 'method', v: `"${log.method}"` }] : []),
    ...(log.path ? [{ k: 'path', v: `"${log.path}"` }] : []),
    ...(log.status != null ? [{ k: 'status_code', v: String(log.status), num: true }] : []),
    ...(log.ms != null ? [{ k: 'duration_ms', v: String(log.ms), num: true }] : []),
    { k: 'message', v: `"${log.msg}"` },
  ]
  const cidChip = cidAction === 'generate' ? { t: 'generate cid', ...WARN } : cidAction === 'reuse' ? { t: 'reuse cid', ...OK } : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      className="rounded-xl border"
      style={{ borderColor: lv.border, background: '#FAFBFF', padding: '12px 16px' }}
    >
      <div className="flex items-center" style={{ gap: 11, marginBottom: 6 }}>
        <span className="rounded-md font-semibold font-mono" style={{ fontSize: 13, padding: '2px 9px', background: lv.bg, color: lv.text, border: `1px solid ${lv.border}` }}>
          {log.level}
        </span>
        <span className="font-mono font-semibold" style={{ fontSize: 16, color: '#211C16' }}>{log.service}</span>
        <span className="font-mono" style={{ fontSize: 14, color: '#9C8F7B' }}>structured log (JSON)</span>
        {cidChip && (
          <span className="ml-auto rounded-full border font-mono" style={{ fontSize: 14, padding: '2px 12px', background: cidChip.bg, color: cidChip.text, borderColor: cidChip.border }}>
            {cidChip.t}
          </span>
        )}
      </div>

      <div className="font-mono" style={{ fontSize: 16, lineHeight: '24px' }}>
        <div style={{ color: '#9C8F7B' }}>{'{'}</div>
        {fields.map((f, i) => (
          <div
            key={f.k}
            style={{
              paddingLeft: 18,
              background: f.hl ? `${ACCENT.accent}22` : 'transparent',
              borderLeft: f.hl ? `3px solid ${ACCENT.accent}` : '3px solid transparent',
            }}
          >
            <span style={{ color: f.hl ? ACCENT.accentText : '#8A7C61' }}>"{f.k}"</span>
            <span style={{ color: '#9C8F7B' }}>: </span>
            <span style={{ color: f.num ? '#2563EB' : f.hl ? ACCENT.accentDeep : '#3A3329', fontWeight: f.hl ? 700 : 400 }}>{f.v}</span>
            {i < fields.length - 1 && <span style={{ color: '#9C8F7B' }}>,</span>}
          </div>
        ))}
        <div style={{ color: '#9C8F7B' }}>{'}'}</div>
      </div>
    </motion.div>
  )
}

// ── Golden Signals dashboard (metrics mode) ──────────────────────────────────

type Tri = { border: string; bg: string; text: string }
const OK: Tri = { border: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text }
const WARN: Tri = { border: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text }
const BAD: Tri = { border: FAIL.border, bg: FAIL.bg, text: FAIL.text }
const INFO: Tri = { border: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text }

function MetricsDashboard({ signals: s }: { signals: Signals }) {
  const latTone = s.p95 > 1000 ? BAD : s.p95 > 500 ? WARN : OK
  const errTone = s.errorRate > 5 ? BAD : s.errorRate > 1 ? WARN : OK
  const satTone = s.cpu > 90 ? BAD : s.cpu > 70 ? WARN : OK
  const sparkMax = Math.max(100, ...s.spark)

  return (
    <div className="grid" style={{ width: CHAIN_W, gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      {/* Latency */}
      <SignalCard title="Latency" alert="alert p95 > 1000ms" tone={latTone}>
        <div className="flex items-baseline" style={{ gap: 10 }}>
          <span className="font-mono font-semibold" style={{ fontSize: 34, color: latTone.text }}>
            p95 {s.p95}ms
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 15, color: '#6B6258' }}>
          p50 {s.p50} · p99 {s.p99} · avg {s.avg}ms
        </span>
        <div className="flex items-end" style={{ gap: 3, height: 34, marginTop: 4 }}>
          {s.spark.map((v, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(8, (v / sparkMax) * 100)}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              style={{ flex: 1, borderRadius: 3, background: v >= 500 ? FAIL.border : v >= 80 ? NODE.active.border : NODE.done.border }}
            />
          ))}
        </div>
      </SignalCard>

      {/* Traffic */}
      <SignalCard title="Traffic" alert="request masuk" tone={INFO}>
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <span className="font-mono font-semibold" style={{ fontSize: 34, color: INFO.text }}>
            {s.total}
          </span>
          <span className="font-mono" style={{ fontSize: 18, color: '#6B6258' }}>
            req
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 15, color: '#6B6258' }}>
          ≈ {s.reqPerSec} req/detik
        </span>
        <div className="relative overflow-hidden rounded-full" style={{ height: 12, background: '#EAF1FB', marginTop: 8 }}>
          <motion.div
            animate={{ width: `${Math.min(s.total / 12, 1) * 100}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 26 }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: INFO.border }}
          />
        </div>
      </SignalCard>

      {/* Errors */}
      <SignalCard title="Errors" alert="alert > 5%" tone={errTone}>
        <div className="flex items-baseline" style={{ gap: 10 }}>
          <span className="font-mono font-semibold" style={{ fontSize: 34, color: errTone.text }}>
            {s.errorRate}%
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 15, color: '#6B6258' }}>
          {s.errors} dari {s.total} request gagal (4xx/5xx)
        </span>
      </SignalCard>

      {/* Saturation */}
      <SignalCard title="Saturation" alert="alert > 90%" tone={satTone}>
        <Bar label="CPU" value={s.cpu} />
        <Bar label="MEM" value={s.mem} />
      </SignalCard>
    </div>
  )
}

function SignalCard({ title, alert, tone, children }: { title: string; alert: string; tone: Tri; children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ borderColor: tone.border, background: tone.bg }}
      className="flex flex-col rounded-2xl border-2"
      style={{ padding: '14px 18px', gap: 6, minHeight: 132 }}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-semibold" style={{ fontSize: 16, letterSpacing: '0.06em', color: '#57503F', textTransform: 'uppercase' }}>
          {title}
        </span>
        <span className="font-mono" style={{ fontSize: 13, color: '#9C8F7B' }}>
          {alert}
        </span>
      </div>
      {children}
    </motion.div>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  const tone = value > 90 ? FAIL.border : value > 70 ? NODE.active.border : NODE.done.border
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <span className="font-mono" style={{ fontSize: 15, color: '#6B6258', width: 44 }}>
        {label}
      </span>
      <div className="relative flex-1 overflow-hidden rounded-full" style={{ height: 12, background: '#EFE6D7' }}>
        <motion.div
          animate={{ width: `${value}%`, background: tone }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
          className="absolute inset-y-0 left-0 rounded-full"
        />
      </div>
      <span className="font-mono font-semibold" style={{ fontSize: 16, color: '#211C16', width: 52, textAlign: 'right' }}>
        {value}%
      </span>
    </div>
  )
}
