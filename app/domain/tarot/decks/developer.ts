import type { Deck } from '../deck.ts'

const POSITIONS = [
  { id: 'context', label: 'Context' },
  { id: 'problem', label: 'Problem' },
  { id: 'advice', label: 'Advice' },
] as const

interface CardSeed {
  readonly id: string
  readonly name: string
  readonly shortDescription: string
  readonly context: string
  readonly problem: string
  readonly advice: string
}

const CARD_SEEDS: readonly CardSeed[] = [
  {
    id: 'merge-conflict',
    name: 'The Merge Conflict',
    shortDescription: 'Two realities, one branch.',
    context: 'two reasonable decisions landed on the same lines',
    problem: 'each person is defending their own version of the plan',
    advice: 'settle one disagreement before adding another idea',
  },
  {
    id: 'infinite-refactor',
    name: 'The Infinite Refactor',
    shortDescription: 'Almost clean enough to start.',
    context: 'a small cleanup has turned into the main project',
    problem: 'the code keeps getting cleaner while the release keeps slipping',
    advice: 'ship one useful change before you rename another folder',
  },
  {
    id: 'deprecated-api',
    name: 'The Deprecated API',
    shortDescription: 'The future has stopped supporting you.',
    context: "yesterday's shortcut now comes with a migration guide",
    problem: 'something you rely on has already moved on',
    advice: 'replace the unsupported part, not the whole system',
  },
  {
    id: 'friday-deploy',
    name: 'The Friday Deploy',
    shortDescription: 'A weekend with release notes.',
    context: 'the deadline is louder than the test results',
    problem: 'the plan only works if nobody needs their weekend',
    advice: 'ship it when someone is around to watch it land',
  },
  {
    id: 'green-ci',
    name: 'The Green CI',
    shortDescription: 'All checks passed. Reality is next.',
    context: 'every check passed, and the checks only test what you told them to',
    problem: 'a green pipeline is doing all the reassuring',
    advice: 'click through the real user path before you call it done',
  },
  {
    id: 'missing-environment-variable',
    name: 'The Missing Environment Variable',
    shortDescription: 'Works on one machine.',
    context: 'one unwritten setting is holding the whole project together',
    problem: 'the setup notes skip the one step that makes it work',
    advice: 'write down the missing setting before you try again',
  },
  {
    id: 'legacy-system',
    name: 'The Legacy System',
    shortDescription: 'Yesterday still pays the bills.',
    context: 'old decisions are still doing useful work',
    problem: 'nobody remembers which odd detail is load-bearing',
    advice: 'learn one boundary well before you replace what sits behind it',
  },
  {
    id: 'todo',
    name: 'The TODO',
    shortDescription: 'A promise with no calendar.',
    context: 'a past version of you left a very optimistic note',
    problem: 'the deferred work moves to the next sprint, every sprint',
    advice: 'finish one small promise or delete it honestly',
  },
  {
    id: 'rewrite',
    name: 'The Rewrite',
    shortDescription: 'A fresh start with familiar problems.',
    context: 'the current mess makes a blank file look tempting',
    problem: 'starting over feels like knowing more, and it is not',
    advice: 'prove the new approach on one small slice first',
  },
  {
    id: 'mvp',
    name: 'The MVP',
    shortDescription: 'Small enough to actually exist.',
    context: 'a small thing that works has met real users',
    problem: 'the wishlist is growing faster than the part people use',
    advice: 'cut one requirement and finish the remaining loop',
  },
  {
    id: 'rubber-duck',
    name: 'The Rubber Duck',
    shortDescription: 'Your quietest senior engineer.',
    context: 'the answer is already in your explanation',
    problem: 'the problem stays vague because nobody has said it out loud',
    advice: 'explain the failing step as if the duck will maintain it',
  },
  {
    id: 'unexpected-dependency',
    name: 'The Unexpected Dependency',
    shortDescription: 'One install, several new obligations.',
    context: 'a handy package came with decisions of its own',
    problem: 'the borrowed fix now needs more care than the original problem',
    advice: 'check whether the platform already does enough',
  },
  {
    id: 'production-database',
    name: 'The Production Database',
    shortDescription: 'The one place theory has consequences.',
    context: 'real users have made the data messier than the examples',
    problem: 'the experiment is one query away from data you cannot get back',
    advice: 'rehearse on a copy before you touch the real thing',
  },
  {
    id: 'cache',
    name: 'The Cache',
    shortDescription: "Yesterday's truth, delivered faster.",
    context: 'an old answer is still being served with confidence',
    problem: 'stale data arrives faster than anyone can question it',
    advice: 'check the source before you speed up the answer',
  },
  {
    id: 'code-review',
    name: 'The Code Review',
    shortDescription: 'Your idea has entered the group chat.',
    context: 'a second pair of eyes has found the edges of the idea',
    problem: 'the thread is debating style instead of the real risks',
    advice: 'agree on what the code should do before arguing about how it looks',
  },
  {
    id: 'rollback',
    name: 'The Rollback',
    shortDescription: 'Progress occasionally points backward.',
    context: 'the last working version is still within reach',
    problem: 'pride is making a rollback feel like defeat',
    advice: 'restore the last good state, then investigate without pressure',
  },
]

const PROMPTS = [
  'Should I rewrite it?',
  'Should I deploy today?',
  'Do I really need another dependency?',
  'Should this become a microservice?',
  'Will this side project survive the weekend?',
]

const TEMPLATES = [
  'The setup: {context}. The snag: {problem}. Your next move: {advice}.',
  'The cards show that {context}. Right now, {problem}. Their advice: {advice}.',
]

function toMeaning(fragment: string) {
  return {
    summaryFragment: fragment,
    text: `${fragment.charAt(0).toUpperCase()}${fragment.slice(1)}.`,
  }
}

const CARDS = CARD_SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  shortDescription: seed.shortDescription,
  meanings: {
    context: toMeaning(seed.context),
    problem: toMeaning(seed.problem),
    advice: toMeaning(seed.advice),
  },
}))

export const developerDeck: Deck = {
  id: 'developer',
  name: 'Developer Tarot',
  positions: POSITIONS,
  cards: CARDS,
  prompts: PROMPTS,
  templates: TEMPLATES,
}
