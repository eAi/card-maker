import { get, set, del } from 'idb-keyval'
import { type TextStyle } from '@/components/TextEditor'
import { type CardSize } from '@/lib/cardSizes'
import { type PageBackground } from '@/lib/background'
import { type FrontTextContent } from '@/lib/frontText'

const CARD_PREFIX = 'card:'
const CARD_INDEX_KEY = 'card-index'
const CURRENT_CARD_KEY = 'current-card-id'

export interface CardState {
  text: string
  textStyle: TextStyle
  cardSize: string
  customSize: CardSize | null
  imageScale: number
  twoPerPage: boolean
  image: string | null
  pageBackground?: PageBackground
  frontMode?: 'image' | 'text'
  frontText?: FrontTextContent
}

export interface CardMetadata {
  id: string
  name: string
  updatedAt: number
}

export interface SavedCard extends CardState {
  id: string
  name: string
  updatedAt: number
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Get list of all saved cards (metadata only)
export async function listCards(): Promise<CardMetadata[]> {
  try {
    const index = await get<CardMetadata[]>(CARD_INDEX_KEY)
    return index ?? []
  } catch (error) {
    console.error('Failed to list cards:', error)
    return []
  }
}

// Save or update a card
export async function saveCard(card: SavedCard): Promise<void> {
  try {
    // Save the card data
    await set(`${CARD_PREFIX}${card.id}`, card)

    // Update the index
    const index = await listCards()
    const existingIdx = index.findIndex(c => c.id === card.id)
    const metadata: CardMetadata = {
      id: card.id,
      name: card.name,
      updatedAt: card.updatedAt,
    }

    if (existingIdx >= 0) {
      index[existingIdx] = metadata
    } else {
      index.push(metadata)
    }

    // Sort by most recently updated
    index.sort((a, b) => b.updatedAt - a.updatedAt)
    await set(CARD_INDEX_KEY, index)
  } catch (error) {
    console.error('Failed to save card:', error)
  }
}

// Load a specific card by ID
export async function loadCard(id: string): Promise<SavedCard | null> {
  try {
    const card = await get<SavedCard>(`${CARD_PREFIX}${id}`)
    return card ?? null
  } catch (error) {
    console.error('Failed to load card:', error)
    return null
  }
}

// Delete a card
export async function deleteCard(id: string): Promise<void> {
  try {
    await del(`${CARD_PREFIX}${id}`)

    // Update the index
    const index = await listCards()
    const filtered = index.filter(c => c.id !== id)
    await set(CARD_INDEX_KEY, filtered)
  } catch (error) {
    console.error('Failed to delete card:', error)
  }
}

// Create a new card with default state
export function createNewCard(name: string, state: CardState): SavedCard {
  return {
    ...state,
    id: generateId(),
    name,
    updatedAt: Date.now(),
  }
}

// Remember which card was last open
export async function setCurrentCardId(id: string | null): Promise<void> {
  try {
    if (id) {
      await set(CURRENT_CARD_KEY, id)
    } else {
      await del(CURRENT_CARD_KEY)
    }
  } catch (error) {
    console.error('Failed to set current card ID:', error)
  }
}

export async function getCurrentCardId(): Promise<string | null> {
  try {
    const id = await get<string>(CURRENT_CARD_KEY)
    return id ?? null
  } catch (error) {
    console.error('Failed to get current card ID:', error)
    return null
  }
}
