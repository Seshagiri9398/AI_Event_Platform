
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

interface RegisteredEvent {
  event_id: number
  title: string
  date: string
  location: string
  status: string
}

function MyRegistrations() {
  const [events, setEvents] = useState<RegisteredEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchRegistrations = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setError('Please log in to view your registrations.')
        setLoading(false)
        return
      }

      try {
        const response = await api.get<RegisteredEvent[]>(
          '/my-registrations',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setEvents(response.data)
      } catch {
        setError('Unable to load your registrations.')
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [])

  const handleCancel = async (event: RegisteredEvent) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your registration for "${event.title}"?`
    )

    if (!confirmed) {
      return
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      setMessage('Please log in to cancel your registration.')
      return
    }

    try {
      setCancellingId(event.event_id)
      setMessage('')
      setError('')

      await api.delete(
        `/events/${event.event_id}/register`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setEvents((previousEvents) =>
        previousEvents.filter(
          (item) => item.event_id !== event.event_id
        )
      )

      setMessage(
        `Your registration for "${event.title}" has been cancelled successfully.`
      )
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (
          err as {
            response?: {
              data?: { detail?: string }
            }
          }
        ).response

        setError(
          response?.data?.detail ||
            'Unable to cancel registration. Please try again.'
        )
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">My Registrations</h1>

          <Link
            to="/"
            className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
          >
            Discover Events
          </Link>
        </div>

        {loading && <p>Loading your registrations...</p>}

        {!loading && error && (
          <p role="alert" className="mb-4 text-red-400">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="mb-4 text-emerald-400">
            {message}
          </p>
        )}

        {!loading && !error && events.length === 0 && (
          <p className="text-slate-400">
            You haven't registered for any events yet.
          </p>
        )}

        {!loading && events.length > 0 && (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.event_id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-6"
              >
                <h2 className="text-xl font-semibold">
                  {event.title}
                </h2>

                <p className="mt-3 text-slate-400">
                  {event.location}
                </p>

                <p className="mt-2 text-slate-300">
                  {new Date(event.date).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>

                <p className="mt-4 text-emerald-400">
                  Registered ✓
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Event status: {event.status}
                </p>

                <button
                  type="button"
                  onClick={() => handleCancel(event)}
                  disabled={cancellingId !== null}
                  className="mt-5 w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancellingId === event.event_id
                    ? 'Cancelling...'
                    : 'Cancel Registration'}
                </button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export default MyRegistrations
