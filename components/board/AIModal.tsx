'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'

interface AIModalProps {
  boardId: string
  onClose: () => void
}

export default function AIModal({ boardId, onClose }: AIModalProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      // Skeleton: call a server endpoint (not implemented)
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, prompt }),
      })
      if (!res.ok) throw new Error('AI service unavailable')
      const data = await res.json()
      setResult(data.output ?? 'No output')
    } catch (err: any) {
      toast.error(err?.message ?? 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-white shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">AI Assistant</h3>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-white/55 hover:bg-[#2a2a2a] hover:text-white">Close</button>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what you want (e.g. 'Create a mind map about product launch')" className="mb-3 h-28 w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30" />
        <div className="flex items-center gap-2">
          <button onClick={handleGenerate} disabled={loading} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Generate</button>
          <button onClick={() => setPrompt('')} className="h-9 rounded-lg border border-[#2a2a2a] px-3 text-sm font-medium text-white/70 hover:bg-[#2a2a2a] hover:text-white">Clear</button>
        </div>
        {result && (
          <div className="mt-3 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-3">
            <div className="mb-1 text-sm text-white/50">AI Output</div>
            <pre className="whitespace-pre-wrap text-xs text-white/75">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
