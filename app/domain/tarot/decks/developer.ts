import { defineDeck } from '../deck.ts'

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
    context: 'two reasonable decisions have arrived in the same place',
    problem: 'everyone is defending a different version of the plan',
    advice: 'resolve one disagreement before adding another idea',
  },
  {
    id: 'infinite-refactor',
    name: 'The Infinite Refactor',
    shortDescription: 'Almost clean enough to start.',
    context: 'a small cleanup has become the main project',
    problem: 'the architecture keeps improving while the finish line moves',
    advice: 'ship one useful change before renaming another folder',
  },
  {
    id: 'deprecated-api',
    name: 'The Deprecated API',
    shortDescription: 'The future has stopped supporting you.',
    context: "yesterday's shortcut now comes with a migration guide",
    problem: 'the thing you rely on has already moved on',
    advice: 'replace the unsupported part before rebuilding everything',
  },
  {
    id: 'friday-deploy',
    name: 'The Friday Deploy',
    shortDescription: 'A weekend with release notes.',
    context: 'the deadline has mistaken urgency for readiness',
    problem: 'the plan assumes nobody will need their weekend',
    advice: 'make the change when someone can watch it land',
  },
  {
    id: 'green-ci',
    name: 'The Green CI',
    shortDescription: 'All checks passed. Reality is next.',
    context: 'the checks agree that the code meets their expectations',
    problem: 'a passing pipeline is doing too much of the reassuring',
    advice: 'try the actual user journey before declaring victory',
  },
  {
    id: 'missing-environment-variable',
    name: 'The Missing Environment Variable',
    shortDescription: 'Works on one machine.',
    context: 'an invisible assumption is holding the setup together',
    problem: 'the instructions leave out the part that makes it work',
    advice: 'write down the missing requirement before trying again',
  },
  {
    id: 'legacy-system',
    name: 'The Legacy System',
    shortDescription: 'Yesterday still pays the bills.',
    context: 'old decisions are still doing useful work',
    problem: 'nobody remembers which awkward detail is load-bearing',
    advice: 'understand one boundary before replacing what is behind it',
  },
  {
    id: 'todo',
    name: 'The TODO',
    shortDescription: 'A promise with no calendar.',
    context: 'an earlier version of you left a very optimistic note',
    problem: 'deferred work keeps volunteering for the next sprint',
    advice: 'finish one small promise or remove it honestly',
  },
  {
    id: 'rewrite',
    name: 'The Rewrite',
    shortDescription: 'A fresh start with familiar problems.',
    context: 'the current mess has made a blank file look persuasive',
    problem: 'starting over is being confused with knowing more',
    advice: 'prove the new approach on one small slice first',
  },
  {
    id: 'mvp',
    name: 'The MVP',
    shortDescription: 'Small enough to actually exist.',
    context: 'a small working thing has survived contact with reality',
    problem: 'the wishlist is growing faster than the useful part',
    advice: 'cut one requirement and finish the remaining loop',
  },
  {
    id: 'rubber-duck',
    name: 'The Rubber Duck',
    shortDescription: 'Your quietest senior engineer.',
    context: 'the explanation already contains most of the answer',
    problem: 'the problem has stayed vague because nobody has heard it aloud',
    advice: 'explain the failing step as if the duck will maintain it',
  },
  {
    id: 'unexpected-dependency',
    name: 'The Unexpected Dependency',
    shortDescription: 'One install, several new obligations.',
    context: 'a convenient package brought its own set of decisions',
    problem: 'the borrowed solution needs more care than the original problem',
    advice: 'check whether the platform already does enough',
  },
  {
    id: 'production-database',
    name: 'The Production Database',
    shortDescription: 'The one place theory has consequences.',
    context: 'real users have made the data less tidy than the examples',
    problem: 'the experiment has wandered too close to irreplaceable state',
    advice: 'rehearse on a copy before touching the real thing',
  },
  {
    id: 'cache',
    name: 'The Cache',
    shortDescription: "Yesterday's truth, delivered faster.",
    context: 'an earlier answer is still being served with confidence',
    problem: 'stale information is arriving faster than anyone can question it',
    advice: 'verify the source before optimizing the answer',
  },
  {
    id: 'code-review',
    name: 'The Code Review',
    shortDescription: 'Your idea has entered the group chat.',
    context: 'another perspective has found the edges of the idea',
    problem: 'the discussion is polishing preferences instead of resolving risks',
    advice: 'agree on the behavior before debating the shape of the code',
  },
  {
    id: 'rollback',
    name: 'The Rollback',
    shortDescription: 'Progress occasionally points backward.',
    context: 'a previous working version is still within reach',
    problem: 'pride is making recovery sound like defeat',
    advice: 'restore the known good state and investigate with breathing room',
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
  'The cards remember that {context}. Right now, {problem}. Their advice: {advice}.',
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

export const developerDeck = defineDeck({
  id: 'developer',
  name: 'Developer Tarot',
  spreadId: 'context-problem-advice',
  positions: POSITIONS,
  cards: CARDS,
  prompts: PROMPTS,
  templates: TEMPLATES,
})
