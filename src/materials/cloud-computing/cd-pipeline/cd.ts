/**
 * Precomputed "Continuous Deployment run" — one Step = a full snapshot of the
 * CD pipeline (trigger event, every stage, the Railway services, the live URL).
 * The animation just replays these frames.
 *
 * Two modes mirror Modul 11's key lesson — the deploy GATE
 * (`if: github.ref == 'refs/heads/main' && github.event_name == 'push'`):
 *   - 'main' : merge ke main → CI lulus → gate terbuka → deploy ke Railway →
 *              health check → production LIVE.
 *   - 'pr'   : push di branch PR → CI lulus, tapi gate MENUTUP deploy
 *              (bukan main) → tidak ada deploy (aman).
 */

export type Mode = 'main' | 'pr'

export type Cue = 'trigger' | 'start' | 'pass' | 'skip' | 'deploy' | 'live' | null

export type StageId = 'ci' | 'gate' | 'deployBe' | 'deployFe' | 'health' | 'live'
export type StageStatus = 'idle' | 'running' | 'pass' | 'skip'

export type ServiceId = 'backend' | 'frontend' | 'db'
export type ServiceStatus = 'idle' | 'deploying' | 'live'

export interface StageView {
  id: StageId
  label: string
  sub: string
  status: StageStatus
}

export interface ServiceView {
  id: ServiceId
  label: string
  host: string
  status: ServiceStatus
}

export interface CdStep {
  event: Mode
  triggered: boolean
  stages: StageView[]
  services: ServiceView[]
  /** Deploy gate decision. */
  gate: 'pending' | 'open' | 'blocked'
  live: boolean
  url: string | null
  focus: StageId | null
  line: number
  status: string
  sound: Cue
}

export const PROD_URL = 'cloudapp.up.railway.app'

/** The deploy job shown in the CodeBlock (indices referenced by *LINE below). */
export const CODE_SOURCE = [
  '# ci.yml — job: deploy (CD)',
  '  deploy:',
  '    needs: [test-backend, test-frontend, build-docker]',
  "    if: github.ref == 'refs/heads/main'",
  "        && github.event_name == 'push'   # GATE",
  '    steps:',
  '      - uses: actions/checkout@v4',
  '      - run:  npm i -g @railway/cli',
  '      - run:  railway up --service backend   # deploy BE',
  '        env:  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}',
  '      - run:  railway up --service frontend  # deploy FE',
  '      - run:  curl .../health   # health check → 200',
]

const LINE = {
  needs: 2,
  gate: 4,
  deployBe: 8,
  deployFe: 10,
  health: 11,
  live: 0,
}

export const MODES: Record<Mode, { label: string; desc: string; event: string }> = {
  main: {
    label: 'Merge ke main',
    desc: 'CI lulus → gate terbuka → auto-deploy ke Railway → production live',
    event: 'push → main',
  },
  pr: {
    label: 'Push di PR',
    desc: 'CI lulus, tapi gate menutup deploy (bukan main) — tidak ada deploy',
    event: 'push → branch PR',
  },
}

function initStages(): StageView[] {
  return [
    { id: 'ci', label: 'CI — Test + Build', sub: 'pytest · vitest · docker', status: 'idle' },
    { id: 'gate', label: 'Deploy Gate', sub: 'if: ref == main && push', status: 'idle' },
    { id: 'deployBe', label: 'Deploy Backend', sub: 'railway up --service backend', status: 'idle' },
    { id: 'deployFe', label: 'Deploy Frontend', sub: 'railway up --service frontend', status: 'idle' },
    { id: 'health', label: 'Health Check', sub: 'GET /health → 200', status: 'idle' },
    { id: 'live', label: 'Production Live', sub: PROD_URL, status: 'idle' },
  ]
}

