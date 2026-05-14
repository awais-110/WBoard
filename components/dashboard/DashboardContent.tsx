'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import BoardGrid from './BoardGrid'
import NewBoardModal from './NewBoardModal'
import { Filter, Plus, Search, Sparkles, Users } from 'lucide-react'
import type { DashboardBoard } from '@/types/board'

interface DashboardContentProps {
  boards: DashboardBoard[]
  sharedBoards?: DashboardBoard[]
}

/**
 * Dashboard content with board grid and new board modal.
 */
export default function DashboardContent({ boards, sharedBoards = [] }: DashboardContentProps) {
  const [showNewModal, setShowNewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [accessFilter, setAccessFilter] = useState<'all' | 'owned' | 'shared'>('all')
  const totalBoards = boards.length + sharedBoards.length
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const matchesQuery = useMemo(
    () => (board: DashboardBoard) =>
      !normalizedQuery || board.title.toLowerCase().includes(normalizedQuery),
    [normalizedQuery]
  )

  const visibleOwnedBoards = boards.filter(
    (board) => matchesQuery(board) && (accessFilter === 'all' || accessFilter === 'owned')
  )
  const visibleSharedBoards = sharedBoards.filter(
    (board) => matchesQuery(board) && (accessFilter === 'all' || accessFilter === 'shared')
  )

  const recentBoards = [...boards, ...sharedBoards]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#0D0D0D]">
      <header className="border-b border-[#0D0D0D]/10 bg-[#F7F5F0]">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-[#0ABFBC]">
                <Sparkles size={14} />
                Workspace
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#0D0D0D] md:text-3xl">
                  Your workspace
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#0D0D0D]/60">
                  Keep active work visible, open a board fast, and create polished spaces for every idea in motion.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="hidden rounded-2xl border border-[#0D0D0D]/10 bg-white/65 px-4 py-3 shadow-[0_14px_34px_rgba(13,13,13,0.05)] sm:block">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0ABFBC]">Boards</p>
                <p className="mt-1 text-2xl font-bold text-[#0D0D0D]">
                  {totalBoards}
                </p>
              </div>
              <div className="hidden rounded-2xl border border-[#0D0D0D]/10 bg-white/65 px-4 py-3 shadow-[0_14px_34px_rgba(13,13,13,0.05)] sm:block">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0ABFBC]">Shared</p>
                <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#0D0D0D]">
                  <Users size={16} />
                  {sharedBoards.length}
                </p>
              </div>
              <div className="inline-flex flex-wrap gap-3">
                <button
                  onClick={() => setShowNewModal(true)}
                  className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(13,13,13,0.16)] transition hover:-translate-y-0.5 hover:bg-[#0ABFBC] sm:w-auto"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition duration-300" />
                  New Board
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="group rounded-[24px] border border-[#0D0D0D]/10 bg-white/65 p-4 shadow-[0_18px_45px_rgba(13,13,13,0.06)]">
              <div className="flex items-center gap-3 rounded-full border border-[#0D0D0D]/10 bg-[#F7F5F0] px-4 py-3">
                <Search size={18} className="text-[#0ABFBC]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search boards..."
                  className="w-full bg-transparent text-sm text-[#0D0D0D] outline-none placeholder:text-[#0D0D0D]/35 focus:outline-none"
                />
              </div>
            </div>
            <div className="rounded-[24px] border border-[#0D0D0D]/10 bg-white/65 p-4 shadow-[0_18px_45px_rgba(13,13,13,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[#0D0D0D]">
                  <Filter size={18} />
                  <span className="text-sm font-bold">Filter</span>
                </div>
                <span className="rounded-full border border-[#0ABFBC]/25 bg-[#0ABFBC]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#0ABFBC]">
                  {accessFilter}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['all', 'owned', 'shared'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAccessFilter(option)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${accessFilter === option ? 'border-[#0D0D0D] bg-[#0D0D0D] text-white shadow-md shadow-black/10' : 'border-[#0D0D0D]/10 bg-[#F7F5F0] text-[#0D0D0D]/70 hover:border-[#0ABFBC]/50 hover:text-[#0ABFBC]'}`}
                  >
                    {option === 'all' ? 'All' : option === 'owned' ? 'Owned' : 'Shared'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-[24px] border border-[#0D0D0D]/10 bg-white/55 p-6 shadow-[0_18px_45px_rgba(13,13,13,0.05)]">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-[#0D0D0D]">Recent activity</p>
                <p className="mt-1 text-sm text-[#0D0D0D]/60">Your most recently opened or updated boards.</p>
              </div>
              <span className="rounded-full border border-[#0ABFBC]/25 bg-[#0ABFBC]/10 px-3 py-1 text-xs font-bold text-[#0ABFBC]">
                {recentBoards.length} updates
              </span>
            </div>

            <div className="space-y-3">
              {recentBoards.length > 0 ? (
                recentBoards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/dashboard/board/${board.id}`}
                    className="group block rounded-2xl border border-[#0D0D0D]/10 bg-[#F7F5F0]/70 p-4 shadow-sm transition hover:border-[#0ABFBC]/40 hover:bg-white"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#0D0D0D] group-hover:text-[#0ABFBC]">{board.title}</p>
                        <p className="mt-1 text-xs text-[#0D0D0D]/55">
                          {board.access === 'owned' ? 'Owned by you' : `Shared as ${board.role ?? 'editor'}`} · Updated {new Date(board.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition ${board.access === 'owned' ? 'border-[#0ABFBC]/30 bg-[#0ABFBC]/10 text-[#0ABFBC]' : 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#9A5C00]'}`}>
                        {board.access === 'owned' ? 'Owned' : 'Shared'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#0D0D0D]/15 bg-[#F7F5F0]/70 p-4 text-sm text-[#0D0D0D]/55">
                  No recent boards yet. Start a new board or open one from your workspace.
                </div>
              )}
            </div>
          </section>

          <div className="mt-6 space-y-8">
            <section>
              <SectionHeader
                title="Owned by me"
                description="Boards you created and can manage."
                count={visibleOwnedBoards.length}
              />
              <BoardGrid boards={visibleOwnedBoards} emptyTitle={totalBoards ? 'No owned boards match your search' : 'No boards yet'} emptyDescription={totalBoards ? 'Try a different search or filter.' : 'Create your first whiteboard and start sketching ideas with your team.'} />
            </section>

            {visibleSharedBoards.length > 0 && (
              <section>
                <SectionHeader
                  title="Shared with me"
                  description="Boards where another workspace member added you as a collaborator."
                  count={visibleSharedBoards.length}
                />
                <BoardGrid boards={visibleSharedBoards} allowDelete={false} emptyTitle="No shared boards match your search" emptyDescription="Try a different search or filter." />
              </section>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      {showNewModal && <NewBoardModal onClose={() => setShowNewModal(false)} />}
    </div>
  )
}

function SectionHeader({ title, description, count }: { title: string; description: string; count: number }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-3xl font-semibold text-[#0D0D0D]">{title}</h2>
        <p className="mt-1 text-sm text-[#0D0D0D]/55">{description}</p>
      </div>
      <span className="shrink-0 rounded-full border border-[#0D0D0D]/10 bg-white/60 px-3 py-1.5 text-xs font-bold text-[#0D0D0D]/70 shadow-sm sm:px-4">
        {count} board{count !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
