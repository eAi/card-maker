'use client'

import React, { useRef, useState, useEffect } from 'react'
import { getCardSize, getFlatDimensions, getCenterMargins, getTwoPerPageLayout, A4_LANDSCAPE, type CardSize } from '@/lib/cardSizes'
import type { TextStyle } from '@/components/TextEditor'
import {
  type PageBackground,
  DEFAULT_PAGE_BACKGROUND,
  fillToCSS,
} from '@/lib/background'
import {
  type FrontTextContent,
  DEFAULT_FRONT_TEXT,
  computeTextBlockStyle,
} from '@/lib/frontText'

interface CardPreviewProps {
  cardSizeId: string
  image: string | null
  imageScale: number
  text: string
  textStyle: TextStyle
  customSize?: CardSize | null
  twoPerPage?: boolean
  pageBackground?: PageBackground
  frontMode?: 'image' | 'text'
  frontText?: FrontTextContent
}

// A4 landscape in pixels at 96 DPI (for calculating scale)
const A4_WIDTH_PX = (297 / 25.4) * 96 // ~1122px
const A4_HEIGHT_PX = (210 / 25.4) * 96 // ~793px

// ─── Background layer helper ──────────────────────────────────────────────────
// Renders the filled background rect(s) for a single card (combined or separate).
// All positions in mm, relative to the A4 page container.

interface CardBgProps {
  bg: PageBackground
  bleedMm: number
  cardLeft: number   // mm from A4 left
  cardTop: number    // mm from A4 top
  cardWidth: number  // full card width (front + back)
  cardHeight: number
  foldPosition: number // mm from card edge to fold
  rotated: boolean     // if true, fold is horizontal (top half = front)
}

function CardBackground({ bg, bleedMm, cardLeft, cardTop, cardWidth, cardHeight, foldPosition, rotated }: CardBgProps) {
  if (bg.mode === 'combined') {
    return (
      <div
        className="absolute"
        style={{
          left: `${cardLeft - bleedMm}mm`,
          top: `${cardTop - bleedMm}mm`,
          width: `${cardWidth + 2 * bleedMm}mm`,
          height: `${cardHeight + 2 * bleedMm}mm`,
          background: fillToCSS(bg.combined),
        }}
      />
    )
  }

  // Separate mode — determine which panel is front/back based on orientation
  if (rotated) {
    // Top half = front (image), bottom half = back (text)
    return (
      <>
        <div
          className="absolute"
          style={{
            left: `${cardLeft - bleedMm}mm`,
            top: `${cardTop - bleedMm}mm`,
            width: `${cardWidth + 2 * bleedMm}mm`,
            height: `${foldPosition + 2 * bleedMm}mm`,
            background: fillToCSS(bg.front),
          }}
        />
        <div
          className="absolute"
          style={{
            left: `${cardLeft - bleedMm}mm`,
            top: `${cardTop + foldPosition - bleedMm}mm`,
            width: `${cardWidth + 2 * bleedMm}mm`,
            height: `${foldPosition + 2 * bleedMm}mm`,
            background: fillToCSS(bg.back),
          }}
        />
      </>
    )
  }

  // Non-rotated: left half = back (text), right half = front (image)
  return (
    <>
      <div
        className="absolute"
        style={{
          left: `${cardLeft - bleedMm}mm`,
          top: `${cardTop - bleedMm}mm`,
          width: `${foldPosition + 2 * bleedMm}mm`,
          height: `${cardHeight + 2 * bleedMm}mm`,
          background: fillToCSS(bg.back),
        }}
      />
      <div
        className="absolute"
        style={{
          left: `${cardLeft + foldPosition - bleedMm}mm`,
          top: `${cardTop - bleedMm}mm`,
          width: `${foldPosition + 2 * bleedMm}mm`,
          height: `${cardHeight + 2 * bleedMm}mm`,
          background: fillToCSS(bg.front),
        }}
      />
    </>
  )
}

// ─── SVG filter helpers ───────────────────────────────────────────────────────
// All filter defs are collected into ONE hidden SVG that sits as a sibling of
// the text column — never inside it — so html2canvas layout is unaffected.

const PT_TO_PX = 4 / 3  // 1 pt ≈ 1.333 px at 96 dpi

