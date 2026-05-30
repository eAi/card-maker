export interface Font {
  family: string
  category: FontCategory
}

export type FontCategory = 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'

export const FONT_CATEGORIES: { id: FontCategory; label: string }[] = [
  { id: 'serif', label: 'Serif' },
  { id: 'sans-serif', label: 'Sans Serif' },
  { id: 'display', label: 'Display' },
  { id: 'handwriting', label: 'Handwriting' },
  { id: 'monospace', label: 'Monospace' },
]

export const FONTS: Font[] = [
  // Serif fonts
  { family: 'Playfair Display', category: 'serif' },
  { family: 'Merriweather', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'PT Serif', category: 'serif' },
  { family: 'Crimson Text', category: 'serif' },
  { family: 'Libre Baskerville', category: 'serif' },
  { family: 'Source Serif Pro', category: 'serif' },
  { family: 'Cormorant Garamond', category: 'serif' },
  { family: 'EB Garamond', category: 'serif' },
  { family: 'Noto Serif', category: 'serif' },

  // Sans-serif fonts
  { family: 'Inter', category: 'sans-serif' },
  { family: 'Open Sans', category: 'sans-serif' },
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Lato', category: 'sans-serif' },
  { family: 'Montserrat', category: 'sans-serif' },
  { family: 'Poppins', category: 'sans-serif' },
  { family: 'Raleway', category: 'sans-serif' },
  { family: 'Nunito', category: 'sans-serif' },
  { family: 'Work Sans', category: 'sans-serif' },
  { family: 'Quicksand', category: 'sans-serif' },
  { family: 'Outfit', category: 'sans-serif' },
  { family: 'DM Sans', category: 'sans-serif' },

  // Display fonts
  { family: 'Abril Fatface', category: 'display' },
  { family: 'Bebas Neue', category: 'display' },
  { family: 'Oswald', category: 'display' },
  { family: 'Anton', category: 'display' },
  { family: 'Righteous', category: 'display' },
  { family: 'Alfa Slab One', category: 'display' },
  { family: 'Lobster', category: 'display' },
  { family: 'Fredoka One', category: 'display' },
  { family: 'Passion One', category: 'display' },
  { family: 'Bangers', category: 'display' },

  // Handwriting fonts
  { family: 'Dancing Script', category: 'handwriting' },
  { family: 'Pacifico', category: 'handwriting' },
  { family: 'Great Vibes', category: 'handwriting' },
  { family: 'Satisfy', category: 'handwriting' },
  { family: 'Caveat', category: 'handwriting' },
  { family: 'Kalam', category: 'handwriting' },
  { family: 'Indie Flower', category: 'handwriting' },
  { family: 'Sacramento', category: 'handwriting' },
  { family: 'Allura', category: 'handwriting' },
  { family: 'Tangerine', category: 'handwriting' },
  { family: 'Alex Brush', category: 'handwriting' },
  { family: 'Amatic SC', category: 'handwriting' },

  // Monospace fonts
  { family: 'Roboto Mono', category: 'monospace' },
  { family: 'Source Code Pro', category: 'monospace' },
  { family: 'JetBrains Mono', category: 'monospace' },
  { family: 'Fira Code', category: 'monospace' },
  { family: 'IBM Plex Mono', category: 'monospace' },
  { family: 'Space Mono', category: 'monospace' },
]

// Default fonts to preload for instant preview
export const PRELOADED_FONTS = [
  'Playfair Display',
  'Inter',
  'Dancing Script',
  'Roboto Mono',
]

// Track which fonts have been loaded
const loadedFonts = new Set<string>(PRELOADED_FONTS)

// Track which preview subsets have been loaded
const previewLoadedFonts = new Set<string>(PRELOADED_FONTS)

/**
 * Loads a tiny subset of a Google Font containing only the characters in its
 * name — enough to render a font preview label without fetching the full font.
 */
export function loadFontPreview(fontFamily: string): void {
  if (previewLoadedFonts.has(fontFamily)) return
  previewLoadedFonts.add(fontFamily)
  const chars = [...new Set(fontFamily)].join('')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}&text=${encodeURIComponent(chars)}&display=swap`
  document.head.appendChild(link)
}

/** Lazily loads preview subsets for all fonts, staggered to avoid flooding. */
export function loadAllFontPreviews(): void {
  FONTS.forEach((font, i) => setTimeout(() => loadFontPreview(font.family), i * 25))
}

/**
 * Dynamically loads a Google Font by adding a link element to the document head.
 * Returns a promise that resolves when the font is loaded.
 */
export function loadFont(fontFamily: string): Promise<void> {
  if (loadedFonts.has(fontFamily)) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`
    link.rel = 'stylesheet'

    link.onload = () => {
      loadedFonts.add(fontFamily)
      resolve()
    }

    link.onerror = () => {
      // Still resolve - font might partially work or fall back gracefully
      loadedFonts.add(fontFamily)
      resolve()
    }

    document.head.appendChild(link)
  })
}

/**
 * Returns the CSS font-family value for a given font family name.
 */
export function getFontFamilyValue(fontFamily: string): string {
  const font = FONTS.find(f => f.family === fontFamily)
  if (!font) return `'${fontFamily}', sans-serif`

  const fallback = {
    'serif': 'serif',
    'sans-serif': 'sans-serif',
    'display': 'sans-serif',
    'handwriting': 'cursive',
    'monospace': 'monospace',
  }[font.category]

  return `'${fontFamily}', ${fallback}`
}

/**
 * Get fonts grouped by category.
 */
export function getFontsByCategory(): Record<FontCategory, Font[]> {
  return FONTS.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = []
    }
    acc[font.category].push(font)
    return acc
  }, {} as Record<FontCategory, Font[]>)
}
