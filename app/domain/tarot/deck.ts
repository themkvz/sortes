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
  readonly positions: ReadonlyArray<Position>
  readonly cards: ReadonlyArray<Card>
  readonly prompts: ReadonlyArray<string>
  readonly templates: ReadonlyArray<string>
}
