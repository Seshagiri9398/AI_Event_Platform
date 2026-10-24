
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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
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
          <p className="text-red-400">{error}</p>
        )}

        {!loading && !error && events.length === 0 && (
          <p className="text-slate-400">
            You haven't registered for any events yet.
          </p>
        )}

        {!loading && !error && events.length > 0 && (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.event_id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-6"
              >
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="mt-3 text-slate-400">{event.location}</p>
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
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export default MyRegistrations
