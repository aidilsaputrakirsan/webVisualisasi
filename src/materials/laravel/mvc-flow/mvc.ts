/**
 * MVC in one request — Route → Controller → Model → Database → View → Response.
 *
 * The teaching trick here is the payload card: the SAME piece of data is shown
 * at every hop, changing shape as it goes (URI → int → SQL → table row →
 * Eloquent object → HTML). Students see that MVC is not five folders, it is one
 * value being handed along.
 */

export interface StationDef {
  id: string
  label: string
  where: string
  icon: 'route' | 'controller' | 'model' | 'database' | 'view' | 'response'
}

/** The six stops, in the order the request visits them. */
export const STATIONS: StationDef[] = [
  { id: 'route', label: 'Route', where: 'routes/web.php', icon: 'route' },
  { id: 'controller', label: 'Controller', where: 'PostController', icon: 'controller' },
  { id: 'model', label: 'Model', where: 'App\\Models\\Post', icon: 'model' },
  { id: 'db', label: 'Database', where: 'posts table', icon: 'database' },
  { id: 'view', label: 'View', where: 'posts/show.blade.php', icon: 'view' },
  { id: 'response', label: 'Response', where: '200 OK · text/html', icon: 'response' },
]

export type StationState = 'idle' | 'active' | 'done'

export interface Payload {
  /** What kind of value this is right now. */
  kind: string
  /** The value itself, rendered in mono. */
  body: string[]
}

export interface Step {
  states: StationState[]
  /** Index of the station currently holding the payload, or -1. */
  at: number
  payload: Payload
  status: string
  line: number
  sound: 'move' | 'query' | 'render' | 'done'
}

/** PostController + the Blade view it renders. */
export const CODE_SOURCE = [
  "Route::get('/posts/{post}', [PostController::class, 'show']);",
  '',
  'class PostController extends Controller',
  '{',
  '    public function show(Post $post)',
  '    {',
  "        return view('posts.show', ['post' => $post]);",
  '    }',
  '}',
  '',
  '{{-- resources/views/posts/show.blade.php --}}',
  '<h1>{{ $post->title }}</h1>',
  '<p>{{ $post->body }}</p>',
]

interface Beat {
  at: number
  payload: Payload
  status: string
  line: number
  sound: Step['sound']
}

const BEATS: Beat[] = [
  {
    at: 0,
    payload: { kind: 'HTTP request', body: ['GET /posts/12 HTTP/1.1', 'Host: example.test'] },
    status: 'The router matches /posts/{post} and pulls "12" out of the URI.',
    line: 0,
    sound: 'move',
  },
  {
    at: 1,
    payload: { kind: 'Route parameter', body: ['$post = 12'] },
    status: 'The controller runs. Its type-hint triggers the next step.',
    line: 4,
    sound: 'move',
  },
  {
    at: 2,
    payload: { kind: 'Route model binding', body: ['Post::findOrFail(12)'] },
    status: 'Type-hinting Post $post makes Laravel fetch the model for you.',
    line: 4,
    sound: 'move',
  },
  {
    at: 3,
    payload: { kind: 'SQL', body: ['select * from "posts"', 'where "id" = 12 limit 1'] },
    status: 'Eloquent runs one query. A missing row becomes a 404.',
    line: 4,
    sound: 'query',
  },
  {
    at: 3,
    payload: {
      kind: 'Table row',
      body: ['id  | title            | body', '12  | Laravel 12 is out | Ships new...'],
    },
    status: 'The database returns a plain row: columns and values, nothing more.',
    line: 4,
    sound: 'query',
  },
  {
    at: 2,
    payload: {
      kind: 'Eloquent model',
      body: ['Post {', '  id: 12,', '  title: "Laravel 12 is out"', '}'],
    },
    status: 'The Model wraps that row in an object with methods and casts.',
    line: 4,
    sound: 'move',
  },
  {
    at: 1,
    payload: { kind: 'View data', body: ["view('posts.show', ['post' => $post])"] },
    status: 'The controller picks a view and hands it the data.',
    line: 6,
    sound: 'move',
  },
  {
    at: 4,
    payload: { kind: 'Blade template', body: ['<h1>{{ $post->title }}</h1>', '<p>{{ $post->body }}</p>'] },
    status: 'Blade compiles to cached PHP, and escapes output against XSS.',
    line: 11,
    sound: 'render',
  },
  {
    at: 5,
    payload: {
      kind: 'HTML response',
      body: ['<h1>Laravel 12 is out</h1>', '<p>Ships new starter kits...</p>'],
    },
    status: 'Route decides, Controller coordinates, Model knows, View shows.',
    line: 12,
    sound: 'done',
  },
]

export function buildSteps(): Step[] {
  const states: StationState[] = STATIONS.map(() => 'idle')
  const steps: Step[] = []

  steps.push({
    states: [...states],
    at: -1,
    payload: { kind: 'Waiting', body: ['GET /posts/12'] },
    status: 'One request, one value. Follow the data, not the folders.',
    line: 0,
    sound: 'move',
  })

  let prev = -1
  for (const b of BEATS) {
    if (prev >= 0 && prev !== b.at) states[prev] = 'done'
    states[b.at] = 'active'
    steps.push({ states: [...states], at: b.at, payload: b.payload, status: b.status, line: b.line, sound: b.sound })
    prev = b.at
  }

  states[prev] = 'done'
  steps.push({
    states: [...states],
    at: -1,
    payload: { kind: 'HTML response', body: ['<h1>Laravel 12 is out</h1>'] },
    status: 'One job per layer — that is why a Laravel app stays readable.',
    line: 6,
    sound: 'done',
  })

  return steps
}
