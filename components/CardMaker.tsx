'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Download, Loader2, ChevronDown, FilePlus, FolderOpen, Save, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import TextEditor, { type TextStyle } from '@/components/TextEditor'
import SizeSelector from '@/components/SizeSelector'
import BackgroundEditor from '@/components/BackgroundEditor'
import FrontPanelEditor from '@/components/FrontPanelEditor'
import CardPreview, { CardPrintView } from '@/components/CardPreview'
import { type CardSize, canFitTwoPerPage, getCardSize } from '@/lib/cardSizes'
import { generatePdf } from '@/lib/generatePdf'
import {
  type CardState,
  type CardMetadata,
  type SavedCard,
  saveCard,
  loadCard,
  listCards,
  deleteCard,
  createNewCard,
  setCurrentCardId,
  getCurrentCardId,
} from '@/lib/cardStorage'
import { type PageBackground, DEFAULT_PAGE_BACKGROUND } from '@/lib/background'
import { type FrontTextContent, DEFAULT_FRONT_TEXT } from '@/lib/frontText'

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 18,
  bold: false,
  italic: false,
}

const DEFAULT_CARD_STATE: CardState = {
  image: null,
  imageScale: 100,
  text: '',
  textStyle: DEFAULT_TEXT_STYLE,
  cardSize: 'a5',
  customSize: null,
  twoPerPage: false,
  pageBackground: DEFAULT_PAGE_BACKGROUND,
  frontMode: 'image',
  frontText: DEFAULT_FRONT_TEXT,
}

