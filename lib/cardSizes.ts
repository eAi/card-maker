export interface CardSize {
  id: string
  name: string
  width: number  // in mm (single panel width)
  height: number // in mm
  needsCropMarks: boolean
}

// A4 paper dimensions in mm (landscape orientation)
export const A4_LANDSCAPE = {
  width: 297,
  height: 210,
}

// Card sizes - width is for single panel (folded card width)
// When printed flat, the total width is 2x the card width
export const CARD_SIZES: CardSize[] = [
  {
    id: 'a5',
    name: 'A5',
    width: 148,
    height: 210,
    needsCropMarks: false, // A5 folded = A4, fills page exactly
  },
  {
    id: 'a6',
    name: 'A6',
    width: 105,
    height: 148,
    needsCropMarks: true,
  },
  {
    id: 'square-120',
    name: 'Square (120mm)',
    width: 120,
    height: 120,
    needsCropMarks: true,
  },
  {
    id: 'square-140',
    name: 'Square (140mm)',
    width: 140,
    height: 140,
    needsCropMarks: true,
  },
]

export function getCardSize(id: string): CardSize | undefined {
  return CARD_SIZES.find(size => size.id === id)
}

// Get the flat (unfolded) dimensions for printing
export function getFlatDimensions(size: CardSize) {
  return {
    width: size.width * 2, // Two panels side by side
    height: size.height,
  }
}

// Calculate margins to center the card on A4 landscape
export function getCenterMargins(size: CardSize) {
  const flat = getFlatDimensions(size)
  return {
    left: (A4_LANDSCAPE.width - flat.width) / 2,
    top: (A4_LANDSCAPE.height - flat.height) / 2,
  }
}

// Custom size constraints
export const CUSTOM_SIZE_CONSTRAINTS = {
  minWidth: 50,   // mm
  maxWidth: 148,  // mm (half of A4 landscape width, so flat fits on page)
  minHeight: 50,  // mm
  maxHeight: 210, // mm (A4 height)
}

// Validate custom size dimensions
export function validateCustomSize(width: number, height: number): { valid: boolean; error?: string } {
  const { minWidth, maxWidth, minHeight, maxHeight } = CUSTOM_SIZE_CONSTRAINTS

  if (width < minWidth || width > maxWidth) {
    return { valid: false, error: `Width must be between ${minWidth}mm and ${maxWidth}mm` }
  }

  if (height < minHeight || height > maxHeight) {
    return { valid: false, error: `Height must be between ${minHeight}mm and ${maxHeight}mm` }
  }

  return { valid: true }
}

// Create a custom CardSize object
export function createCustomSize(width: number, height: number): CardSize {
  return {
    id: 'custom',
    name: 'Custom',
    width,
    height,
    needsCropMarks: true, // Custom sizes always need crop marks
  }
}

// Check if two cards can fit on one A4 page (with rotation if needed)
// Returns layout info if possible, null if not
export function getTwoPerPageLayout(size: CardSize): {
  rotated: boolean
  cardWidth: number  // Width of each card area on page (in mm)
  cardHeight: number // Height of each card area on page (in mm)
  gap: number        // Gap between cards (in mm)
} | null {
  const flat = getFlatDimensions(size)

  // Try rotated layout first (most common case for tall cards like A6)
  // Rotated: flat card becomes height × width, placed side by side
  const rotatedWidth = flat.height
  const rotatedHeight = flat.width

  if (rotatedWidth * 2 <= A4_LANDSCAPE.width && rotatedHeight <= A4_LANDSCAPE.height) {
    const gap = (A4_LANDSCAPE.width - rotatedWidth * 2) / 3 // Even spacing
    return {
      rotated: true,
      cardWidth: rotatedWidth,
      cardHeight: rotatedHeight,
      gap,
    }
  }

  // Try non-rotated layout (for wide cards)
  if (flat.width * 2 <= A4_LANDSCAPE.width && flat.height <= A4_LANDSCAPE.height) {
    const gap = (A4_LANDSCAPE.width - flat.width * 2) / 3
    return {
      rotated: false,
      cardWidth: flat.width,
      cardHeight: flat.height,
      gap,
    }
  }

  return null
}

// Simple check if two-per-page is possible
export function canFitTwoPerPage(size: CardSize): boolean {
  return getTwoPerPageLayout(size) !== null
}
