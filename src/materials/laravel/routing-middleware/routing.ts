/**
 * Routing + middleware — how Laravel picks ONE route out of routes/web.php and
 * then wraps the call in an onion of middleware.
 *
 * Two modes make the lesson land:
 *   - `pass`    : the visitor is logged in, every layer is entered and exited.
 *   - `blocked` : `auth` short-circuits, so the controller never runs and the
 *                 response unwinds from the middle of the onion.
 */

export type Mode = 'pass' | 'blocked'

export const MODES: Record<Mode, { label: string; desc: string }> = {
  pass: {
    label: 'Authenticated',
    desc: 'One URI, one matching route, and an onion of middleware',
  },
  blocked: {
    label: 'Not logged in',
    desc: 'When a middleware short-circuits, the inner layers never run',
  },
}

export interface RouteDef {
  id: string
  method: string
  uri: string
  action: string
  /** Middleware ids this route is wrapped in, outermost first. */
  middleware: string[]
}

/** routes/web.php, in declaration order — the router tests them top to bottom. */
export const ROUTES: RouteDef[] = [
  { id: 'home', method: 'GET', uri: '/', action: 'HomeController@index', middleware: [] },
  { id: 'login', method: 'GET', uri: '/login', action: 'AuthController@form', middleware: [] },
  { id: 'store', method: 'POST', uri: '/posts', action: 'PostController@store', middleware: [] },
  { id: 'show', method: 'GET', uri: '/posts/{post}', action: 'PostController@show', middleware: ['web', 'throttle', 'auth'] },
  { id: 'edit', method: 'GET', uri: '/posts/{post}/edit', action: 'PostController@edit', middleware: [] },
]

/** The route the animation resolves to. */
const TARGET = 'show'
export const INCOMING = 'GET /posts/12'

export interface LayerDef {
  id: string
  label: string
  note: string
}

/** The onion, outermost first. `core` is the controller at the centre. */
export const LAYERS: LayerDef[] = [
  { id: 'web', label: 'web', note: 'session · cookies · CSRF' },
  { id: 'throttle', label: 'throttle:60,1', note: '60 requests per minute' },
  { id: 'auth', label: 'auth', note: 'must be logged in' },
  { id: 'core', label: 'PostController@show', note: 'your code' },
]

export type RouteState = 'idle' | 'testing' | 'miss' | 'match'
export type LayerState = 'idle' | 'entering' | 'inside' | 'exiting' | 'done' | 'blocked' | 'skipped'

export interface Step {
  /** State of each entry in ROUTES. */
  routes: RouteState[]
  /** State of each entry in LAYERS. */
  layers: LayerState[]
  /** Bound route parameters, e.g. { post: '12' }. */
  params: Record<string, string> | null
  /** Text on the travelling packet, or null when it is not on screen. */
  packet: string | null
  /** Index of the layer the packet sits in; -1 = outside the onion. */
  packetAt: number
  /** HTTP status once a response exists. */
  responseCode: string | null
  status: string
  line: number
  sound: 'test' | 'match' | 'enter' | 'exit' | 'block' | 'done'
}

/** routes/web.php as shown in the code panel. */
export const CODE_SOURCE = [
  "Route::get('/', [HomeController::class, 'index']);",
  "Route::get('/login', [AuthController::class, 'form']);",
  "Route::post('/posts', [PostController::class, 'store']);",
  '',
  "Route::get('/posts/{post}', [PostController::class, 'show'])",
  "    ->middleware(['auth', 'throttle:60,1'])",
  "    ->name('posts.show');",
  '',
  "Route::get('/posts/{post}/edit', [PostController::class, 'edit']);",
  '',
  '// PostController',
  'public function show(Post $post) {',
  "    return view('posts.show', ['post' => $post]);",
  '}',
]

/** Line in CODE_SOURCE for each route, by index. */
const ROUTE_LINE = [0, 1, 2, 4, 8]

