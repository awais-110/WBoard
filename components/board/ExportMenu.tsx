'use client'

import { useState } from 'react'
import { exportAsPng, exportAsSvg } from '@/lib/fabric/export'
import toast from 'react-hot-toast'
import { Download, FileJson } from 'lucide-react'
import type { fabric } from 'fabric'

interface ExportMenuProps {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
  boardTitle: string
  onClose: () => void
}

/**
 * Export options menu for canvas (PNG, SVG).
 */
export default function ExportMenu({ fabricRef, boardTitle, onClose }: ExportMenuProps) {
  const [loading, setLoading] = useState(false)

  async function handleExportPng() {
    if (!fabricRef.current) {
      toast.error('Canvas not ready')
      return
    }
    try {
      setLoading(true)
      exportAsPng(fabricRef.current, boardTitle)
      toast.success('Downloaded PNG')
      onClose()
    } catch {
      toast.error('Failed to export PNG')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportSvg() {
    if (!fabricRef.current) {
      toast.error('Canvas not ready')
      return
    }
    try {
      setLoading(true)
      const svg = exportAsSvg(fabricRef.current)
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${boardTitle}.svg`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded SVG')
      onClose()
    } catch {
      toast.error('Failed to export SVG')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportJson() {
    if (!fabricRef.current) {
      toast.error('Canvas not ready')
      return
    }
    try {
      setLoading(true)
      const json = JSON.stringify(fabricRef.current.toJSON(), null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${boardTitle}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded JSON')
      onClose()
    } catch {
      toast.error('Failed to export JSON')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-white shadow-2xl transition-all">
        <h2 className="mb-4 text-lg font-semibold">Export Board</h2>
        <div className="space-y-2">
          <button
            onClick={handleExportPng}
            disabled={loading}
            className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-4 text-sm font-medium text-white/75 hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50"
          >
            <Download size={16} />
            Export as PNG
          </button>
          <button
            onClick={handleExportSvg}
            disabled={loading}
            className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-4 text-sm font-medium text-white/75 hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50"
          >
            <Download size={16} />
            Export as SVG
          </button>
          <button
            onClick={handleExportJson}
            disabled={loading}
            className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-4 text-sm font-medium text-white/75 hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50"
          >
            <FileJson size={16} />
            Export as JSON
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 h-9 w-full rounded-lg bg-[#2a2a2a] px-4 text-sm font-medium text-white/75 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  )
}