function buildFilterDefs(
  blocks: FrontTextContent['blocks'],
  filterSuffix: string,
): React.ReactElement | null {
  const needFilter = blocks.filter(b => (b.strokeEnabled && b.strokeWidth > 0) || b.shadowEnabled)
  if (needFilter.length === 0) return null

  return (
    <svg
      width="0" height="0"
      style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        {needFilter.map(block => {
          const hasStroke = block.strokeEnabled && block.strokeWidth > 0
          const hasShadow = block.shadowEnabled
          return (
            <filter
              key={block.id}
              id={`fx-${block.id}${filterSuffix}`}
              x="-100%" y="-100%" width="300%" height="300%"
              colorInterpolationFilters="sRGB"
            >
              {hasShadow && (
                <>
                  <feGaussianBlur stdDeviation={block.shadowBlur * PT_TO_PX} in="SourceAlpha" result="shadowBlurred" />
                  <feOffset dx={block.shadowX * PT_TO_PX} dy={block.shadowY * PT_TO_PX} in="shadowBlurred" result="shadowOffset" />
                  <feFlood floodColor={block.shadowColor} floodOpacity={block.shadowOpacity / 100} result="shadowFill" />
                  <feComposite in="shadowFill" in2="shadowOffset" operator="in" result="shadowLayer" />
                </>
              )}
              {hasStroke && (
                <>
                  <feMorphology operator="dilate" radius={block.strokeWidth * PT_TO_PX} in="SourceAlpha" result="strokeShape" />
                  <feFlood floodColor={block.strokeColor} result="strokeFill" />
                  <feComposite in="strokeFill" in2="strokeShape" operator="in" result="strokeLayer" />
                </>
              )}
              <feMerge>
                {hasShadow && <feMergeNode in="shadowLayer" />}
                {hasStroke && <feMergeNode in="strokeLayer" />}
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )
        })}
      </defs>
    </svg>
  )
}

function renderBlock(block: FrontTextContent['blocks'][number], filterSuffix: string) {
  const needsFilter = (block.strokeEnabled && block.strokeWidth > 0) || block.shadowEnabled
  return (
    <span
      key={block.id}
      style={{
        ...computeTextBlockStyle(block),
        marginBottom: '0.15em',
        ...(needsFilter && { filter: `url(#fx-${block.id}${filterSuffix})` }),
      }}
    >
      {block.text}
    </span>
  )
}

// ─── Screen preview ───────────────────────────────────────────────────────────

