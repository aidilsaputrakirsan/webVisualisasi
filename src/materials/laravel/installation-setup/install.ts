/**
 * "From zero to a running Laravel 12 app" — every command from the official
 * installation guide, precomputed into a `Step[]` (SKILLS.md §4).
 *
 * Three things animate together: the terminal transcript, the project tree that
 * fills in as files are created, and the three dev processes `composer run dev`
 * starts.
 */

export interface TreeNode {
  id: string
  label: string
  /** Indent level in the tree drawing. */
  depth: number
  kind: 'dir' | 'file'
  /** One-line explanation shown next to the node once it appears. */
  note: string
}

/** The Laravel 12 skeleton, in the order the animation reveals it. */
export const TREE: TreeNode[] = [
  { id: 'app', label: 'app/', depth: 0, kind: 'dir', note: 'Models, controllers, your code' },
  { id: 'bootstrap', label: 'bootstrap/app.php', depth: 0, kind: 'file', note: 'Routing, middleware, exceptions' },
  { id: 'config', label: 'config/', depth: 0, kind: 'dir', note: 'Every setting, documented' },
  { id: 'database', label: 'database/', depth: 0, kind: 'dir', note: 'Migrations, seeders, factories' },
  { id: 'sqlite', label: 'database.sqlite', depth: 1, kind: 'file', note: 'Default DB — created for you' },
  { id: 'public', label: 'public/index.php', depth: 0, kind: 'file', note: 'The single entry point' },
  { id: 'resources', label: 'resources/views/', depth: 0, kind: 'dir', note: 'Blade templates + CSS/JS' },
  { id: 'routes', label: 'routes/web.php', depth: 0, kind: 'file', note: 'Your URL map' },
  { id: 'env', label: '.env', depth: 0, kind: 'file', note: 'Secrets — never committed' },
]

export interface Process {
  id: string
  label: string
  port: string
}

/** What `composer run dev` boots, all at once. */
export const PROCESSES: Process[] = [
  { id: 'server', label: 'artisan serve', port: ':8000' },
  { id: 'queue', label: 'queue:listen', port: 'worker' },
  { id: 'vite', label: 'npm run dev', port: ':5173' },
]

export interface TerminalLine {
  text: string
  kind: 'cmd' | 'out'
}

export interface Step {
  /** Terminal transcript so far (trimmed to what fits the frame). */
  lines: TerminalLine[]
  /** Ids of TREE nodes revealed so far. */
  revealed: string[]
  /** The tree node to highlight, or null. */
  focus: string | null
  /** Ids of PROCESSES that are running. */
  running: string[]
  /** true once the app answers on http://localhost:8000. */
  live: boolean
  status: string
  line: number
  sound: 'type' | 'create' | 'boot' | 'done'
}

/** The commands, mirroring laravel.com/docs/12.x/installation. */
export const CODE_SOURCE = [
  '# 1. Install PHP 8.2+, Composer and the installer',
  'composer global require laravel/installer',
  '',
  '# 2. Scaffold the app (prompts for kit + database)',
  'laravel new example-app',
  '',
  '# 3. Frontend assets',
  'cd example-app',
  'npm install && npm run build',
  '',
  '# 4. Run server + queue + Vite together',
  'composer run dev',
  '',
  '# open http://localhost:8000',
]

interface Beat {
  cmd?: string
  out?: string
  reveal?: string[]
  focus?: string | null
  run?: string[]
  live?: boolean
  status: string
  line: number
  sound: Step['sound']
}

const BEATS: Beat[] = [
  {
    status: 'Laravel 12 needs PHP 8.2-8.5 plus Composer.',
    line: 0,
    sound: 'type',
  },
  {
    cmd: 'composer global require laravel/installer',
    out: 'Installing laravel/installer ... done',
    status: 'The `laravel` command now scaffolds new apps.',
    line: 1,
    sound: 'create',
  },
  {
    cmd: 'laravel new example-app',
    out: '? Which starter kit? none / react / vue / livewire',
    status: 'New in 12: React, Vue, Svelte and Livewire starter kits.',
    line: 4,
    sound: 'type',
  },
  {
    out: '? Which database? sqlite (default) / mysql / pgsql',
    status: 'SQLite is the default: zero setup, a real file on disk.',
    line: 4,
    sound: 'type',
  },
  {
    out: 'Creating a "laravel/laravel" project ...',
    reveal: ['app', 'bootstrap'],
    focus: 'bootstrap',
    status: 'bootstrap/app.php configures routing, middleware, exceptions.',
    line: 4,
    sound: 'create',
  },
  {
    reveal: ['config', 'database', 'sqlite'],
    focus: 'sqlite',
    out: 'INFO  Preparing database ... DONE',
    status: 'The installer creates the SQLite file and migrates it for you.',
    line: 4,
    sound: 'create',
  },
  {
    reveal: ['public', 'resources', 'routes'],
    focus: 'public',
    status: 'Every request enters through one file: public/index.php.',
    line: 4,
    sound: 'create',
  },
  {
    reveal: ['env'],
    focus: 'env',
    out: 'Application key set successfully.',
    status: '.env holds secrets. It is git-ignored — never commit it.',
    line: 4,
    sound: 'create',
  },
  {
    cmd: 'npm install && npm run build',
    out: 'vite building for production ... built in 1.42s',
    focus: null,
    status: 'Vite compiles resources/ into versioned files in public/build.',
    line: 8,
    sound: 'boot',
  },
  {
    cmd: 'composer run dev',
    run: ['server'],
    status: 'One command, three processes. First: the PHP dev server on port 8000.',
    line: 11,
    sound: 'boot',
  },
  {
    run: ['server', 'queue'],
    status: 'Second: a queue worker, so background jobs run while you develop.',
    line: 11,
    sound: 'boot',
  },
  {
    run: ['server', 'queue', 'vite'],
    out: 'VITE ready — hot reload on :5173',
    status: 'Third: Vite in watch mode — the browser updates instantly.',
    line: 11,
    sound: 'boot',
  },
  {
    live: true,
    out: 'Server running on [http://127.0.0.1:8000]',
    status: 'Your Laravel 12 app is running. Next: how a request travels through it.',
    line: 13,
    sound: 'done',
  },
]

export function buildSteps(): Step[] {
  const steps: Step[] = []
  let lines: TerminalLine[] = []
  let revealed: string[] = []
  let running: string[] = []
  let live = false

  for (const b of BEATS) {
    if (b.cmd) lines = [...lines, { text: b.cmd, kind: 'cmd' }]
    if (b.out) lines = [...lines, { text: b.out, kind: 'out' }]
    if (b.reveal) revealed = [...revealed, ...b.reveal]
    if (b.run) running = b.run
    if (b.live) live = true
    steps.push({
      lines: lines.slice(-6), // keep the transcript inside the frame
      revealed: [...revealed],
      focus: b.focus === undefined ? null : b.focus,
      running: [...running],
      live,
      status: b.status,
      line: b.line,
      sound: b.sound,
    })
  }

  return steps
}
