
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  const [events, setEvents] = useState<Event[]>([])
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('access_token')

  let currentUserId: number | null = null

  if (token) {
    try {
      const decoded = jwtDecode<TokenPayload>(token)
      currentUserId = decoded.user_id
    } catch {
      currentUserId = null
    }
  }

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get<Event[]>('/events')
      setEvents(response.data)
    } catch {
      setError('Unable to load events. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMyRegistrations = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token')

    if (!accessToken) {
      setRegisteredEvents([])
      return
    }

    try {
      const response = await api.get<Registration[]>(
        '/my-registrations',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      setRegisteredEvents(
        response.data.map((registration) => registration.event_id)
      )
    } catch {
      setRegisteredEvents([])
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    fetchMyRegistrations()
  }, [location.key, fetchEvents, fetchMyRegistrations])

  const filteredEvents = events.filter((event) => {
    const searchText = search.toLowerCase().trim()

    return (
      event.title.toLowerCase().includes(searchText) ||
      event.location.toLowerCase().includes(searchText)
    )
  })

  const handleRegister = async (eventId: number) => {
    const accessToken = localStorage.getItem('access_token')

    if (!accessToken) {
      navigate('/login')
      return
    }

    try {
      setMessage('')

      await api.post(
        `/events/${eventId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      setRegisteredEvents((previous) =>
        previous.includes(eventId)
          ? previous
          : [...previous, eventId]
      )

      setMessage('Successfully registered for the event!')
      await fetchMyRegistrations()
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const response = (
          err as {
            response?: {
              data?: {
                detail?: string
              }
            }
          }
        ).response

        setMessage(
          response?.data?.detail ||
            'Registration failed. Please try again.'
        )
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    }
  }

  const handleDelete = async (eventId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this event?'
    )

    if (!confirmed) return

    const accessToken = localStorage.getItem('access_token')

    if (!accessToken) {
      navigate('/login')
      return
    }

    try {
      setMessage('')

      await api.delete(`/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      setEvents((previous) =>
        previous.filter((event) => event.event_id !== eventId)
      )

      setRegisteredEvents((previous) =>
        previous.filter((id) => id !== eventId)
      )

      setMessage('Event deleted successfully!')
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const response = (
          err as {
            response?: {
              data?: {
                detail?: string
              }
            }
          }
        ).response

        setMessage(
          response?.data?.detail ||
            'Unable to delete event. Please try again.'
        )
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setRegisteredEvents([])
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <Link to="/" className="text-2xl font-bold">
            EventHub
          </Link>

          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/" className="hover:text-blue-200">
              Discover Events
            </Link>

            {token && (
              <>
                <Link
                  to="/create-event"
                  className="hover:text-blue-200"
                >
                  Create Event
                </Link>

                <Link
                  to="/my-registrations"
                  className="hover:text-blue-200"
                >
                  My Registrations
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Logout
                </button>
              </>
            )}

            {!token && (
              <Link
                to="/login"
                className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-100"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Discover Events
          </h1>

          <p className="mt-2 text-gray-600">
            Find events, explore details, and register for the ones
            you love.
          </p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by event title or location..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {message && (
          <div
            role="status"
            className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-700"
          >
            {message}
          </div>
        )}

        {loading && (
          <p className="py-10 text-center text-gray-600">
            Loading events...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-red-50 p-5 text-red-700">
            <p>{error}</p>

            <button
              onClick={fetchEvents}
              className="mt-3 font-semibold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              No events found
            </h2>

            <p className="mt-2 text-gray-500">
              Try another search or create a new event.
            </p>
          </div>
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => {
              const isOrganizer =
                currentUserId !== null &&
                event.organizer_id === currentUserId

              const isRegistered = registeredEvents.includes(
                event.event_id
              )

              return (
                <article
                  key={event.event_id}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      {event.title}
                    </h2>

                    {isRegistered && (
                      <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Registered
                      </span>
                    )}
                  </div>

                  <p className="mb-4 line-clamp-3 text-gray-600">
                    {event.description || 'No description available.'}
                  </p>

                  <div className="mb-5 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">Date:</span>{' '}
                      {new Date(event.date).toLocaleString()}
                    </p>

                    <p>
                      <span className="font-semibold">Location:</span>{' '}
                      {event.location}
                    </p>

                    <p>
                      <span className="font-semibold">Capacity:</span>{' '}
                      {event.capacity} participants
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    {/* Everyone can view event details */}
                    <Link
                      to={`/events/${event.event_id}`}
                      className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      View Details
                    </Link>

                    {/* Only this event's organizer can edit or delete */}
                    {isOrganizer && (
                      <>
                        <Link
                          to={`/edit-event/${event.event_id}`}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => handleDelete(event.event_id)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* Registration is available to logged-in users */}
                    <button
                      onClick={() => handleRegister(event.event_id)}
                      disabled={isRegistered}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {isRegistered
                        ? 'Already Registered'
                        : 'Register'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
