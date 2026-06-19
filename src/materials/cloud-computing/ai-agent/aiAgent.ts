/**
 * Precomputed "AI Agent" loop — one Step = a full snapshot of the board. The
 * animation just replays these frames.
 *
 * An agent is an LLM that does not answer in one shot. It runs a ReAct loop:
 *
 *   THINK   : reason about the goal + what it already knows (scratchpad/memory).
 *   ACT     : CHOOSE a tool and call it with arguments.
 *   OBSERVE : read the tool's result and append it to memory.
 *   (repeat until the goal is met)
 *   FINAL   : write the grounded answer from everything in memory.
 *
 * This is what separates an Agent from plain RAG: planning, tool choice, and a
 * loop that runs as many steps as the task needs.
 *
 * Example goal: figure out a tip and convert it to euros — two tools, two turns.
 */

export type Phase = 'think' | 'act' | 'observe' | 'final'

export type ToolId = 'calc' | 'fx' | 'search'

export type Cue = 'think' | 'call' | 'result' | 'answer' | 'done' | null

export interface ToolSpec {
  id: ToolId
  label: string
  desc: string
}

/** Tools the agent is allowed to use. Each turn it CHOOSES one — over the run
 *  all three get used, which is the whole point: the agent decides. */
export const TOOLS: ToolSpec[] = [
  { id: 'calc', label: 'Calculator', desc: 'arithmetic' },
  { id: 'fx', label: 'Currency API', desc: 'convert money' },
  { id: 'search', label: 'Web Search', desc: 'look things up' },
]

/** One finished turn that has landed in the scratchpad (agent memory). */
export interface MemoryEntry {
  id: string
  iteration: number
  thought: string
  tool: ToolId
  args: string
  result: string
}

export interface AgentStep {
  phase: Phase
  /** Loop turn, 1-based (0 before the loop starts). */
  iteration: number
  /** Current reasoning shown inside the Agent card (null = none yet). */
  thought: string | null
  /** Tool the agent is calling this frame (drives the highlight + call chip). */
  toolCall: { tool: ToolId; args: string } | null
  /** Tool result for the OBSERVE frame (null otherwise). */
  observation: string | null
  /** Finished turns accumulated so far (the scratchpad). */
  memory: MemoryEntry[]
  /** Final grounded answer (null until the loop ends). */
  answer: string | null
  line: number
  status: string
  sound: Cue
}

export const GOAL = "What's a 15% tip on my $86 dinner, in euros (EUR)?"
const ANSWER = '15% tip = $12.90  ≈  €11.87'

/** ReAct-style agent loop (pseudocode) shown in the CodeBlock. */
export const CODE_SOURCE = [
  '# ReAct agent loop',
  'memory = []',
  'while not done:',
  '    thought = llm.think(goal, memory)        # reason',
  '    action  = llm.choose_tool(thought)       # decide',
  '    result  = tools[action.name](action.args)  # act',
  '    memory.append(thought, action, result)   # observe',
  '    done = llm.goal_met(goal, memory)',
  '',
  'answer = llm.finalize(goal, memory)          # grounded',
]

/** The three turns this agent needs, scripted end to end — one per tool. */
const TURNS: Omit<MemoryEntry, 'id'>[] = [
  {
    iteration: 1,
    thought: 'First, compute 15% of $86.',
    tool: 'calc',
    args: '86 * 0.15',
    result: '12.90',
  },
  {
    iteration: 2,
    thought: 'I need today’s USD→EUR rate — look it up.',
    tool: 'search',
    args: 'USD to EUR rate today',
    result: '1 USD = 0.92 EUR',
  },
  {
    iteration: 3,
    thought: 'Now convert $12.90 at 0.92.',
    tool: 'fx',
    args: '12.90 USD @ 0.92',
    result: '11.87 EUR',
  },
]

type Req = Pick<AgentStep, 'line' | 'status'>

function b(p: Partial<AgentStep> & Req): AgentStep {
  return {
    phase: 'think',
    iteration: 0,
    thought: null,
    toolCall: null,
    observation: null,
    memory: [],
    answer: null,
    sound: null,
    ...p,
  }
}

export function buildSteps(): AgentStep[] {
  const steps: AgentStep[] = []
  const memory: MemoryEntry[] = []

  // Intro — the goal lands, loop not started yet.
  steps.push(
    b({
      phase: 'think',
      iteration: 0,
      line: 0,
      status: `Goal received: "${GOAL}"`,
      sound: 'think',
    }),
  )

  TURNS.forEach((turn) => {
    const snapshot = memory.map((m) => ({ ...m }))

    // THINK
    steps.push(
      b({
        phase: 'think',
        iteration: turn.iteration,
        thought: turn.thought,
        memory: snapshot,
        line: 3,
        status: `Turn ${turn.iteration} · Think — ${turn.thought}`,
        sound: 'think',
      }),
    )

    // ACT — choose + call a tool
    steps.push(
      b({
        phase: 'act',
        iteration: turn.iteration,
        thought: turn.thought,
        toolCall: { tool: turn.tool, args: turn.args },
        memory: snapshot,
        line: 5,
        status: `Turn ${turn.iteration} · Act — call ${toolLabel(turn.tool)}(${turn.args})`,
        sound: 'call',
      }),
    )

    // OBSERVE — read the result, append to memory
    const entry: MemoryEntry = { id: `m${turn.iteration}`, ...turn }
    memory.push(entry)
    steps.push(
      b({
        phase: 'observe',
        iteration: turn.iteration,
        thought: turn.thought,
        toolCall: { tool: turn.tool, args: turn.args },
        observation: turn.result,
        memory: memory.map((m) => ({ ...m })),
        line: 6,
        status: `Turn ${turn.iteration} · Observe — result: ${turn.result}`,
        sound: 'result',
      }),
    )
  })

  // Goal met — exit the loop.
  steps.push(
    b({
      phase: 'final',
      iteration: TURNS.length,
      memory: memory.map((m) => ({ ...m })),
      line: 7,
      status: 'Goal met — all sub-tasks done. Exit the loop.',
      sound: 'think',
    }),
  )

  // FINAL — grounded answer from memory.
  steps.push(
    b({
      phase: 'final',
      iteration: TURNS.length,
      memory: memory.map((m) => ({ ...m })),
      answer: ANSWER,
      line: 9,
      status: 'Finalize — the answer is built from the tool results, not guessed.',
      sound: 'answer',
    }),
  )
  steps.push(
    b({
      phase: 'final',
      iteration: TURNS.length,
      memory: memory.map((m) => ({ ...m })),
      answer: ANSWER,
      line: 9,
      status: 'Agent = reason → choose a tool → act → observe → repeat → answer.',
      sound: 'done',
    }),
  )

  return steps
}

export function toolLabel(id: ToolId): string {
  return TOOLS.find((t) => t.id === id)?.label ?? id
}