export function buildSteps(mode: Mode): Step[] {
  const steps: Step[] = []
  const routes: RouteState[] = ROUTES.map(() => 'idle')
  const layers: LayerState[] = LAYERS.map(() => 'idle')
  let params: Record<string, string> | null = null

  const push = (
    over: Partial<Step> & Pick<Step, 'status' | 'line' | 'sound'>,
  ) =>
    steps.push({
      routes: [...routes],
      layers: [...layers],
      params,
      packet: null,
      packetAt: -1,
      responseCode: null,
      ...over,
    })

  push({
    status: `${INCOMING} arrives. The router walks routes/web.php top down.`,
    line: 0,
    sound: 'test',
    packet: 'GET /posts/12',
  })

  // Scan the route table until the first match wins.
  const targetIndex = ROUTES.findIndex((r) => r.id === TARGET)
  for (let i = 0; i <= targetIndex; i++) {
    const r = ROUTES[i]
    const hit = i === targetIndex
    routes[i] = 'testing'
    if (hit) {
      routes[i] = 'match'
      params = { post: '12' }
      push({
        status: `Match. '{post}' captures 12 and binds $post for you.`,
        line: ROUTE_LINE[i],
        sound: 'match',
        packet: 'GET /posts/12',
      })
    } else {
      routes[i] = 'miss'
      const why = r.method !== 'GET' ? `wrong method (${r.method})` : 'URI does not match'
      push({
        status: `${r.method} ${r.uri} — ${why}. Order matters: the first match wins.`,
        line: ROUTE_LINE[i],
        sound: 'test',
        packet: 'GET /posts/12',
      })
    }
  }

  const blockAt = LAYERS.findIndex((l) => l.id === 'auth')
  const core = LAYERS.length - 1
  const stopAt = mode === 'blocked' ? blockAt : core

  // Inward: each middleware runs its "before" half.
  const IN_NOTE: Record<string, string> = {
    web: 'The web group starts the session and checks the CSRF token.',
    throttle: 'throttle:60,1 counts this hit. 60 per minute is the budget.',
    auth: 'auth checks the session for a logged-in user.',
    core: 'Every layer passed. Your controller runs, $post already loaded.',
  }

  for (let i = 0; i <= stopAt; i++) {
    if (i > 0) layers[i - 1] = 'inside'
    layers[i] = 'entering'
    const l = LAYERS[i]
    const isBlock = mode === 'blocked' && i === blockAt
    if (isBlock) layers[i] = 'blocked'
    push({
      status: isBlock
        ? 'No logged-in user. auth redirects; the controller never runs.'
        : IN_NOTE[l.id],
      line: l.id === 'core' ? 11 : 5,
      sound: isBlock ? 'block' : i === core ? 'match' : 'enter',
      packet: 'Request',
      packetAt: i,
    })
  }

  if (mode === 'blocked') {
    for (let i = blockAt + 1; i < LAYERS.length; i++) layers[i] = 'skipped'
    push({
      status: 'Everything inside auth is skipped — that is the onion.',
      line: 5,
      sound: 'block',
      packet: '302',
      packetAt: blockAt,
      responseCode: '302 Redirect',
    })
  }

  // Outward: the response unwinds through the layers it entered.
  const OUT_NOTE: Record<string, string> = {
    auth: 'auth has nothing left to do on the way out.',
    throttle: 'throttle attaches the X-RateLimit headers on the way out.',
    web: 'The web group saves the session and sets the cookie.',
  }

  const code = mode === 'blocked' ? '302 Redirect' : '200 OK'
  const from = mode === 'blocked' ? blockAt - 1 : core - 1

  for (let i = from; i >= 0; i--) {
    layers[i + 1] = mode === 'blocked' && i + 1 === blockAt ? 'blocked' : 'done'
    layers[i] = 'exiting'
    push({
      status: OUT_NOTE[LAYERS[i].id],
      line: LAYERS[i].id === 'core' ? 12 : 5,
      sound: 'exit',
      packet: code.split(' ')[0],
      packetAt: i,
      responseCode: code,
    })
  }

  layers[0] = 'done'
  push({
    status:
      mode === 'blocked'
        ? 'The visitor lands on /login. Your controller never loaded.'
        : 'The page is sent back: in through every layer, out through each.',
    line: mode === 'blocked' ? 1 : 12,
    sound: 'done',
    responseCode: code,
  })

  return steps
}
