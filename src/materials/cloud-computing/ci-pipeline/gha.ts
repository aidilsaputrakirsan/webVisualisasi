/**
 * Precomputed "GitHub Actions CI pipeline run" — one Step = a full snapshot of
 * the pipeline (trigger, every job + its steps, final result). The animation
 * just replays these frames, so Play/Step/Reset stays trivial.
 *
 * Two modes mirror the module's CI lesson:
 *   - 'pass' : semua test hijau → build-docker jalan → pipeline PASSED.
 *   - 'fail' : pytest gagal → build-docker di-skip → pipeline FAILED (PR diblokir).
 */

export type Mode = 'pass' | 'fail'

/** Sound cue mapped to the audio synth in the material. */
export type Cue = 'trigger' | 'start' | 'pass' | 'fail' | 'skip' | 'done' | null

export type JobId = 'backend' | 'frontend' | 'build'
export type JobStatus = 'idle' | 'running' | 'pass' | 'fail' | 'skip'
export type StepStatus = 'idle' | 'running' | 'pass' | 'fail'

export interface JobView {
  id: JobId
  label: string
  icon: string
  status: JobStatus
  steps: { name: string; status: StepStatus }[]
}

export interface GhaStep {
  /** Trigger event has fired (push / PR). */
  trigger: boolean
  jobs: JobView[]
  result: 'pending' | 'pass' | 'fail'
  /** Which block is in focus (drives the glow). */
  focus: JobId | 'trigger' | null
  line: number
  status: string
  sound: Cue
}

/** The ci.yml shown in the CodeBlock (indices referenced by *Lines below). */
export const CODE_SOURCE = [
  '# .github/workflows/ci.yml',
  'on:',
  '  push:         { branches: [main] }   # trigger',
  '  pull_request: { branches: [main] }',
  'jobs:',
  '  test-backend:            # paralel',
  '    steps:',
  '      - uses: actions/checkout@v4',
  '      - uses: actions/setup-python@v5',
  '      - run:  pip install -r requirements.txt',
  '      - run:  pytest --cov',
  '  test-frontend:           # paralel',
  '    steps:',
  '      - uses: actions/setup-node@v4',
  '      - run:  npm ci',
  '      - run:  npm test && npm run build',
  '  build-docker:',
  '    needs: [test-backend, test-frontend]',
  '      - run:  docker build ./backend ./frontend',
]

const backendLines = [7, 8, 9, 10]
const frontendLines = [13, 14, 15]
const buildLines = [18, 18]
const TRIGGER_LINE = 2
const NEEDS_LINE = 17

export const MODES: Record<Mode, { label: string; desc: string }> = {
  pass: { label: 'Semua Lulus', desc: 'Semua test hijau → build-docker jalan → PR aman di-merge' },
  fail: { label: 'Test Gagal', desc: 'pytest gagal → build-docker di-skip → PR diblokir' },
}

function initJobs(): JobView[] {
  return [
    {
      id: 'backend',
      label: 'Test Backend',
      icon: '🐍',
      status: 'idle',
      steps: [
        { name: 'Checkout code', status: 'idle' },
        { name: 'Setup Python', status: 'idle' },
        { name: 'Install deps', status: 'idle' },
        { name: 'Run pytest', status: 'idle' },
      ],
    },
    {
      id: 'frontend',
      label: 'Test Frontend',
      icon: '⚛️',
      status: 'idle',
      steps: [
        { name: 'Setup Node', status: 'idle' },
        { name: 'npm ci', status: 'idle' },
        { name: 'Test & Build', status: 'idle' },
      ],
    },
    {
      id: 'build',
      label: 'Build Docker',
      icon: '🐳',
      status: 'idle',
      steps: [
        { name: 'Build backend image', status: 'idle' },
        { name: 'Build frontend image', status: 'idle' },
      ],
    },
  ]
}

const clone = (jobs: JobView[]): JobView[] => JSON.parse(JSON.stringify(jobs))

