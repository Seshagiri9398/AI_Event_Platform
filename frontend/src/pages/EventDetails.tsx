
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

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

function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get<Event[]>('/events')

        const foundEvent = response.data.find(
          (item) => item.event_id === Number(eventId)
        )

        if (!foundEvent) {
          setError('Event not found.')
          return
        }

        setEvent(foundEvent)
      } catch {
        setError('Unable to load event details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const handleRegister = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      setRegistering(true)
      setMessage('')

      await api.post(
        `/events/${eventId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setMessage('Successfully registered for this event!')
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const response = (
          err as {
            response?: {
              data?: { detail?: string }
            }
          }
        ).response

        setMessage(
          response?.data?.detail || 'Registration failed. Please try again.'
        )
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading event details...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
        <p className="text-lg text-red-600">
          {error || 'Event not found.'}
        </p>
        <Link
          to="/"
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Back to Events
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-block text-blue-600 hover:underline"
        >
          &larr; Back to Events
        </Link>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-blue-700 px-6 py-10 text-white sm:px-10">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-blue-100">
              Event #{event.event_id}
            </p>

            <h1 className="text-3xl font-bold sm:text-4xl">
              {event.title}
            </h1>

            <p className="mt-3 text-blue-100">
              {event.location}
            </p>
          </div>

          <div className="space-y-6 p-6 sm:p-10">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                About This Event
              </h2>
              <p className="whitespace-pre-wrap leading-7 text-gray-600">
                {event.description || 'No description available.'}
              </p>
            </section>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(event.date).toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Location</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {event.location}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {event.capacity} participants
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Organizer ID</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {event.organizer_id}
                </p>
              </div>
            </div>

            {event.status && (
              <p className="text-sm text-gray-600">
                Status:{' '}
                <span className="font-medium text-gray-900">
                  {event.status}
                </span>
              </p>
            )}

            {message && (
              <p
                role="status"
                className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
              >
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={handleRegister}
              disabled={registering}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registering ? 'Registering...' : 'Register for Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetails
