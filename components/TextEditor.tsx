'use client'

import React from 'react'
import { Bold, Italic } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Toggle } from '@/components/ui/toggle'
import { FONT_CATEGORIES, getFontsByCategory, getFontFamilyValue, loadFont } from '@/lib/fonts'

export interface TextStyle {
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
}

interface TextEditorProps {
  text: string
  textStyle: TextStyle
  onTextChange: (text: string) => void
  onStyleChange: (style: TextStyle) => void
}

const fontsByCategory = getFontsByCategory()

export default function TextEditor({
  text,
  textStyle,
  onTextChange,
  onStyleChange,
}: TextEditorProps) {
  const handleFontChange = async (fontFamily: string) => {
    // Load font dynamically
    await loadFont(fontFamily)
    onStyleChange({ ...textStyle, fontFamily: getFontFamilyValue(fontFamily) })
  }

  const handleFontSizeChange = (value: number[]) => {
    onStyleChange({ ...textStyle, fontSize: value[0] })
  }

  const handleBoldToggle = () => {
    onStyleChange({ ...textStyle, bold: !textStyle.bold })
  }

  const handleItalicToggle = () => {
    onStyleChange({ ...textStyle, italic: !textStyle.italic })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Back Text</label>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Enter your message here..."
          className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          style={{
            fontFamily: textStyle.fontFamily,
            fontWeight: textStyle.bold ? 'bold' : 'normal',
            fontStyle: textStyle.italic ? 'italic' : 'normal',
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Font Family</label>
        <Select onValueChange={handleFontChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a font">
              <span style={{ fontFamily: textStyle.fontFamily }}>
                {textStyle.fontFamily.split("'")[1] || 'Select a font'}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {FONT_CATEGORIES.map((category) => (
              <SelectGroup key={category.id}>
                <SelectLabel className="text-xs text-slate-500 uppercase tracking-wider">
                  {category.label}
                </SelectLabel>
                {fontsByCategory[category.id]?.map((font) => (
                  <SelectItem
                    key={font.family}
                    value={font.family}
                    style={{ fontFamily: getFontFamilyValue(font.family) }}
                  >
                    {font.family}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Font Size</label>
          <span className="text-sm text-slate-500">{textStyle.fontSize}pt</span>
        </div>
        <Slider
          value={[textStyle.fontSize]}
          onValueChange={handleFontSizeChange}
          min={12}
          max={48}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Style</label>
        <div className="flex gap-2">
          <Toggle
            variant="outline"
            pressed={textStyle.bold}
            onPressedChange={handleBoldToggle}
            aria-label="Toggle bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            variant="outline"
            pressed={textStyle.italic}
            onPressedChange={handleItalicToggle}
            aria-label="Toggle italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
    </div>
  )
}
