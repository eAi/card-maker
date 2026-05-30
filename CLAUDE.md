# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js web application for creating and printing folded greeting cards with custom images and text. Cards are designed to be printed on A4 paper and folded in half (image on front, text on back).

## Commands

```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production (static export)
npm run lint         # Run Next.js linting
```

No test framework is configured.

## Architecture

### State Management

All state is managed in `CardMaker.tsx` and passed down as props. Key state includes:
- `image`: Base64 encoded image data
- `imageScale`: Zoom level (50-150%)
- `text`: Card text content
- `textStyle`: Font family, size, bold, italic
- `cardSize`: Selected preset or "custom"
- `customSize`: Width/height in mm for custom sizes

### Component Structure

```
CardMaker (main controller + all state)
├── SizeSelector      # Card size selection (presets + custom)
├── ImageDropzone     # Drag-drop image upload + scale slider
├── TextEditor        # Text input + font controls
├── CardPreview       # Live preview (screen display)
└── CardPrintView     # Off-screen render for PDF generation
```

### Card Layout System

- All dimensions use **millimeters** for precision
- Card sizes defined in `lib/cardSizes.ts` as single-panel (folded) dimensions
- Flat card = 2x width × height (e.g., A5 folded 148×210mm = flat 296×210mm)
- Cards are centered on A4 landscape (297×210mm) with auto-calculated margins
- Left half = text (back of card), Right half = image (front of card)

### PDF Generation

Uses `html2canvas` + `jsPDF`:
1. Off-screen `CardPrintView` is rendered to canvas at 3x scale
2. Canvas converted to PDF in A4 landscape
3. File auto-downloads

### Font System

50+ fonts in `lib/fonts.ts` organized by category. Default fonts are preloaded; others load dynamically from Google Fonts API when selected.

### Print vs Screen

- `.no-print` class hides UI controls during print/PDF
- `.print-only` class shows only during browser print
- Print styles in `app/globals.css` force exact A4 dimensions

## Common Modifications

- **Add card size**: Edit `CARD_SIZES` array in `lib/cardSizes.ts`
- **Add font**: Edit `FONTS` array in `lib/fonts.ts`
- **Modify card layout**: Edit `CardPreview.tsx` (handles both preview and print modes)
- **Fix print issues**: Check `@media print` rules in `app/globals.css`

## Key Libraries

- **shadcn/ui** + **@radix-ui**: UI components (Button, Select, Slider, Toggle)
- **react-dropzone**: File upload handling
- **html2canvas** + **jspdf**: PDF generation
- **lucide-react**: Icons
