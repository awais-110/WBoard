import type { fabric } from 'fabric'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Export canvas as PNG — triggers browser download.
 */
export function exportAsPng(canvas: fabric.Canvas, filename = 'whiteboard'): void {
  const dataUrl = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2, // 2x for retina
  })
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = dataUrl
  link.click()
}

/**
 * Export canvas as SVG string.
 */
export function exportAsSvg(canvas: fabric.Canvas): string {
  return canvas.toSVG()
}

/**
 * Generate thumbnail from canvas for board preview.
 */
export async function generateThumbnail(
  canvas: fabric.Canvas,
  boardId: string,
  supabaseClient: SupabaseClient
): Promise<string | null> {
  try {
    const thumbnailUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.6, multiplier: 0.3 })
    const blob = await (await fetch(thumbnailUrl)).blob()
    const file = new File([blob], `${boardId}.jpg`, { type: 'image/jpeg' })

    const { error } = await supabaseClient.storage
      .from('thumbnails')
      .upload(`${boardId}.jpg`, file, { upsert: true })

    if (error) {
      console.error('[generateThumbnail]', error.message)
      return null
    }

    const { data: urlData } = supabaseClient.storage
      .from('thumbnails')
      .getPublicUrl(`${boardId}.jpg`)

    return urlData.publicUrl
  } catch (err) {
    console.error('[generateThumbnail] Error:', err)
    return null
  }
}
