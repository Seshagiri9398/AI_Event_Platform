
import { useEffect, useState } from 'react'
import api from './api/axios'

interface Event {
  event_id: number
  title: string
  description: string
  date: string
  location: string
  capacity: number
  organizer_id: number
  status: string
}

function App() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Search events by title or location
  const filteredEvents = events.filter((event) =>
    `${event.title} ${event.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  // Fetch events from FastAPI
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get<Event[]>('/events')
        setEvents(response.data)
      } catch {
        setError('Unable to load events. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-5 sm:px-8">
        <h1 className="text-2xl font-bold text-indigo-400">
          EventHub
        </h1>

        <span className="text-slate-300">
          Discover events
        </span>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page heading */}
        <h2 className="text-4xl font-bold">
          Explore Events
        </h2>

        <p className="mt-3 text-slate-400">
          Discover events and connect with your community.
        </p>

        {/* Search input */}
        <input
          type="text"
          placeholder="Search events by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
        />

        {/* Loading state */}
        {loading && (
          <p className="mt-8 text-slate-300">
            Loading events...
          </p>
        )}

        {/* Error state */}
        {!loading && error && (
          <p className="mt-8 text-red-400">
            {error}
          </p>
        )}

        {/* No events in database */}
        {!loading && !error && events.length === 0 && (
          <p className="mt-8 text-slate-400">
            No events available yet.
          </p>
        )}

        {/* Event cards */}
        {!loading && !error && events.length > 0 && (
          <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.length === 0 ? (
              <p className="text-slate-400">
                No events match your search.
              </p>
            ) : (
              filteredEvents.map((event) => (
                <article
                  key={event.event_id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-indigo-500"
                >
                  {/* Event title and status */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold">
                      {event.title}
                    </h3>

                    <span className="shrink-0 rounded-full bg-indigo-950 px-3 py-1 text-xs text-indigo-300">
                      {event.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-slate-400">
                    {event.description}
                  </p>

                  {/* Event details */}
                  <div className="mt-5 space-y-3 text-sm text-slate-300">
                    <p>📍 {event.location}</p>

                    <p>
                      📅{' '}
                      {new Date(event.date).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>

                    <p>
                      Capacity: {event.capacity}
                    </p>

                    <p>
                      Organizer ID: {event.organizer_id}
                    </p>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
