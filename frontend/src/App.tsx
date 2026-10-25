
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
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

interface Registration {
  event_id: number
}

interface TokenPayload {
  user_id: number
  role: string
}

function App() {
  const location = useLocation()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([])

  // Read the current user's ID from the JWT.
  const token = localStorage.getItem('access_token')

  let currentUserId: number | null = null

  if (token) {
    try {
      currentUserId = jwtDecode<TokenPayload>(token).user_id
    } catch {
      currentUserId = null
    }
  }

  // Search across ALL events.
  const filteredEvents = events.filter((event) =>
    `${event.title} ${event.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  // Fetch all events, not just registered events.
  const fetchEvents = useCallback(async () => {
    try {
      setError('')
      const response = await api.get<Event[]>('/events')
      setEvents(response.data)
    } catch {
      setError('Unable to load events. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch only the current user's registrations.
  const fetchMyRegistrations = useCallback(async () => {
    const currentToken = localStorage.getItem('access_token')

    if (!currentToken) {
      setRegisteredEvents([])
      return
    }

    try {
      const response = await api.get<Registration[]>(
        '/my-registrations',
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      )

      setRegisteredEvents(
        response.data.map((registration) => registration.event_id)
      )
    } catch (error) {
      console.error('Unable to load registrations:', error)
    }
  }, [])

  // Refresh data when the user navigates between pages.
  useEffect(() => {
    setLoading(true)
    fetchEvents()
    fetchMyRegistrations()
  }, [location.key, fetchEvents, fetchMyRegistrations])

  // Register for an event.
  const handleRegister = async (eventId: number) => {
    const currentToken = localStorage.getItem('access_token')

    if (!currentToken) {
      window.location.href = '/login'
      return
    }

    try {
      await api.post(
        `/events/${eventId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      )

      setRegisteredEvents((previous) =>
        previous.includes(eventId)
          ? previous
          : [...previous, eventId]
      )
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

  // Delete an event owned by the current user.
  const handleDelete = async (eventId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this event?'
    )

    if (!confirmed) return

    const currentToken = localStorage.getItem('access_token')

    if (!currentToken) {
      window.location.href = '/login'
      return
    }

    try {
      await api.delete(`/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      setEvents((previous) =>
        previous.filter((event) => event.event_id !== eventId)
      )

      setRegisteredEvents((previous) =>
        previous.filter((id) => id !== eventId)
      )
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
        alert('Unable to delete event. Please try again.')
      }
    }
  }

  // Log out the current user.
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setRegisteredEvents([])
    window.location.href = '/login'
  }

  const isLoggedIn = Boolean(token)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5 sm:px-8">
        <h1 className="text-2xl font-bold text-indigo-400">
          EventHub
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/"
            className="text-slate-300 hover:text-white"
          >
            Discover Events
          </Link>

          <Link
            to="/create-event"
            className="text-slate-300 hover:text-white"
          >
            Create Event
          </Link>

          <Link
            to="/my-registrations"
            className="text-slate-300 hover:text-white"
          >
            My Registrations
          </Link>

          {isLoggedIn ? (
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

      {/* All events */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-4xl font-bold">
          Explore Events
        </h2>

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
          <p className="mt-8 text-slate-300">
            Loading events...
          </p>
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
              filteredEvents.map((event) => {
                const isRegistered = registeredEvents.includes(
                  event.event_id
                )

                const isOrganizer =
                  event.organizer_id === currentUserId

                return (
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
                        {new Date(event.date).toLocaleString(
                          'en-IN',
                          {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }
                        )}
                      </p>

                      <p>Capacity: {event.capacity}</p>

                      <p>Organizer ID: {event.organizer_id}</p>
                    </div>

                    {/* Edit and Delete only for the organizer */}
                    {isOrganizer && (
                      <div className="mt-5 flex gap-3">
                        <Link
                          to={`/edit-event/${event.event_id}`}
                          className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-center font-medium transition hover:bg-amber-500"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() =>
                            handleDelete(event.event_id)
                          }
                          className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium transition hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Registration button */}
                    <button
                      onClick={() =>
                        handleRegister(event.event_id)
                      }
                      disabled={isRegistered}
                      className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold transition ${
                        isRegistered
                          ? 'cursor-not-allowed bg-emerald-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      {isRegistered
                        ? 'Registered ✓'
                        : 'Register for Event'}
                    </button>
                  </article>
                )
              })
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
