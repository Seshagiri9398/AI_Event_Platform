
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

interface Community {
  community_id: number
  name: string
  description: string
  creator_id: number
  created_at: string
}

function Communities() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('access_token')

  // Fetch all communities
  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get<Community[]>('/communities')

      setCommunities(response.data)
    } catch {
      setError('Unable to load communities. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  // Create a new community
  const handleCreateCommunity = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setError('')
    setMessage('')

    if (!token) {
      setError('Please login to create a community.')
      return
    }

    if (name.trim().length < 2) {
      setError('Community name must contain at least 2 characters.')
      return
    }

    if (!description.trim()) {
      setError('Please enter a community description.')
      return
    }

    try {
      setCreating(true)

      const response = await api.post<Community>(
        '/communities',
        {
          name: name.trim(),
          description: description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setCommunities((previous) => [response.data, ...previous])

      setName('')
      setDescription('')
      setShowForm(false)

      setMessage('Community created successfully!')
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            detail?: string
          }
        }
      }

      setError(
        error.response?.data?.detail ||
        'Unable to create community. Please try again.'
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              ← Back to Events
            </Link>

            <h1 className="mt-4 text-3xl font-bold">
              Explore Communities
            </h1>

            <p className="mt-2 text-slate-400">
              Find people who share your interests and connect with them.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm((previous) => !previous)
              setError('')
              setMessage('')
            }}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold transition hover:bg-indigo-500"
          >
            {showForm ? 'Close Form' : '+ Create Community'}
          </button>
        </div>

        {/* Success Message */}
        {message && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-green-800 bg-green-950/40 p-4 text-green-300"
          >
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300"
          >
            {error}
          </div>
        )}

        {/* Create Community Form */}
        {showForm && (
          <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-6 text-xl font-bold">
              Create a New Community
            </h2>

            {!token && (
              <p className="mb-5 text-sm text-amber-300">
                Please{' '}
                <Link
                  to="/login"
                  className="font-semibold underline"
                >
                  login
                </Link>{' '}
                before creating a community.
              </p>
            )}

            <form
              onSubmit={handleCreateCommunity}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="community-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Community Name
                </label>

                <input
                  id="community-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: Python Developers"
                  minLength={2}
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="community-description"
                  className="mb-2 block text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="community-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your community is about..."
                  rows={4}
                  required
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !token}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {creating ? 'Creating...' : 'Create Community'}
              </button>
            </form>
          </div>
        )}

        {/* Communities List */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            All Communities
          </h2>

          <span className="text-sm text-slate-400">
            {communities.length} communities
          </span>
        </div>

        {loading && (
          <p className="py-10 text-center text-slate-400">
            Loading communities...
          </p>
        )}

        {!loading && error && communities.length === 0 && (
          <div className="py-8 text-center">
            <button
              onClick={fetchCommunities}
              className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold hover:bg-indigo-500"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && communities.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h3 className="text-xl font-semibold">
              No communities yet
            </h3>

            <p className="mt-2 text-slate-400">
              Be the first person to create a community!
            </p>
          </div>
        )}

        {!loading && communities.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => (
              <article
                key={community.community_id}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-indigo-500"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-xl font-bold text-indigo-400">
                  {community.name.charAt(0).toUpperCase()}
                </div>

                <h3 className="text-xl font-bold">
                  {community.name}
                </h3>

                <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                  {community.description}
                </p>

                <div className="mt-6 border-t border-slate-800 pt-4">
                  <p className="text-xs text-slate-500">
                    Created by user #{community.creator_id}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(community.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}

export default Communities
