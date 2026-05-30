'use client'

import React, { useRef, useState, useEffect } from 'react'
import { getCardSize, getFlatDimensions, getCenterMargins, getTwoPerPageLayout, A4_LANDSCAPE, type CardSize } from '@/lib/cardSizes'
import type { TextStyle } from '@/components/TextEditor'

interface CardPreviewProps {
  cardSizeId: string
  image: string | null
  imageScale: number
  text: string
  textStyle: TextStyle
  customSize?: CardSize | null
  twoPerPage?: boolean
}

// A4 landscape in pixels at 96 DPI (for calculating scale)
const A4_WIDTH_PX = (297 / 25.4) * 96 // ~1122px
const A4_HEIGHT_PX = (210 / 25.4) * 96 // ~793px
const A4_ASPECT = A4_WIDTH_PX / A4_HEIGHT_PX

export default function CardPreview({
  cardSizeId,
  image,
  imageScale,
  text,
  textStyle,
  customSize,
  twoPerPage = false,
}: CardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(0.85)

  const cardSize = cardSizeId === 'custom' ? customSize : getCardSize(cardSizeId)
  const twoPerPageLayout = twoPerPage && cardSize ? getTwoPerPageLayout(cardSize) : null

  // Calculate scale to fit preview in available space
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth
        const isMobile = window.innerWidth < 1024

        // On mobile: scale to fit full width
        // On desktop: cap at 0.7 scale for reasonable size
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

  // Calculate aspect ratio for responsive container
  const aspectRatio = A4_LANDSCAPE.width / A4_LANDSCAPE.height

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
              {/* Render two cards */}
              {[0, 1].map((cardIndex) => {
                const leftPosition = gap + cardIndex * (cardWidth + gap)

                return (
                  <div
                    key={cardIndex}
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
                        {/* Horizontal fold line for rotated cards */}
                        <div
                          className="absolute left-0 w-full border-t border-dashed border-slate-300"
                          style={{ top: `${foldPosition}mm` }}
                        />

                        {/* Top half - Front of card (image) */}
                        <div
                          className="absolute left-0 top-0 flex items-center justify-center overflow-hidden"
                          style={{
                            width: `${cardWidth}mm`,
                            height: `${foldPosition}mm`,
                          }}
                        >
                          {image ? (
                            <img
                              src={image}
                              alt="Card front"
                              className="max-h-[80%] max-w-[80%] object-contain"
                              style={{ transform: `rotate(-90deg) scale(${imageScale / 100})` }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-300" style={{ transform: 'rotate(-90deg)' }}>
                              <div className="text-4xl">+</div>
                              <div className="mt-2 text-sm">Front Image</div>
                            </div>
                          )}
                        </div>

                        {/* Bottom half - Back of card (text) */}
                        <div
                          className="absolute left-0 flex items-center justify-center overflow-hidden"
                          style={{
                            top: `${foldPosition}mm`,
                            width: `${cardWidth}mm`,
                            height: `${foldPosition}mm`,
                          }}
                        >
                          <div
                            className="flex flex-col items-center justify-end pb-4"
                            style={{
                              width: `${foldPosition}mm`,
                              height: `${cardWidth}mm`,
                              transform: 'rotate(-90deg)',
                            }}
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

                        {/* Left half - Back of card */}
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

                        {/* Right half - Front of card */}
                        <div
                          className="absolute right-0 top-0 flex h-full items-center justify-center overflow-hidden"
                          style={{ width: '50%' }}
                        >
                          {image ? (
                            <img
                              src={image}
                              alt="Card front"
                              className="max-h-[80%] max-w-[80%] object-contain"
                              style={{ transform: `scale(${imageScale / 100})` }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-300">
                              <div className="text-4xl">+</div>
                              <div className="mt-2 text-sm">Front Image</div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
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

      {/* Preview container - A4 aspect ratio, sized to content */}
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
          {/* A4 page */}
          <div className="relative h-full w-full bg-white">
            {/* Crop marks - only if needed */}
            {cardSize.needsCropMarks && (
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

              {/* Left half - Back of card */}
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

              {/* Right half - Front of card */}
              <div
                className="absolute right-0 top-0 flex h-full items-center justify-center overflow-hidden"
                style={{ width: '50%' }}
              >
                {image ? (
                  <img
                    src={image}
                    alt="Card front"
                    className="max-h-[80%] max-w-[80%] object-contain"
                    style={{ transform: `scale(${imageScale / 100})` }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <div className="text-4xl">+</div>
                    <div className="mt-2 text-sm">Front Image</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Separate component for print output - rendered outside no-print hierarchy
interface CardPrintViewProps {
  cardSizeId: string
  image: string | null
  imageScale: number
  text: string
  textStyle: TextStyle
  customSize?: CardSize | null
  forPdf?: boolean
  twoPerPage?: boolean
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
}: CardPrintViewProps) {
  const cardSize = cardSizeId === 'custom' ? customSize : getCardSize(cardSizeId)

  if (!cardSize) {
    return null
  }

  const twoPerPageLayout = twoPerPage ? getTwoPerPageLayout(cardSize) : null

  // If two-per-page is enabled and possible, render that layout
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
      />
    )
  }

  // Standard single card layout
  const flatDimensions = getFlatDimensions(cardSize)
  const margins = getCenterMargins(cardSize)
  const cropMarkLength = 8 // mm
  const cropMarkOffset = 3 // mm from card edge

  return (
    <div className={forPdf ? 'card-preview-container' : 'print-only card-preview-container'}>
      <div
        className="relative bg-white"
        style={{ width: '297mm', height: '210mm' }}
      >
        {/* Crop marks - only if needed */}
        {cardSize.needsCropMarks && (
          <CropMarks
            margins={margins}
            flatDimensions={flatDimensions}
            cropMarkLength={cropMarkLength}
            cropMarkOffset={cropMarkOffset}
          />
        )}

        {/* Fold marks - always show */}
        <FoldMarks
          margins={margins}
          cardWidth={cardSize.width}
          flatHeight={flatDimensions.height}
          markLength={cropMarkLength}
          markOffset={cropMarkOffset}
        />

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
          {/* Left half - Back of card */}
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

          {/* Right half - Front of card */}
          <div
            className="absolute top-0 flex items-center justify-center overflow-hidden"
            style={{
              left: `${cardSize.width}mm`,
              width: `${cardSize.width}mm`,
              height: `${flatDimensions.height}mm`,
            }}
          >
            {image && (
              <img
                src={image}
                alt="Card front"
                style={{
                  maxWidth: '80%',
                  maxHeight: '80%',
                  objectFit: 'contain',
                  transform: `scale(${imageScale / 100})`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Two-per-page layout component
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
}

function TwoPerPagePrintView({
  cardSize,
  layout,
  image,
  imageScale,
  text,
  textStyle,
  forPdf,
}: TwoPerPagePrintViewProps) {
  const { rotated, cardWidth, cardHeight, gap } = layout
  const cropMarkLength = 8 // mm
  const cropMarkOffset = 3 // mm from card edge

  // Calculate vertical centering
  const topMargin = (A4_LANDSCAPE.height - cardHeight) / 2

  // For rotated cards, the "flat width" on page is actually the original height
  // and we need to figure out where the fold line is
  // Original flat: width = cardSize.width * 2, height = cardSize.height
  // Rotated flat: width = cardSize.height, height = cardSize.width * 2
  // The fold is at cardSize.width from the top (when rotated)
  const foldPosition = rotated ? cardSize.width : cardSize.width

  return (
    <div className={forPdf ? 'card-preview-container' : 'print-only card-preview-container'}>
      <div
        className="relative bg-white"
        style={{ width: '297mm', height: '210mm' }}
      >
        {/* Render two cards */}
        {[0, 1].map((cardIndex) => {
          const leftPosition = gap + cardIndex * (cardWidth + gap)

          return (
            <React.Fragment key={cardIndex}>
              {/* Crop marks for this card */}
              <CropMarks
                margins={{ left: leftPosition, top: topMargin }}
                flatDimensions={{ width: cardWidth, height: cardHeight }}
                cropMarkLength={cropMarkLength}
                cropMarkOffset={cropMarkOffset}
              />

              {/* Fold marks for this card */}
              {rotated ? (
                // Horizontal fold marks for rotated cards
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

              {/* Card area */}
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
                  // Rotated layout: top half is front (image), bottom half is back (text)
                  <>
                    {/* Top half - Front of card (image) */}
                    <div
                      className="absolute left-0 top-0 flex items-center justify-center overflow-hidden"
                      style={{
                        width: `${cardWidth}mm`,
                        height: `${foldPosition}mm`,
                      }}
                    >
                      {image && (
                        <img
                          src={image}
                          alt="Card front"
                          style={{
                            maxWidth: '80%',
                            maxHeight: '80%',
                            objectFit: 'contain',
                            transform: `rotate(-90deg) scale(${imageScale / 100})`,
                          }}
                        />
                      )}
                    </div>

                    {/* Bottom half - Back of card (text) */}
                    <div
                      className="absolute left-0 flex items-center justify-center overflow-hidden"
                      style={{
                        top: `${foldPosition}mm`,
                        width: `${cardWidth}mm`,
                        height: `${foldPosition}mm`,
                      }}
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
                  // Non-rotated layout: left half is back (text), right half is front (image)
                  <>
                    {/* Left half - Back of card */}
                    <div
                      className="absolute left-0 top-0 flex flex-col items-center justify-end"
                      style={{
                        width: `${foldPosition}mm`,
                        height: `${cardHeight}mm`,
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

                    {/* Right half - Front of card */}
                    <div
                      className="absolute top-0 flex items-center justify-center overflow-hidden"
                      style={{
                        left: `${foldPosition}mm`,
                        width: `${foldPosition}mm`,
                        height: `${cardHeight}mm`,
                      }}
                    >
                      {image && (
                        <img
                          src={image}
                          alt="Card front"
                          style={{
                            maxWidth: '80%',
                            maxHeight: '80%',
                            objectFit: 'contain',
                            transform: `scale(${imageScale / 100})`,
                          }}
                        />
                      )}
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

// Horizontal fold marks for rotated cards
interface RotatedFoldMarksProps {
  cardLeft: number
  cardTop: number
  cardWidth: number
  foldFromTop: number
  markLength: number
  markOffset: number
}

function RotatedFoldMarks({
  cardLeft,
  cardTop,
  cardWidth,
  foldFromTop,
  markLength,
  markOffset,
}: RotatedFoldMarksProps) {
  const foldY = cardTop + foldFromTop

  return (
    <>
      {/* Left fold mark */}
      <div
        className="absolute bg-slate-400"
        style={{
          left: `${cardLeft - markOffset - markLength}mm`,
          top: `${foldY}mm`,
          width: `${markLength}mm`,
          height: '0.25mm',
        }}
      />
      {/* Right fold mark */}
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

function CropMarks({
  margins,
  flatDimensions,
  cropMarkLength,
  cropMarkOffset,
}: CropMarksProps) {
  const corners = [
    // Top-left
    {
      x: margins.left,
      y: margins.top,
      hDir: -1,
      vDir: -1,
    },
    // Top-right
    {
      x: margins.left + flatDimensions.width,
      y: margins.top,
      hDir: 1,
      vDir: -1,
    },
    // Bottom-left
    {
      x: margins.left,
      y: margins.top + flatDimensions.height,
      hDir: -1,
      vDir: 1,
    },
    // Bottom-right
    {
      x: margins.left + flatDimensions.width,
      y: margins.top + flatDimensions.height,
      hDir: 1,
      vDir: 1,
    },
  ]

  return (
    <>
      {corners.map((corner, index) => (
        <React.Fragment key={index}>
          {/* Horizontal line */}
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
          {/* Vertical line */}
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

function FoldMarks({
  margins,
  cardWidth,
  flatHeight,
  markLength,
  markOffset,
}: FoldMarksProps) {
  // Fold line is at the center of the card (margins.left + cardWidth)
  const foldX = margins.left + cardWidth

  return (
    <>
      {/* Top fold mark */}
      <div
        className="absolute bg-slate-400"
        style={{
          left: `${foldX}mm`,
          top: `${margins.top - markOffset - markLength}mm`,
          width: '0.25mm',
          height: `${markLength}mm`,
        }}
      />
      {/* Bottom fold mark */}
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