export default function CardMaker() {
  // Card content state
  const [image, setImage] = useState<string | null>(null)
  const [imageScale, setImageScale] = useState(100)
  const [text, setText] = useState('')
  const [textStyle, setTextStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE)
  const [cardSize, setCardSize] = useState('a5')
  const [customSize, setCustomSize] = useState<CardSize | null>(null)
  const [twoPerPage, setTwoPerPage] = useState(false)
  const [pageBackground, setPageBackground] = useState<PageBackground>(DEFAULT_PAGE_BACKGROUND)
  const [frontMode, setFrontMode] = useState<'image' | 'text'>('image')
  const [frontText, setFrontText] = useState<FrontTextContent>(DEFAULT_FRONT_TEXT)

  // File management state
  const [currentCard, setCurrentCard] = useState<SavedCard | null>(null)
  const [savedCards, setSavedCards] = useState<CardMetadata[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [openDialog, setOpenDialog] = useState<'save' | 'saveAs' | 'rename' | 'open' | 'delete' | null>(null)
  const [dialogCardName, setDialogCardName] = useState('')
  const [cardToDelete, setCardToDelete] = useState<CardMetadata | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')

  const printRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Get current card state as an object
  const getCurrentState = useCallback((): CardState => ({
    image,
    imageScale,
    text,
    textStyle,
    cardSize,
    customSize,
    twoPerPage,
    pageBackground,
    frontMode,
    frontText,
  }), [image, imageScale, text, textStyle, cardSize, customSize, twoPerPage, pageBackground, frontMode, frontText])

  // Apply state from a saved card
  const applyCardState = useCallback((state: CardState) => {
    setImage(state.image)
    setImageScale(state.imageScale)
    setText(state.text)
    setTextStyle(state.textStyle)
    setCardSize(state.cardSize)
    setCustomSize(state.customSize)
    setTwoPerPage(state.twoPerPage)
    setPageBackground(state.pageBackground ?? DEFAULT_PAGE_BACKGROUND)
    setFrontMode(state.frontMode ?? 'image')
    setFrontText(state.frontText ?? DEFAULT_FRONT_TEXT)
  }, [])

  // Load saved cards list and restore last open card
  useEffect(() => {
    async function init() {
      const cards = await listCards()
      setSavedCards(cards)

      const lastCardId = await getCurrentCardId()
      if (lastCardId) {
        const card = await loadCard(lastCardId)
        if (card) {
          setCurrentCard(card)
          applyCardState(card)
        }
      }
      setIsLoaded(true)
    }
    init()
  }, [applyCardState])

  // Track unsaved changes
  useEffect(() => {
    if (!isLoaded) return

    if (!currentCard) {
      // New unsaved card - has changes if any content exists
      const hasContent = image !== null || text !== ''
      setHasUnsavedChanges(hasContent)
    } else {
      // Existing card - compare with saved state
      const current = getCurrentState()
      const changed =
        current.image !== currentCard.image ||
        current.imageScale !== currentCard.imageScale ||
        current.text !== currentCard.text ||
        current.cardSize !== currentCard.cardSize ||
        current.twoPerPage !== currentCard.twoPerPage ||
        JSON.stringify(current.textStyle) !== JSON.stringify(currentCard.textStyle) ||
        JSON.stringify(current.customSize) !== JSON.stringify(currentCard.customSize) ||
        JSON.stringify(current.pageBackground) !== JSON.stringify(currentCard.pageBackground ?? DEFAULT_PAGE_BACKGROUND) ||
        current.frontMode !== (currentCard.frontMode ?? 'image') ||
        JSON.stringify(current.frontText) !== JSON.stringify(currentCard.frontText ?? DEFAULT_FRONT_TEXT)
      setHasUnsavedChanges(changed)
    }
  }, [isLoaded, currentCard, image, imageScale, text, textStyle, cardSize, customSize, twoPerPage, pageBackground, frontMode, frontText, getCurrentState])

  // Auto-save when card already exists (debounced)
  useEffect(() => {
    if (!isLoaded || !currentCard) return

    const timeout = setTimeout(async () => {
      const current = getCurrentState()
      const changed =
        current.image !== currentCard.image ||
        current.imageScale !== currentCard.imageScale ||
        current.text !== currentCard.text ||
        current.cardSize !== currentCard.cardSize ||
        current.twoPerPage !== currentCard.twoPerPage ||
        JSON.stringify(current.textStyle) !== JSON.stringify(currentCard.textStyle) ||
        JSON.stringify(current.customSize) !== JSON.stringify(currentCard.customSize) ||
        JSON.stringify(current.pageBackground) !== JSON.stringify(currentCard.pageBackground ?? DEFAULT_PAGE_BACKGROUND) ||
        current.frontMode !== (currentCard.frontMode ?? 'image') ||
        JSON.stringify(current.frontText) !== JSON.stringify(currentCard.frontText ?? DEFAULT_FRONT_TEXT)

      if (changed) {
        const updated: SavedCard = {
          ...current,
          id: currentCard.id,
          name: currentCard.name,
          updatedAt: Date.now(),
        }
        await saveCard(updated)
        setCurrentCard(updated)
        setHasUnsavedChanges(false)

        // Refresh cards list
        const cards = await listCards()
        setSavedCards(cards)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [isLoaded, currentCard, image, imageScale, text, textStyle, cardSize, customSize, twoPerPage, pageBackground, frontMode, frontText, getCurrentState])

  // Check if current card size supports two-per-page
  const currentCardSize = cardSize === 'custom' ? customSize : getCardSize(cardSize)
  const canPrintTwoPerPage = currentCardSize ? canFitTwoPerPage(currentCardSize) : false

  const handleDownloadPdf = async () => {
    if (!printRef.current) return

    setIsGenerating(true)
    try {
      await generatePdf(printRef.current, 'greeting-card.pdf')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // File menu handlers
  const handleNew = () => {
    applyCardState(DEFAULT_CARD_STATE)
    setCurrentCard(null)
    setCurrentCardId(null)
    setHasUnsavedChanges(false)
  }

  const handleSave = async () => {
    if (currentCard) {
      // Update existing card
      const updated: SavedCard = {
        ...getCurrentState(),
        id: currentCard.id,
        name: currentCard.name,
        updatedAt: Date.now(),
      }
      await saveCard(updated)
      setCurrentCard(updated)
      setHasUnsavedChanges(false)

      // Refresh cards list
      const cards = await listCards()
      setSavedCards(cards)
    } else {
      // No current card - show Save As dialog
      setDialogCardName('')
      setOpenDialog('save')
    }
  }

  const handleSaveAs = () => {
    setDialogCardName(currentCard?.name ?? '')
    setOpenDialog('saveAs')
  }

  const handleSaveConfirm = async () => {
    const name = dialogCardName.trim() || 'Untitled Card'
    const newCard = createNewCard(name, getCurrentState())
    await saveCard(newCard)
    setCurrentCard(newCard)
    await setCurrentCardId(newCard.id)
    setHasUnsavedChanges(false)
    setOpenDialog(null)

    // Refresh cards list
    const cards = await listCards()
    setSavedCards(cards)
  }

  const handleOpen = () => {
    setOpenDialog('open')
  }

  const handleOpenCard = async (id: string) => {
    const card = await loadCard(id)
    if (card) {
      setCurrentCard(card)
      applyCardState(card)
      await setCurrentCardId(card.id)
      setHasUnsavedChanges(false)
    }
    setOpenDialog(null)
  }

  const handleRename = () => {
    if (currentCard) {
      setDialogCardName(currentCard.name)
      setOpenDialog('rename')
    }
  }

  const handleRenameConfirm = async () => {
    if (currentCard) {
      const name = dialogCardName.trim() || 'Untitled Card'
      const updated: SavedCard = {
        ...currentCard,
        ...getCurrentState(),
        name,
        updatedAt: Date.now(),
      }
      await saveCard(updated)
      setCurrentCard(updated)
      setHasUnsavedChanges(false)
      setOpenDialog(null)

      // Refresh cards list
      const cards = await listCards()
      setSavedCards(cards)
    }
  }

  const handleDeleteClick = (card: CardMetadata) => {
    setCardToDelete(card)
    setOpenDialog('delete')
  }

  const handleDeleteConfirm = async () => {
    if (cardToDelete) {
      await deleteCard(cardToDelete.id)

      // If deleting current card, reset to new
      if (currentCard?.id === cardToDelete.id) {
        handleNew()
      }

      // Refresh cards list
      const cards = await listCards()
      setSavedCards(cards)
    }
    setCardToDelete(null)
    setOpenDialog(null)
  }

  // Inline name editing handlers
  const handleStartEditingName = () => {
    setEditingName(currentCard?.name ?? '')
    setIsEditingName(true)
    setTimeout(() => nameInputRef.current?.select(), 0)
  }

  const handleFinishEditingName = async () => {
    const name = editingName.trim() || 'Untitled Card'
    setIsEditingName(false)

    if (!currentCard) {
      // New card - save it with the name
      const newCard = createNewCard(name, getCurrentState())
      await saveCard(newCard)
      setCurrentCard(newCard)
      await setCurrentCardId(newCard.id)
      setHasUnsavedChanges(false)
      const cards = await listCards()
      setSavedCards(cards)
    } else if (name !== currentCard.name) {
      // Existing card - rename it
      const updated: SavedCard = {
        ...currentCard,
        ...getCurrentState(),
        name,
        updatedAt: Date.now(),
      }
      await saveCard(updated)
      setCurrentCard(updated)
      setHasUnsavedChanges(false)
      const cards = await listCards()
      setSavedCards(cards)
    }
  }

  const handleCancelEditingName = () => {
    setIsEditingName(false)
    setEditingName('')
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFinishEditingName()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEditingName()
    }
  }

  const cardDisplayName = currentCard?.name ?? 'Untitled'
  const title = hasUnsavedChanges ? `${cardDisplayName} *` : cardDisplayName

  return (
    <>
      {/* Screen-only UI */}
      <div className="min-h-screen no-print">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Card Maker</h1>
              <span className="text-sm text-slate-500 hidden sm:inline">—</span>
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishEditingName}
                  onKeyDown={handleNameKeyDown}
                  className="text-sm text-slate-600 bg-transparent border-b border-slate-400 outline-none px-1 py-0.5 max-w-[200px]"
                  placeholder="Card name"
                  autoFocus
                />
              ) : (
                <button
                  onClick={handleStartEditingName}
                  className="text-sm text-slate-600 hidden sm:inline truncate max-w-[200px] hover:text-slate-900 hover:underline cursor-text"
                  title="Click to rename"
                >
                  {title}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:size-default">
                    File
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleNew}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    New
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpen}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Open...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveAs}>
                    <Save className="mr-2 h-4 w-4" />
                    Save As...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleRename} disabled={!currentCard}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleDownloadPdf} disabled={isGenerating} size="sm" className="sm:size-default">
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Download className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="mx-auto max-w-7xl lg:px-4 lg:py-6">
          <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] lg:gap-6 lg:items-start">
            {/* Controls panel - scrollable */}
            <div className="space-y-6 bg-white p-4 sm:p-6 lg:rounded-lg lg:border lg:border-slate-200 lg:order-1">
              {/* Card Settings */}
              <div>
                <SizeSelector
                  selectedSize={cardSize}
                  onSizeChange={setCardSize}
                  customSize={customSize}
                  onCustomSizeChange={setCustomSize}
                />

                {canPrintTwoPerPage && (
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoPerPage}
                      onChange={(e) => setTwoPerPage(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">Print 2 cards per page</span>
                  </label>
                )}
              </div>

              {/* Front Panel */}
              <div className="border-t border-slate-200 pt-6">
                <FrontPanelEditor
                  mode={frontMode}
                  onModeChange={setFrontMode}
                  image={image}
                  onImageChange={setImage}
                  imageScale={imageScale}
                  onImageScaleChange={setImageScale}
                  frontText={frontText}
                  onFrontTextChange={setFrontText}
                />
              </div>

              {/* Back Text */}
              <div className="border-t border-slate-200 pt-6">
                <TextEditor
                  text={text}
                  textStyle={textStyle}
                  onTextChange={setText}
                  onStyleChange={setTextStyle}
                />
              </div>

              {/* Background */}
              <div className="border-t border-slate-200 pt-6">
                <BackgroundEditor
                  background={pageBackground}
                  onChange={setPageBackground}
                />
              </div>

              {/* Quick Guide - desktop only */}
              <div className="hidden lg:block border-t border-slate-200 pt-6">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Quick Guide</h3>
                <ol className="space-y-1 text-xs text-slate-600">
                  <li>1. Select card size</li>
                  <li>2. Design front panel</li>
                  <li>3. Add back text</li>
                  <li>4. Customize background</li>
                  <li>5. Download PDF</li>
                </ol>
              </div>
            </div>

            {/* Preview panel - sticky on desktop */}
            <div className="sticky top-[57px] lg:top-6 z-[5] bg-slate-50 border-b border-slate-200 p-3 lg:bg-white lg:border lg:rounded-lg lg:p-6 lg:order-2 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto">
              <CardPreview
                cardSizeId={cardSize}
                image={image}
                imageScale={imageScale}
                text={text}
                textStyle={textStyle}
                customSize={customSize}
                twoPerPage={twoPerPage}
                pageBackground={pageBackground}
                frontMode={frontMode}
                frontText={frontText}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={openDialog === 'save' || openDialog === 'saveAs'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openDialog === 'saveAs' ? 'Save As' : 'Save Card'}</DialogTitle>
            <DialogDescription>Enter a name for your card.</DialogDescription>
          </DialogHeader>
          <Input
            value={dialogCardName}
            onChange={(e) => setDialogCardName(e.target.value)}
            placeholder="Card name"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveConfirm()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={openDialog === 'rename'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Card</DialogTitle>
            <DialogDescription>Enter a new name for your card.</DialogDescription>
          </DialogHeader>
          <Input
            value={dialogCardName}
            onChange={(e) => setDialogCardName(e.target.value)}
            placeholder="Card name"
            onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
            <Button onClick={handleRenameConfirm}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Dialog */}
      <Dialog open={openDialog === 'open'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Open Card</DialogTitle>
            <DialogDescription>Select a saved card to open.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto">
            {savedCards.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No saved cards yet.</p>
            ) : (
              <div className="space-y-1">
                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-100 group"
                  >
                    <button
                      className="flex-1 text-left"
                      onClick={() => handleOpenCard(card.id)}
                    >
                      <div className="font-medium text-sm">{card.name}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(card.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(card)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog === 'delete'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{cardToDelete?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF generation target - positioned off-screen but rendered */}
      <div
        ref={printRef}
        className="fixed no-print"
        style={{
          left: '-9999px',
          top: '-9999px',
          width: '297mm',
          height: '210mm',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <CardPrintView
          cardSizeId={cardSize}
          image={image}
          imageScale={imageScale}
          text={text}
          textStyle={textStyle}
          customSize={customSize}
          forPdf={true}
          twoPerPage={twoPerPage}
          pageBackground={pageBackground}
          frontMode={frontMode}
          frontText={frontText}
        />
      </div>

      {/* Print version for browser print */}
      <CardPrintView
        cardSizeId={cardSize}
        image={image}
        imageScale={imageScale}
        text={text}
        textStyle={textStyle}
        customSize={customSize}
        twoPerPage={twoPerPage}
        pageBackground={pageBackground}
        frontMode={frontMode}
        frontText={frontText}
      />
    </>
  )
}
