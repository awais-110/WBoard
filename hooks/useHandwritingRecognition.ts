'use client'

import { useCallback, useState } from 'react'
import { fabric } from 'fabric'
// Load Tesseract dynamically on the client to avoid server-side bundling that
// pulls in native deps like `canvas` which break on Windows/SSR.
// We import inside the recognize function below.

export interface HandwritingRecognitionInput {
  canvas: fabric.Canvas
  objects: fabric.Object[]
  padding?: number
  language?: string
}

export interface HandwritingRecognitionResult {
  text: string
  left: number
  top: number
  width: number
  height: number
}

interface BoundingBox {
  left: number
  top: number
  width: number
  height: number
}

const DEFAULT_PADDING = 16

export function useHandwritingRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false)

  const recognize = useCallback(async ({
    canvas,
    objects,
    padding = DEFAULT_PADDING,
    language = 'eng',
  }: HandwritingRecognitionInput): Promise<HandwritingRecognitionResult | null> => {
    const boundingBox = getUnionBoundingBox(objects)
    if (!boundingBox) return null

    const crop = expandBoundingBox(boundingBox, canvas, padding)
    setIsRecognizing(true)

    try {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        left: crop.left,
        top: crop.top,
        width: crop.width,
        height: crop.height,
        multiplier: 2,
      })

      // Dynamically import Tesseract at runtime (client-only)
      const Tesseract = (await import('tesseract.js')).default
      const result = await Tesseract.recognize(dataUrl, language)
      const text = result.data.text.trim()

      return {
        text,
        left: crop.left,
        top: crop.top,
        width: crop.width,
        height: crop.height,
      }
    } finally {
      setIsRecognizing(false)
    }
  }, [])

  return {
    recognize,
    isRecognizing,
  }
}

function getUnionBoundingBox(objects: fabric.Object[]): BoundingBox | null {
  const boxes = objects
    .map((object) => object.getBoundingRect(true, true))
    .filter((box) => box.width > 0 && box.height > 0)

  if (!boxes.length) return null

  const left = Math.min(...boxes.map((box) => box.left))
  const top = Math.min(...boxes.map((box) => box.top))
  const right = Math.max(...boxes.map((box) => box.left + box.width))
  const bottom = Math.max(...boxes.map((box) => box.top + box.height))

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  }
}

function expandBoundingBox(
  box: BoundingBox,
  canvas: fabric.Canvas,
  padding: number
): BoundingBox {
  const width = canvas.getWidth()
  const height = canvas.getHeight()

  const left = Math.max(0, box.left - padding)
  const top = Math.max(0, box.top - padding)
  const right = Math.min(width, box.left + box.width + padding)
  const bottom = Math.min(height, box.top + box.height + padding)

  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  }
}