export function buildSteps(mode: Mode): GhaStep[] {
  const jobs = initJobs()
  const backend = jobs[0]
  const frontend = jobs[1]
  const build = jobs[2]
  const steps: GhaStep[] = []

  const snap = (p: Partial<GhaStep>) =>
    steps.push({
      trigger: true,
      jobs: clone(jobs),
      result: 'pending',
      focus: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  // 0) Idle / belum jalan.
  steps.push({
    trigger: false,
    jobs: clone(jobs),
    result: 'pending',
    focus: null,
    line: 0,
    status: 'Workflow menunggu trigger — belum ada yang jalan.',
    sound: null,
  })

  // 1) Trigger.
  snap({
    focus: 'trigger',
    line: TRIGGER_LINE,
    status: 'git push ke branch main · workflow ter-trigger di cloud GitHub',
    sound: 'trigger',
  })

  // 2) Mulai dua job paralel.
  backend.status = 'running'
  frontend.status = 'running'
  snap({
    focus: 'backend',
    line: 4,
    status: '2 job berjalan PARALEL di runner berbeda — lebih cepat',
    sound: 'start',
  })

  const failPytest = mode === 'fail'
  const maxLen = Math.max(backend.steps.length, frontend.steps.length)

  for (let t = 0; t < maxLen; t++) {
    // — Backend step t —
    if (t < backend.steps.length && backend.status !== 'fail') {
      const s = backend.steps[t]
      s.status = 'running'
      snap({ focus: 'backend', line: backendLines[t], status: `backend → ${s.name}…`, sound: 'start' })

      const isPytestFail = failPytest && t === backend.steps.length - 1
      if (isPytestFail) {
        s.status = 'fail'
        backend.status = 'fail'
        snap({
          focus: 'backend',
          line: backendLines[t],
          status: 'backend: pytest GAGAL — test_health: assert 200 == 999',
          sound: 'fail',
        })
      } else {
        s.status = 'pass'
        if (t === backend.steps.length - 1) backend.status = 'pass'
        snap({ focus: 'backend', line: backendLines[t], status: `backend: ${s.name} lolos`, sound: 'pass' })
      }
    }

    // — Frontend step t (independen — tetap jalan walau backend gagal) —
    if (t < frontend.steps.length) {
      const s = frontend.steps[t]
      s.status = 'running'
      snap({ focus: 'frontend', line: frontendLines[t], status: `frontend → ${s.name}…`, sound: 'start' })

      s.status = 'pass'
      if (t === frontend.steps.length - 1) frontend.status = 'pass'
      snap({ focus: 'frontend', line: frontendLines[t], status: `frontend: ${s.name} lolos`, sound: 'pass' })
    }
  }

  if (mode === 'pass') {
    // 3) build-docker butuh kedua job hijau.
    build.status = 'running'
    snap({
      focus: 'build',
      line: NEEDS_LINE,
      status: 'needs: backend + frontend lulus → build-docker mulai',
      sound: 'start',
    })
    for (let k = 0; k < build.steps.length; k++) {
      const s = build.steps[k]
      s.status = 'running'
      snap({ focus: 'build', line: buildLines[k], status: `${s.name}…`, sound: 'start' })
      s.status = 'pass'
      snap({ focus: 'build', line: buildLines[k], status: `${s.name} sukses`, sound: 'pass' })
    }
    build.status = 'pass'
    snap({
      focus: null,
      line: 0,
      result: 'pass',
      status: 'Pipeline PASSED — semua checks hijau, PR aman di-merge!',
      sound: 'done',
    })
  } else {
    // 3) backend gagal → build-docker di-skip, pipeline merah.
    build.status = 'skip'
    snap({
      focus: 'build',
      line: NEEDS_LINE,
      status: 'build-docker di-SKIP — needs backend tidak terpenuhi',
      sound: 'skip',
    })
    snap({
      focus: null,
      line: 0,
      result: 'fail',
      status: 'Pipeline FAILED — PR diblokir, baca log & perbaiki test dulu',
      sound: 'fail',
    })
  }

  return steps
}
