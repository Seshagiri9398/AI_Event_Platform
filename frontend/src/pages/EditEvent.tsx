
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

function EditEvent() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEvent = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await api.get<Event[]>('/events')
        const event = response.data.find(
          (item) => item.event_id === Number(eventId)
        )

        if (!event) {
          setError('Event not found.')
          return
        }

        setTitle(event.title)
        setDescription(event.description)
        setLocation(event.location)
        setCapacity(String(event.capacity))

        const eventDate = new Date(event.date)
        const localDate = new Date(
          eventDate.getTime() - eventDate.getTimezoneOffset() * 60000
        )
        setDate(localDate.toISOString().slice(0, 16))
      } catch {
        setError('Unable to load event details.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, navigate])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const token = localStorage.getItem('access_token')

    if (!token || !eventId) {
      navigate('/login')
      return
    }

    try {
      setSaving(true)

      await api.put(
        `/events/${eventId}`,
        {
          title: title.trim(),
          description: description.trim(),
          date: new Date(date).toISOString(),
          location: location.trim(),
          capacity: Number(capacity),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      navigate('/')
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'detail' in err.response.data
      ) {
        setError(String(err.response.data.detail))
      } else {
        setError('Unable to update event. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Loading event details...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit Event</h1>
          <Link
            to="/"
            className="rounded-lg bg-slate-800 px-4 py-2 hover:bg-slate-700"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-950 p-3 text-red-300">
            {error}
          </p>
        )}

        {!error || title ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                Event Title
              </label>
              <input
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Date and Time
              </label>
              <input
                required
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Location
              </label>
              <input
                required
                maxLength={200}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Capacity
              </label>
              <input
                required
                type="number"
                min={1}
                step={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </form>
        ) : null}
      </div>
    </main>
  )
}

export default EditEvent
