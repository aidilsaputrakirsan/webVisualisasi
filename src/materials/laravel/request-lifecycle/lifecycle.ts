/**
 * Laravel 12 request lifecycle — precomputed as a flat `Step[]` so playback is
 * just an index into an array (see SKILLS.md §4).
 *
 * The request travels DOWN the rail (browser → controller), then the response
 * travels back UP through the very same middleware, in reverse order. That
 * "onion" round trip is the whole point of the animation.
 */

export type Phase = 'in' | 'out'

export interface Stage {
  id: string
  /** Short label drawn in the rail. */
  label: string
  /** File or class this stage lives in. */
  where: string
  icon: 'globe' | 'bolt' | 'gear' | 'layers' | 'shield' | 'route' | 'controller' | 'response'
}

/** The nine stops a request makes, top to bottom. */
export const STAGES: Stage[] = [
  { id: 'browser', label: 'Browser', where: 'GET /posts/12', icon: 'globe' },
  { id: 'entry', label: 'Entry Point', where: 'public/index.php', icon: 'bolt' },
  { id: 'bootstrap', label: 'Bootstrap', where: 'bootstrap/app.php', icon: 'gear' },
  { id: 'kernel', label: 'HTTP Kernel', where: 'Illuminate\Foundation\Http\Kernel', icon: 'layers' },
  { id: 'global', label: 'Global Middleware', where: 'TrustProxies · HandleCors', icon: 'shield' },
  { id: 'router', label: 'Router', where: 'routes/web.php', icon: 'route' },
  { id: 'route-mw', label: 'Route Middleware', where: 'auth · throttle:60,1', icon: 'shield' },
  { id: 'controller', label: 'Controller', where: 'PostController@show', icon: 'controller' },
  { id: 'response', label: 'Response', where: 'view(\'posts.show\')', icon: 'response' },
]

export type StageState = 'idle' | 'active' | 'passed' | 'returned'

export interface Step {
  /** State of every stage in this frame, indexed like `STAGES`. */
  states: StageState[]
  /** Index of the stage the packet currently sits on, or -1 when parked. */
  at: number
  phase: Phase
  /** Label carried by the travelling packet. */
  packet: string
  status: string
  /** 0-based line of CODE_SOURCE to highlight. */
  line: number
  sound?: 'move' | 'hit' | 'turn' | 'done'
}

/** Narration for the downward (request) leg, aligned with STAGES. */
const IN_STATUS = [
  'A visitor hits GET /posts/12 in the browser.',
  'One entry point: public/index.php loads the Composer autoloader.',
  'bootstrap/app.php registers routing, middleware and exceptions.',
  'The HTTP Kernel pushes the Request into the pipeline.',
  'Global middleware runs first — it applies to every route.',
  'The router matches URI + method against routes/web.php.',
  'Route middleware runs: auth verifies, throttle counts the hit.',
  'Your controller runs — the only code you actually wrote.',
  'It returns a Response: a Blade view wrapped in headers.',
]

/** Narration for the upward (response) leg, aligned with STAGES. */
const OUT_STATUS = [
  'The browser paints the page. One round trip, nine stops.',
  'The PHP process ends. Laravel is stateless per request.',
  'The app terminates: terminable middleware runs last.',
  'The Kernel hands the Response back to the entry point.',
  'Global middleware gets a second pass on the way out.',
  'The response unwinds through the same layers it came in.',
  'Route middleware runs its after-logic and attaches cookies.',
  'The controller has returned; your code is done.',
  'The Response starts its trip back out through every layer.',
]

/** Line of CODE_SOURCE each stage maps to. */
const IN_LINE = [0, 2, 4, 5, 6, 7, 8, 10, 11]
const OUT_LINE = [0, 2, 13, 13, 6, 7, 8, 11, 11]

/** bootstrap/app.php — the Laravel 12 skeleton, trimmed for the 9:16 frame. */
export const CODE_SOURCE = [
  "// Browser: GET /posts/12",
  '',
  "// public/index.php",
  "require __DIR__.'/../vendor/autoload.php';",
  "$app = require_once __DIR__.'/../bootstrap/app.php';",
  'return Application::configure(basePath: dirname(__DIR__))',
  "    ->withMiddleware(fn (Middleware $m) => $m->web())",
  "    ->withRouting(web: __DIR__.'/../routes/web.php')",
  "    ->withExceptions(fn (Exceptions $e) => $e)",
  '    ->create();',
  "// PostController@show",
  "return view('posts.show', ['post' => $post]);",
  '',
  '$app->terminate($request, $response);',
]

export function buildSteps(): Step[] {
  const n = STAGES.length
  const steps: Step[] = []
  const states: StageState[] = Array(n).fill('idle')

  steps.push({
    states: [...states],
    at: -1,
    phase: 'in',
    packet: 'Request',
    status: 'One request, nine stops — and the same nine on the way out.',
    line: 0,
  })

  // Downward leg: request walks stage 0 → n-1.
  for (let i = 0; i < n; i++) {
    if (i > 0) states[i - 1] = 'passed'
    states[i] = 'active'
    steps.push({
      states: [...states],
      at: i,
      phase: 'in',
      packet: 'Request',
      status: IN_STATUS[i],
      line: IN_LINE[i],
      sound: i === n - 1 ? 'turn' : 'move',
    })
  }

  // Upward leg: the response unwinds through the same stages in reverse.
  for (let i = n - 1; i >= 0; i--) {
    if (i < n - 1) states[i + 1] = 'returned'
    states[i] = 'active'
    steps.push({
      states: [...states],
      at: i,
      phase: 'out',
      packet: 'Response',
      status: OUT_STATUS[i],
      line: OUT_LINE[i],
      sound: i === 0 ? 'done' : 'hit',
    })
  }

  states[0] = 'returned'
  steps.push({
    states: [...states],
    at: -1,
    phase: 'out',
    packet: 'Response',
    status: 'Middleware is an onion: in through every layer, out through each.',
    line: 0,
    sound: 'done',
  })

  return steps
}
