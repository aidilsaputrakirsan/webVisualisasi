import { motion } from 'framer-motion'
import { NODE } from '../palette'
import type { GhaStep, JobId, JobStatus, JobView, StepStatus } from './gha'
import {
  BranchIcon,
  BrowserIcon,
  CheckIcon,
  ContainerIcon,
  CrossIcon,
  DotIcon,
  ServerIcon,
  SpinnerIcon,
} from './Icons'

/** Red state isn't in the shared palette (failure is special to CI). */
const FAIL = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B', shadow: '0 4px 18px rgba(220,38,38,0.22)' }
const SKIP = { border: '#D3C8B6', bg: '#F1ECE3', text: '#9C8F7B', shadow: '0 1px 4px rgba(0,0,0,0.05)' }

const JOB_ICON: Record<JobId, ({ size }: { size?: number }) => JSX.Element> = {
  backend: ServerIcon,
  frontend: BrowserIcon,
  build: ContainerIcon,
}

function jobStyle(status: JobStatus) {
  switch (status) {
    case 'pass':
      return NODE.done
    case 'running':
      return NODE.active
    case 'fail':
      return FAIL
    case 'skip':
      return SKIP
    default:
      return NODE.idle
  }
}

function chipFor(status: JobStatus) {
  switch (status) {
    case 'pass':
      return { label: 'passed', ...NODE.done }
    case 'running':
      return { label: 'running', ...NODE.active }
    case 'fail':
      return { label: 'failed', ...FAIL }
    case 'skip':
      return { label: 'skipped', ...SKIP }
    default:
      return { label: 'queued', ...NODE.idle }
  }
}

function StepGlyph({ status }: { status: StepStatus }) {
  if (status === 'pass') return <span style={{ color: NODE.done.border, display: 'flex' }}><CheckIcon /></span>
  if (status === 'fail') return <span style={{ color: FAIL.border, display: 'flex' }}><CrossIcon /></span>
  if (status === 'running') return <span style={{ color: NODE.active.border, display: 'flex' }}><SpinnerIcon /></span>
  return <span style={{ color: '#C2B7A4', display: 'flex' }}><DotIcon /></span>
}

function JobCard({ job, focused, width }: { job: JobView; focused: boolean; width: number }) {
  const st = jobStyle(job.status)
  const chip = chipFor(job.status)
  const Icon = JOB_ICON[job.id]
  return (
    <motion.div
      layout
      animate={{
        borderColor: st.border,
        boxShadow: focused ? st.shadow : '0 1px 4px rgba(0,0,0,0.05)',
        scale: focused ? 1.02 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="rounded-2xl border-2"
      style={{ width, background: '#FFFFFF', padding: 18 }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center" style={{ gap: 11 }}>
          <motion.span animate={{ color: st.border }} style={{ display: 'flex' }}>
            <Icon size={28} />
          </motion.span>
          <span className="font-semibold" style={{ fontSize: 23, color: '#211C16' }}>
            {job.label}
          </span>
        </div>
        <motion.span
          animate={{ background: chip.bg, color: chip.text, borderColor: chip.border }}
          className="flex items-center rounded-full border font-mono"
          style={{ fontSize: 16, padding: '4px 12px', gap: 7 }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: chip.border }} />
          {chip.label}
        </motion.span>
      </div>

      <div className="flex flex-col" style={{ gap: 7 }}>
        {job.steps.map((s, i) => {
          const active = s.status === 'running'
          const cellBg =
            s.status === 'pass'
              ? NODE.done.bg
              : s.status === 'fail'
                ? FAIL.bg
                : active
                  ? NODE.active.bg
                  : '#F4F5FA'
          const txt =
            s.status === 'pass'
              ? NODE.done.text
              : s.status === 'fail'
                ? FAIL.text
                : active
                  ? NODE.active.text
                  : '#8A8073'
          return (
            <motion.div
              key={i}
              animate={{ background: cellBg }}
              className="flex items-center rounded-lg font-mono"
              style={{ gap: 11, padding: '8px 13px', fontSize: 19 }}
            >
              <span style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                <StepGlyph status={s.status} />
              </span>
              <span style={{ color: txt }}>{s.name}</span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function Connector({ active, done }: { active: boolean; done: boolean }) {
  const color = done ? NODE.done.border : active ? NODE.active.border : '#D3C8B6'
  return (
    <div className="flex flex-col items-center" style={{ height: 30 }}>
      <motion.div animate={{ background: color }} style={{ width: 3, height: 22, borderRadius: 2 }} />
      <motion.div
        animate={{ borderTopColor: color }}
        style={{
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: `9px solid ${color}`,
        }}
      />
    </div>
  )
}

export default function PipelineView({ step }: { step: GhaStep }) {
  const [backend, frontend, build] = step.jobs
  const bothDone = backend.status === 'pass' && frontend.status === 'pass'
  const anyJobRunning = backend.status === 'running' || frontend.status === 'running'

  return (
    <div className="flex flex-col items-center" style={{ width: 820 }}>
      {/* Trigger event */}
      <motion.div
        animate={{
          borderColor: step.trigger ? NODE.info.border : '#D3C8B6',
          background: step.trigger ? NODE.info.bg : '#FFFFFF',
          scale: step.focus === 'trigger' ? 1.04 : 1,
        }}
        className="flex items-center rounded-full border-2 font-mono"
        style={{ gap: 11, padding: '10px 26px', fontSize: 20 }}
      >
        <motion.span animate={{ color: step.trigger ? NODE.info.border : '#8A8073' }} style={{ display: 'flex' }}>
          <BranchIcon size={22} />
        </motion.span>
        <span style={{ color: step.trigger ? NODE.info.text : '#8A8073' }}>
          on: push / pull_request → <b>main</b>
        </span>
      </motion.div>

      <Connector active={step.trigger && !bothDone} done={step.trigger} />

      {/* Parallel jobs */}
      <div className="flex items-start justify-center" style={{ gap: 24 }}>
        <JobCard job={backend} focused={step.focus === 'backend'} width={400} />
        <JobCard job={frontend} focused={step.focus === 'frontend'} width={400} />
      </div>

      {/* Converge → build-docker */}
      <Connector active={anyJobRunning} done={bothDone} />

      <JobCard job={build} focused={step.focus === 'build'} width={520} />

      {/* Result banner */}
      <div style={{ height: 18 }} />
      <ResultBanner result={step.result} />
    </div>
  )
}

function ResultBanner({ result }: { result: GhaStep['result'] }) {
  const map = {
    pending: { ...NODE.idle, msg: 'Checks running…', glyph: <SpinnerIcon size={20} /> },
    pass: { ...NODE.done, msg: 'Pipeline PASSED — boleh merge', glyph: <CheckIcon size={22} /> },
    fail: { ...FAIL, msg: 'Pipeline FAILED — merge diblokir', glyph: <CrossIcon size={22} /> },
  }[result]
  return (
    <motion.div
      animate={{ background: map.bg, borderColor: map.border, boxShadow: map.shadow, color: map.text }}
      className="flex items-center justify-center rounded-xl border-2 font-semibold"
      style={{ gap: 12, padding: '12px 28px', fontSize: 24, width: 520 }}
    >
      <span style={{ display: 'flex' }}>{map.glyph}</span>
      {map.msg}
    </motion.div>
  )
}