// Renders the content of the front panel (image or text blocks)
function FrontContent({
  frontMode = 'image',
  frontText = DEFAULT_FRONT_TEXT,
  image,
  imageScale,
  rotated = false,
  panelWidthMm,
  panelHeightMm,
  filterSuffix = '',
}: {
  frontMode?: 'image' | 'text'
  frontText?: FrontTextContent
  image: string | null
  imageScale: number
  rotated?: boolean
  panelWidthMm: number
  panelHeightMm: number
  filterSuffix?: string
}) {
  const visibleBlocks = frontText.blocks.filter(b => b.text.trim())

  if (frontMode === 'text') {
    // SVG defs live OUTSIDE the flex column so they can never affect its layout
    const filterDefs = buildFilterDefs(visibleBlocks, filterSuffix)
    const blockSpans = visibleBlocks.length > 0
      ? visibleBlocks.map(b => renderBlock(b, filterSuffix))
      : <span style={{ color: '#d1d5db', fontSize: '14pt' }}>Your text here</span>

    if (rotated) {
      // Rotated two-per-page: wrap in -90deg inner box, centered vertically
      return (
        <>
          {filterDefs}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                transform: 'rotate(-90deg)',
                width: `${panelHeightMm}mm`,
                height: `${panelWidthMm}mm`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4mm',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {blockSpans}
            </div>
          </div>
        </>
      )
    }

    return (
      <>
        {filterDefs}
        <div
          style={{
            position: 'absolute',
            top: `${frontText.verticalOffset}%`,
            left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '0 4mm',
          }}
        >
          {blockSpans}
        </div>
      </>
    )
  }

  // Image mode
  if (image) {
    return (
      <img
        src={image}
        alt="Card front"
        className="max-h-[80%] max-w-[80%] object-contain"
        style={{
          transform: rotated
            ? `rotate(-90deg) scale(${imageScale / 100})`
            : `scale(${imageScale / 100})`,
        }}
      />
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center text-slate-300"
      style={rotated ? { transform: 'rotate(-90deg)' } : undefined}
    >
      <div className="text-4xl">+</div>
      <div className="mt-2 text-sm">Front Image</div>
    </div>
  )
}

export default function CardPreview({
  cardSizeId,
  image,
  imageScale,
  text,
  textStyle,
  customSize,
  twoPerPage = false,
  pageBackground = DEFAULT_PAGE_BACKGROUND,
  frontMode = 'image',
  frontText = DEFAULT_FRONT_TEXT,
}: CardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(0.85)

  const cardSize = cardSizeId === 'custom' ? customSize : getCardSize(cardSizeId)
  const twoPerPageLayout = twoPerPage && cardSize ? getTwoPerPageLayout(cardSize) : null

  const bleedMm = pageBackground.bleed * 10

  // Calculate scale to fit preview in available space
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth
        const isMobile = window.innerWidth < 1024
        const maxScale = isMobile ? 1 : 0.7
        const scale = Math.min(availableWidth / A4_WIDTH_PX, maxScale)
        setPreviewScale(scale)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    const observer = new ResizeObserver(updateScale)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => {
      window.removeEventListener('resize', updateScale)
      observer.disconnect()
    }
  }, [])

  if (!cardSize) {
    return <div>Invalid card size</div>
  }

  const flatDimensions = getFlatDimensions(cardSize)
  const margins = getCenterMargins(cardSize)
  const cropMarkLength = 8 // mm
  const cropMarkOffset = 3 // mm from card edge

  // Two-per-page preview
  if (twoPerPageLayout) {
    const { rotated, cardWidth, cardHeight, gap } = twoPerPageLayout
    const topMargin = (A4_LANDSCAPE.height - cardHeight) / 2
    const foldPosition = cardSize.width

    return (
      <div className="space-y-1 lg:space-y-4" ref={containerRef}>
        <div className="hidden lg:flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
          <p className="text-sm text-slate-500">
            {cardSize.name} × 2 ({rotated ? 'rotated' : 'side by side'})
          </p>
        </div>

        <div
          className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm lg:mx-auto"
          style={{
            width: `${A4_WIDTH_PX * previewScale}px`,
            height: `${A4_HEIGHT_PX * previewScale}px`,
          }}
        >
          <div
            style={{
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
            }}
          >
            <div className="relative h-full w-full bg-white">
              {[0, 1].map((cardIndex) => {
                const leftPosition = gap + cardIndex * (cardWidth + gap)

                return (
                  <React.Fragment key={cardIndex}>
                    {/* Background for this card */}
                    <CardBackground
                      bg={pageBackground}
                      bleedMm={bleedMm}
                      cardLeft={leftPosition}
                      cardTop={topMargin}
                      cardWidth={cardWidth}
                      cardHeight={cardHeight}
                      foldPosition={foldPosition}
                      rotated={rotated}
                    />

                    {/* Card content */}
                    <div
                      className="absolute border border-slate-100"
                      style={{
                        left: `${leftPosition}mm`,
                        top: `${topMargin}mm`,
                        width: `${cardWidth}mm`,
                        height: `${cardHeight}mm`,
                      }}
                    >
                      {rotated ? (
                        <>
                          {/* Horizontal fold line */}
                          <div
                            className="absolute left-0 w-full border-t border-dashed border-slate-300"
                            style={{ top: `${foldPosition}mm` }}
                          />

                          {/* Top half - Front */}
                          <div
                            className="absolute left-0 top-0 flex items-center justify-center overflow-hidden"
                            style={{ width: `${cardWidth}mm`, height: `${foldPosition}mm` }}
                          >
                            <FrontContent
                              frontMode={frontMode}
                              frontText={frontText}
                              image={image}
                              imageScale={imageScale}
                              rotated={true}
                              panelWidthMm={cardWidth}
                              panelHeightMm={foldPosition}
                              filterSuffix={`-sc-r${cardIndex}`}
                            />
                          </div>

                          {/* Bottom half - Back (text) */}
                          <div
                            className="absolute left-0 flex items-center justify-center overflow-hidden"
                            style={{ top: `${foldPosition}mm`, width: `${cardWidth}mm`, height: `${foldPosition}mm` }}
                          >
                            <div
                              className="flex flex-col items-center justify-end pb-4"
                              style={{ width: `${foldPosition}mm`, height: `${cardWidth}mm`, transform: 'rotate(-90deg)' }}
                            >
                              {text && (
                                <p
                                  className="whitespace-pre-line text-center px-4"
                                  style={{
                                    fontFamily: textStyle.fontFamily,
                                    fontSize: `${textStyle.fontSize}pt`,
                                    fontWeight: textStyle.bold ? 'bold' : 'normal',
                                    fontStyle: textStyle.italic ? 'italic' : 'normal',
                                  }}
                                >
                                  {text}
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Vertical fold line */}
                          <div
                            className="absolute top-0 h-full border-l border-dashed border-slate-300"
                            style={{ left: '50%' }}
                          />

                          {/* Left half - Back (text) */}
                          <div
                            className="absolute left-0 top-0 flex h-full flex-col items-center justify-end pb-4"
                            style={{ width: '50%' }}
                          >
                            {text && (
                              <p
                                className="whitespace-pre-line text-center px-2"
                                style={{
                                  fontFamily: textStyle.fontFamily,
                                  fontSize: `${textStyle.fontSize}pt`,
                                  fontWeight: textStyle.bold ? 'bold' : 'normal',
                                  fontStyle: textStyle.italic ? 'italic' : 'normal',
                                }}
                              >
                                {text}
                              </p>
                            )}
                          </div>

                          {/* Right half - Front */}
                          <div
                            className="absolute right-0 top-0 flex h-full items-center justify-center overflow-hidden"
                            style={{ width: '50%' }}
                          >
                            <FrontContent
                              frontMode={frontMode}
                              frontText={frontText}
                              image={image}
                              imageScale={imageScale}
                              panelWidthMm={cardWidth / 2}
                              panelHeightMm={cardHeight}
                              filterSuffix={`-sc-${cardIndex}`}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard single card preview
  return (
    <div className="space-y-1 lg:space-y-4" ref={containerRef}>
      <div className="hidden lg:flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
        <p className="text-sm text-slate-500">
          {cardSize.name} ({flatDimensions.width}×{flatDimensions.height}mm)
        </p>
      </div>

      <div
        className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm lg:mx-auto"
        style={{
          width: `${A4_WIDTH_PX * previewScale}px`,
          height: `${A4_HEIGHT_PX * previewScale}px`,
        }}
      >
        <div
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
          }}
        >
          <div className="relative h-full w-full bg-white">
            {/* Background */}
            <CardBackground
              bg={pageBackground}
              bleedMm={bleedMm}
              cardLeft={margins.left}
              cardTop={margins.top}
              cardWidth={flatDimensions.width}
              cardHeight={flatDimensions.height}
              foldPosition={cardSize.width}
              rotated={false}
            />

            {/* Crop marks */}
            {cardSize.needsCropMarks && pageBackground.showPrintMarks && (
              <CropMarks
                margins={margins}
                flatDimensions={flatDimensions}
                cropMarkLength={cropMarkLength}
                cropMarkOffset={cropMarkOffset}
              />
            )}

            {/* Card area */}
            <div
              className="absolute border border-slate-100"
              style={{
                left: `${margins.left}mm`,
                top: `${margins.top}mm`,
                width: `${flatDimensions.width}mm`,
                height: `${flatDimensions.height}mm`,
              }}
            >
              {/* Fold line */}
              <div
                className="absolute top-0 h-full border-l border-dashed border-slate-300"
                style={{ left: '50%' }}
              />

              {/* Left half - Back (text) */}
              <div
                className="absolute left-0 top-0 flex h-full flex-col items-center justify-end pb-8"
                style={{ width: '50%' }}
              >
                {text && (
                  <p
                    className="whitespace-pre-line text-center px-4"
                    style={{
                      fontFamily: textStyle.fontFamily,
                      fontSize: `${textStyle.fontSize}pt`,
                      fontWeight: textStyle.bold ? 'bold' : 'normal',
                      fontStyle: textStyle.italic ? 'italic' : 'normal',
                    }}
                  >
                    {text}
                  </p>
                )}
              </div>

              {/* Right half - Front */}
              <div
                className="absolute right-0 top-0 flex h-full items-center justify-center overflow-hidden"
                style={{ width: '50%' }}
              >
                <FrontContent
                  frontMode={frontMode}
                  frontText={frontText}
                  image={image}
                  imageScale={imageScale}
                  panelWidthMm={cardSize.width}
                  panelHeightMm={flatDimensions.height}
                  filterSuffix="-sc"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Print view ───────────────────────────────────────────────────────────────

interface CardPrintViewProps {
  cardSizeId: string
  image: string | null
  imageScale: number
  text: string
  textStyle: TextStyle
  customSize?: CardSize | null
  forPdf?: boolean
  twoPerPage?: boolean
  pageBackground?: PageBackground
  frontMode?: 'image' | 'text'
  frontText?: FrontTextContent
}

export function CardPrintView({
  cardSizeId,
  image,
  imageScale,
  text,
  textStyle,
  customSize,
  forPdf = false,
  twoPerPage = false,
  pageBackground = DEFAULT_PAGE_BACKGROUND,
  frontMode = 'image',
  frontText = DEFAULT_FRONT_TEXT,
}: CardPrintViewProps) {
  const cardSize = cardSizeId === 'custom' ? customSize : getCardSize(cardSizeId)

  if (!cardSize) {
    return null
  }

  const twoPerPageLayout = twoPerPage ? getTwoPerPageLayout(cardSize) : null

  if (twoPerPageLayout) {
    return (
      <TwoPerPagePrintView
        cardSize={cardSize}
        layout={twoPerPageLayout}
        image={image}
        imageScale={imageScale}
        text={text}
        textStyle={textStyle}
        forPdf={forPdf}
        pageBackground={pageBackground}
        frontMode={frontMode}
        frontText={frontText}
      />
    )
  }

  const flatDimensions = getFlatDimensions(cardSize)
  const margins = getCenterMargins(cardSize)
  const cropMarkLength = 8 // mm
  const cropMarkOffset = 3 // mm from card edge
  const bleedMm = pageBackground.bleed * 10
  const showMarks = pageBackground.showPrintMarks

  return (
    <div className={forPdf ? 'card-preview-container' : 'print-only card-preview-container'}>
      <div
        className="relative bg-white"
        style={{ width: '297mm', height: '210mm' }}
      >
        {/* Background */}
        <CardBackground
          bg={pageBackground}
          bleedMm={bleedMm}
          cardLeft={margins.left}
          cardTop={margins.top}
          cardWidth={flatDimensions.width}
          cardHeight={flatDimensions.height}
          foldPosition={cardSize.width}
          rotated={false}
        />

        {/* Crop marks */}
        {showMarks && cardSize.needsCropMarks && (
          <CropMarks
            margins={margins}
            flatDimensions={flatDimensions}
            cropMarkLength={cropMarkLength}
            cropMarkOffset={cropMarkOffset}
          />
        )}

        {/* Fold marks */}
        {showMarks && (
          <FoldMarks
            margins={margins}
            cardWidth={cardSize.width}
            flatHeight={flatDimensions.height}
            markLength={cropMarkLength}
            markOffset={cropMarkOffset}
          />
        )}

        {/* Card area */}
        <div
          className="absolute"
          style={{
            left: `${margins.left}mm`,
            top: `${margins.top}mm`,
            width: `${flatDimensions.width}mm`,
            height: `${flatDimensions.height}mm`,
          }}
        >
          {/* Left half - Back (text) */}
          <div
            className="absolute left-0 top-0 flex flex-col items-center justify-end"
            style={{
              width: `${cardSize.width}mm`,
              height: `${flatDimensions.height}mm`,
              paddingBottom: '8mm',
            }}
          >
            {text && (
              <p
                className="whitespace-pre-line text-center"
                style={{
                  fontFamily: textStyle.fontFamily,
                  fontSize: `${textStyle.fontSize}pt`,
                  fontWeight: textStyle.bold ? 'bold' : 'normal',
                  fontStyle: textStyle.italic ? 'italic' : 'normal',
                  padding: '0 4mm',
                }}
              >
                {text}
              </p>
            )}
          </div>

          {/* Right half - Front */}
          <div
            className="absolute top-0 flex items-center justify-center overflow-hidden"
            style={{
              left: `${cardSize.width}mm`,
              width: `${cardSize.width}mm`,
              height: `${flatDimensions.height}mm`,
            }}
          >
            <FrontContent
              frontMode={frontMode}
              frontText={frontText}
              image={image}
              imageScale={imageScale}
              panelWidthMm={cardSize.width}
              panelHeightMm={flatDimensions.height}
              filterSuffix="-pr"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Two-per-page print view ──────────────────────────────────────────────────

interface TwoPerPagePrintViewProps {
  cardSize: CardSize
  layout: {
    rotated: boolean
    cardWidth: number
    cardHeight: number
    gap: number
  }
  image: string | null
  imageScale: number
  text: string
  textStyle: TextStyle
  forPdf: boolean
  pageBackground: PageBackground
  frontMode?: 'image' | 'text'
  frontText?: FrontTextContent
}

function TwoPerPagePrintView({
  cardSize,
  layout,
  image,
  imageScale,
  text,
  textStyle,
  forPdf,
  pageBackground,
  frontMode = 'image',
  frontText = DEFAULT_FRONT_TEXT,
}: TwoPerPagePrintViewProps) {
  const { rotated, cardWidth, cardHeight, gap } = layout
  const cropMarkLength = 8 // mm
  const cropMarkOffset = 3 // mm from card edge
  const bleedMm = pageBackground.bleed * 10
  const showMarks = pageBackground.showPrintMarks

  const topMargin = (A4_LANDSCAPE.height - cardHeight) / 2
  const foldPosition = cardSize.width

  return (
    <div className={forPdf ? 'card-preview-container' : 'print-only card-preview-container'}>
      <div
        className="relative bg-white"
        style={{ width: '297mm', height: '210mm' }}
      >
        {[0, 1].map((cardIndex) => {
          const leftPosition = gap + cardIndex * (cardWidth + gap)

          return (
            <React.Fragment key={cardIndex}>
              {/* Background for this card */}
              <CardBackground
                bg={pageBackground}
                bleedMm={bleedMm}
                cardLeft={leftPosition}
                cardTop={topMargin}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                foldPosition={foldPosition}
                rotated={rotated}
              />

              {/* Print marks for this card */}
              {showMarks && (
                <>
                  <CropMarks
                    margins={{ left: leftPosition, top: topMargin }}
                    flatDimensions={{ width: cardWidth, height: cardHeight }}
                    cropMarkLength={cropMarkLength}
                    cropMarkOffset={cropMarkOffset}
                  />
                  {rotated ? (
                    <RotatedFoldMarks
                      cardLeft={leftPosition}
                      cardTop={topMargin}
                      cardWidth={cardWidth}
                      foldFromTop={foldPosition}
                      markLength={cropMarkLength}
                      markOffset={cropMarkOffset}
                    />
                  ) : (
                    <FoldMarks
                      margins={{ left: leftPosition, top: topMargin }}
                      cardWidth={foldPosition}
                      flatHeight={cardHeight}
                      markLength={cropMarkLength}
                      markOffset={cropMarkOffset}
                    />
                  )}
                </>
              )}

              {/* Card content */}
              <div
                className="absolute"
                style={{
                  left: `${leftPosition}mm`,
                  top: `${topMargin}mm`,
                  width: `${cardWidth}mm`,
                  height: `${cardHeight}mm`,
                }}
              >
                {rotated ? (
                  <>
                    {/* Top half - Front */}
                    <div
                      className="absolute left-0 top-0 flex items-center justify-center overflow-hidden"
                      style={{ width: `${cardWidth}mm`, height: `${foldPosition}mm` }}
                    >
                      <FrontContent
                        frontMode={frontMode}
                        frontText={frontText}
                        image={image}
                        imageScale={imageScale}
                        rotated={true}
                        panelWidthMm={cardWidth}
                        panelHeightMm={foldPosition}
                        filterSuffix={`-pr-r${cardIndex}`}
                      />
                    </div>

                    {/* Bottom half - Back (text) */}
                    <div
                      className="absolute left-0 flex items-center justify-center overflow-hidden"
                      style={{ top: `${foldPosition}mm`, width: `${cardWidth}mm`, height: `${foldPosition}mm` }}
                    >
                      <div
                        className="flex flex-col items-center justify-end"
                        style={{
                          width: `${foldPosition}mm`,
                          height: `${cardWidth}mm`,
                          transform: 'rotate(-90deg)',
                          paddingBottom: '8mm',
                        }}
                      >
                        {text && (
                          <p
                            className="whitespace-pre-line text-center"
                            style={{
                              fontFamily: textStyle.fontFamily,
                              fontSize: `${textStyle.fontSize}pt`,
                              fontWeight: textStyle.bold ? 'bold' : 'normal',
                              fontStyle: textStyle.italic ? 'italic' : 'normal',
                              padding: '0 4mm',
                            }}
                          >
                            {text}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Left half - Back (text) */}
                    <div
                      className="absolute left-0 top-0 flex flex-col items-center justify-end"
                      style={{ width: `${foldPosition}mm`, height: `${cardHeight}mm`, paddingBottom: '8mm' }}
                    >
                      {text && (
                        <p
                          className="whitespace-pre-line text-center"
                          style={{
                            fontFamily: textStyle.fontFamily,
                            fontSize: `${textStyle.fontSize}pt`,
                            fontWeight: textStyle.bold ? 'bold' : 'normal',
                            fontStyle: textStyle.italic ? 'italic' : 'normal',
                            padding: '0 4mm',
                          }}
                        >
                          {text}
                        </p>
                      )}
                    </div>

                    {/* Right half - Front */}
                    <div
                      className="absolute top-0 flex items-center justify-center overflow-hidden"
                      style={{ left: `${foldPosition}mm`, width: `${foldPosition}mm`, height: `${cardHeight}mm` }}
                    >
                      <FrontContent
                        frontMode={frontMode}
                        frontText={frontText}
                        image={image}
                        imageScale={imageScale}
                        panelWidthMm={foldPosition}
                        panelHeightMm={cardHeight}
                        filterSuffix={`-pr-${cardIndex}`}
                      />
                    </div>
                  </>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ─── Print mark sub-components ────────────────────────────────────────────────

interface RotatedFoldMarksProps {
  cardLeft: number
  cardTop: number
  cardWidth: number
  foldFromTop: number
  markLength: number
  markOffset: number
}

function RotatedFoldMarks({ cardLeft, cardTop, cardWidth, foldFromTop, markLength, markOffset }: RotatedFoldMarksProps) {
  const foldY = cardTop + foldFromTop

  return (
    <>
      <div
        className="absolute bg-slate-400"
        style={{
          left: `${cardLeft - markOffset - markLength}mm`,
          top: `${foldY}mm`,
          width: `${markLength}mm`,
          height: '0.25mm',
        }}
      />
      <div
        className="absolute bg-slate-400"
        style={{
          left: `${cardLeft + cardWidth + markOffset}mm`,
          top: `${foldY}mm`,
          width: `${markLength}mm`,
          height: '0.25mm',
        }}
      />
    </>
  )
}

interface CropMarksProps {
  margins: { left: number; top: number }
  flatDimensions: { width: number; height: number }
  cropMarkLength: number
  cropMarkOffset: number
}

function CropMarks({ margins, flatDimensions, cropMarkLength, cropMarkOffset }: CropMarksProps) {
  const corners = [
    { x: margins.left, y: margins.top, hDir: -1, vDir: -1 },
    { x: margins.left + flatDimensions.width, y: margins.top, hDir: 1, vDir: -1 },
    { x: margins.left, y: margins.top + flatDimensions.height, hDir: -1, vDir: 1 },
    { x: margins.left + flatDimensions.width, y: margins.top + flatDimensions.height, hDir: 1, vDir: 1 },
  ]

  return (
    <>
      {corners.map((corner, index) => (
        <React.Fragment key={index}>
          <div
            className="absolute bg-slate-400"
            style={{
              left: `${corner.x + cropMarkOffset * corner.hDir}mm`,
              top: `${corner.y}mm`,
              width: `${cropMarkLength}mm`,
              height: '0.25mm',
              transform: corner.hDir === -1 ? 'translateX(-100%)' : 'none',
            }}
          />
          <div
            className="absolute bg-slate-400"
            style={{
              left: `${corner.x}mm`,
              top: `${corner.y + cropMarkOffset * corner.vDir}mm`,
              width: '0.25mm',
              height: `${cropMarkLength}mm`,
              transform: corner.vDir === -1 ? 'translateY(-100%)' : 'none',
            }}
          />
        </React.Fragment>
      ))}
    </>
  )
}

interface FoldMarksProps {
  margins: { left: number; top: number }
  cardWidth: number
  flatHeight: number
  markLength: number
  markOffset: number
}

function FoldMarks({ margins, cardWidth, flatHeight, markLength, markOffset }: FoldMarksProps) {
  const foldX = margins.left + cardWidth

  return (
    <>
      <div
        className="absolute bg-slate-400"
        style={{
          left: `${foldX}mm`,
          top: `${margins.top - markOffset - markLength}mm`,
          width: '0.25mm',
          height: `${markLength}mm`,
        }}
      />
      <div
        className="absolute bg-slate-400"
        style={{
          left: `${foldX}mm`,
          top: `${margins.top + flatHeight + markOffset}mm`,
          width: '0.25mm',
          height: `${markLength}mm`,
        }}
      />
    </>
  )
}