function initServices(): ServiceView[] {
  return [
    { id: 'backend', label: 'Backend', host: 'FastAPI', status: 'idle' },
    { id: 'frontend', label: 'Frontend', host: 'React', status: 'idle' },
    // Managed Postgres is provisioned up-front in the module → already live.
    { id: 'db', label: 'PostgreSQL', host: 'managed', status: 'live' },
  ]
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

export function buildSteps(mode: Mode): CdStep[] {
  const stages = initStages()
  const services = initServices()
  const steps: CdStep[] = []

  const find = (id: StageId) => stages.find((s) => s.id === id)!
  const svc = (id: ServiceId) => services.find((s) => s.id === id)!

  let gate: CdStep['gate'] = 'pending'
  let live = false
  let url: string | null = null

  const snap = (p: Partial<CdStep>) =>
    steps.push({
      event: mode,
      triggered: true,
      stages: clone(stages),
      services: clone(services),
      gate,
      live,
      url,
      focus: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  // 0) Idle.
  steps.push({
    event: mode,
    triggered: false,
    stages: clone(stages),
    services: clone(services),
    gate,
    live,
    url,
    focus: null,
    line: 0,
    status: 'Menunggu — PostgreSQL (managed) sudah siap di Railway.',
    sound: null,
  })

  // 1) Trigger.
  snap({
    focus: null,
    line: 0,
    status:
      mode === 'main'
        ? 'Merge ke main → event push memicu pipeline CI + CD'
        : 'Push ke branch PR → memicu pipeline (CI saja)',
    sound: 'trigger',
  })

  // 2) CI (test + build) — diasumsikan lulus (detailnya di Modul 10).
  find('ci').status = 'running'
  snap({ focus: 'ci', line: LINE.needs, status: 'CI berjalan: test backend + frontend + build docker…', sound: 'start' })
  find('ci').status = 'pass'
  snap({ focus: 'ci', line: LINE.needs, status: 'CI lolos — semua test hijau & image ter-build', sound: 'pass' })

  // 3) Gate — keputusan deploy.
  find('gate').status = 'running'
  snap({ focus: 'gate', line: LINE.gate, status: 'Cek gate: apakah ref == main DAN event == push?', sound: 'start' })

  if (mode === 'main') {
    gate = 'open'
    find('gate').status = 'pass'
    snap({ focus: 'gate', line: LINE.gate, status: 'Gate TERBUKA: ref == main ✓ → lanjut deploy', sound: 'pass' })

    // 4) Deploy backend.
    find('deployBe').status = 'running'
    svc('backend').status = 'deploying'
    snap({ focus: 'deployBe', line: LINE.deployBe, status: 'railway up: meng-upload & build image backend…', sound: 'deploy' })
    svc('backend').status = 'live'
    find('deployBe').status = 'pass'
    snap({ focus: 'deployBe', line: LINE.deployBe, status: 'Backend live di Railway (HTTPS otomatis)', sound: 'pass' })

    // 5) Deploy frontend.
    find('deployFe').status = 'running'
    svc('frontend').status = 'deploying'
    snap({ focus: 'deployFe', line: LINE.deployFe, status: 'railway up: build & deploy frontend…', sound: 'deploy' })
    svc('frontend').status = 'live'
    find('deployFe').status = 'pass'
    snap({ focus: 'deployFe', line: LINE.deployFe, status: 'Frontend live — terhubung ke backend via API URL', sound: 'pass' })

    // 6) Health check.
    find('health').status = 'running'
    snap({ focus: 'health', line: LINE.health, status: 'curl /health … menunggu service siap', sound: 'start' })
    find('health').status = 'pass'
    snap({ focus: 'health', line: LINE.health, status: 'Health check 200 — status: healthy, database: connected', sound: 'pass' })

    // 7) Live.
    find('live').status = 'running'
    snap({ focus: 'live', line: LINE.live, status: 'Menerbitkan domain publik…', sound: 'start' })
    live = true
    url = PROD_URL
    find('live').status = 'pass'
    snap({
      focus: 'live',
      line: LINE.live,
      status: `Production LIVE — https://${PROD_URL} sudah online untuk publik!`,
      sound: 'live',
    })
  } else {
    // Gate menutup deploy untuk PR.
    gate = 'blocked'
    find('gate').status = 'pass'
    ;(['deployBe', 'deployFe', 'health', 'live'] as StageId[]).forEach((id) => (find(id).status = 'skip'))
    snap({
      focus: 'gate',
      line: LINE.gate,
      status: 'Gate MENUTUP: ref != main → semua step deploy di-SKIP',
      sound: 'skip',
    })
    snap({
      focus: null,
      line: LINE.gate,
      status: 'PR aman: hanya CI yang jalan. Deploy menunggu merge ke main.',
      sound: 'pass',
    })
  }

  return steps
}
