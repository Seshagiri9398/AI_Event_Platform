
import { useEffect, useState } from 'react'
import api from './api/axios'
import { Link } from 'react-router-dom'

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
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([])

  // Search events by title or location
  const filteredEvents = events.filter((event) =>
    `${event.title} ${event.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  // Register for an event using the JWT
  const handleRegister = async (eventId: number) => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      window.location.href = '/login'
      return
    }

    try {
      await api.post(
        `/events/${eventId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setRegisteredEvents((previous) => previous.includes(eventId) ? previous : [...previous, eventId])
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'detail' in error.response.data
      ) {
        alert(String(error.response.data.detail))
      } else {
        alert('Unable to register. Please try again.')
      }
    }
  }
    // Logout the current user
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setRegisteredEvents([])
    window.location.href = '/login'
  }

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

    const fetchMyRegistrations = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) return

      try {
        const response = await api.get<{ event_id: number }[]>(
          '/my-registrations',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setRegisteredEvents(
          response.data.map((registration) => registration.event_id)
        )
      } catch (error) {
        console.error('Unable to load registrations:', error)
      }
    }

    fetchEvents()
    fetchMyRegistrations()
  }, [])


  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-5 sm:px-8">
        <h1 className="text-2xl font-bold text-indigo-400">EventHub</h1>

        <div className="flex items-center gap-5">
          <Link to="/" className="text-slate-300 hover:text-white">
            Discover Events
          </Link>

          <Link
            to="/my-registrations"
            className="text-slate-300 hover:text-white"
          >
            My Registrations
          </Link>

          {localStorage.getItem('access_token') ? (
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium transition hover:bg-red-500"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500"
            >
              Log In
            </Link>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-4xl font-bold">Explore Events</h2>

        <p className="mt-3 text-slate-400">
          Discover events and connect with your community.
        </p>

        <input
          type="text"
          placeholder="Search events by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
        />

        {loading && (
          <p className="mt-8 text-slate-300">Loading events...</p>
        )}

        {!loading && error && (
          <p className="mt-8 text-red-400">{error}</p>
        )}

        {!loading && !error && events.length === 0 && (
          <p className="mt-8 text-slate-400">
            No events available yet.
          </p>
        )}

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
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold">
                      {event.title}
                    </h3>

                    <span className="shrink-0 rounded-full bg-indigo-950 px-3 py-1 text-xs text-indigo-300">
                      {event.status}
                    </span>
                  </div>

                  <p className="mt-3 text-slate-400">
                    {event.description}
                  </p>

                  <div className="mt-5 space-y-3 text-sm text-slate-300">
                    <p>📍 {event.location}</p>

                    <p>
                      📅{' '}
                      {new Date(event.date).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>

                    <p>Capacity: {event.capacity}</p>
                    <p>Organizer ID: {event.organizer_id}</p>
                  </div>

                  {/* Register button belongs inside this event card */}
                 
                  <button
                    onClick={() => handleRegister(event.event_id)}
                    disabled={registeredEvents.includes(event.event_id)}
                    className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold transition ${
                      registeredEvents.includes(event.event_id)
                        ? 'cursor-not-allowed bg-emerald-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {registeredEvents.includes(event.event_id)
                      ? 'Registered ✓'
                      : 'Register for Event'}
                  </button>

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
