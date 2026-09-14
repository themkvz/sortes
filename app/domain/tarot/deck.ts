import { array, object, parse, record, string } from 'remix/data-schema'
import { minLength } from 'remix/data-schema/checks'

import { normalizeQuestion } from './reading.ts'

const CARD_COUNT = 16
const POSITION_COUNT = 3
const TEMPLATE_TOKEN = /\{([^{}]*)\}/g

export interface Position {
  readonly id: string
  readonly label: string
}

export interface CardMeaning {
  readonly text: string
  readonly summaryFragment: string
}

export interface Card {
  readonly id: string
  readonly name: string
  readonly shortDescription: string
  readonly meanings: Readonly<Record<string, CardMeaning>>
}

export interface Deck {
  readonly id: string
  readonly name: string
  readonly spreadId: string
  readonly positions: ReadonlyArray<Position>
  readonly cards: ReadonlyArray<Card>
  readonly prompts: ReadonlyArray<string>
  readonly templates: ReadonlyArray<string>
}

export type DeckDefinition = Deck

const MeaningShape = object({
  text: string().pipe(minLength(1)),
  summaryFragment: string().pipe(minLength(1)),
})

const PositionShape = object({
  id: string().pipe(minLength(1)),
  label: string().pipe(minLength(1)),
})

const CardShape = object({
  id: string().pipe(minLength(1)),
  name: string().pipe(minLength(1)),
  shortDescription: string().pipe(minLength(1)),
  meanings: record(string(), MeaningShape),
})

const DeckShape = object({
  id: string().pipe(minLength(1)),
  name: string().pipe(minLength(1)),
  spreadId: string().pipe(minLength(1)),
  positions: array(PositionShape),
  cards: array(CardShape),
  prompts: array(string()),
  templates: array(string().pipe(minLength(1))),
})

function assertUniqueIds(kind: string, deckId: string, ids: readonly string[], expected: number) {
  if (ids.length !== expected) {
    throw new Error(`Deck "${deckId}" must have exactly ${expected} ${kind}, got ${ids.length}`)
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Deck "${deckId}" has duplicate ${kind}`)
  }
}

function validateTemplate(deckId: string, template: string, positionIds: readonly string[]) {
  const found = new Set<string>()
  const withoutTokens = template.replace(TEMPLATE_TOKEN, (_match, token: string) => {
    if (!token || !positionIds.includes(token)) {
      throw new Error(
        `Deck "${deckId}" template references an unknown placeholder "{${token}}": ${template}`,
      )
    }
    found.add(token)
    return ''
  })
  if (withoutTokens.includes('{') || withoutTokens.includes('}')) {
    throw new Error(`Deck "${deckId}" template has a malformed placeholder: ${template}`)
  }
  for (const positionId of positionIds) {
    if (!found.has(positionId)) {
      throw new Error(
        `Deck "${deckId}" template is missing the "{${positionId}}" placeholder: ${template}`,
      )
    }
  }
}

export function defineDeck(input: DeckDefinition): Deck {
  const shape = parse(DeckShape, input)

  const positionIds = shape.positions.map((position) => position.id)
  assertUniqueIds('positions', shape.id, positionIds, POSITION_COUNT)

  const cardIds = shape.cards.map((card) => card.id)
  assertUniqueIds('cards', shape.id, cardIds, CARD_COUNT)

  for (const card of shape.cards) {
    for (const positionId of positionIds) {
      if (!(positionId in card.meanings)) {
        throw new Error(
          `Deck "${shape.id}" card "${card.id}" is missing a meaning for position "${positionId}"`,
        )
      }
    }
  }

  if (shape.prompts.length < 1) {
    throw new Error(`Deck "${shape.id}" must have at least one prompt`)
  }
  for (const prompt of shape.prompts) {
    if (!normalizeQuestion(prompt).success) {
      throw new Error(`Deck "${shape.id}" has an invalid prompt: ${JSON.stringify(prompt)}`)
    }
  }

  if (shape.templates.length < 1) {
    throw new Error(`Deck "${shape.id}" must have at least one template`)
  }
  for (const template of shape.templates) {
    validateTemplate(shape.id, template, positionIds)
  }

  return shape
}
