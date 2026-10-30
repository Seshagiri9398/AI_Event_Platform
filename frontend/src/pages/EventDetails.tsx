
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
  registered_count: number
  available_seats: number
}

interface RegisteredEvent {
  event_id: number
}

interface Review {
  review_id: number
  user_id: number
  event_id: number
  rating: number
  comment: string | null
  created_at: string
}

function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [message, setMessage] = useState('')

  // Review states
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [hasReviewed, setHasReviewed] = useState(false)

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0

  const fetchReviews = async () => {
    const response = await api.get<Review[]>(
      `/events/${eventId}/reviews`
    )

    setReviews(response.data)

    const token = localStorage.getItem('access_token')

    if (token) {
      try {
        const currentUserResponse = await api.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const alreadyReviewed = response.data.some(
          (review) => review.user_id === currentUserResponse.data.user_id
        )

        setHasReviewed(alreadyReviewed)
      } catch {
        // Review list remains available even if user details cannot load.
      }
    }
  }

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

        const token = localStorage.getItem('access_token')

        if (token) {
          try {
            const registrationResponse = await api.get<RegisteredEvent[]>(
              '/my-registrations',
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )

            const alreadyRegistered = registrationResponse.data.some(
              (item) => item.event_id === Number(eventId)
            )

            setIsRegistered(alreadyRegistered)
          } catch {
            setIsRegistered(false)
          }
        } else {
          setIsRegistered(false)
        }

        try {
          await fetchReviews()
        } catch {
          setReviewMessage('Unable to load reviews.')
        }
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

      setIsRegistered(true)
      setMessage('Successfully registered for this event!')

      const response = await api.get<Event[]>('/events')

      const updatedEvent = response.data.find(
        (item) => item.event_id === Number(eventId)
      )

      if (updatedEvent) {
        setEvent(updatedEvent)
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
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

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      setSubmittingReview(true)
      setReviewMessage('')

      await api.post(
        `/events/${eventId}/reviews`,
        {
          rating,
          comment: comment.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setReviewMessage('Your review was submitted successfully!')
      setComment('')
      setHasReviewed(true)

      await fetchReviews()
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (
          err as {
            response?: {
              data?: { detail?: string }
            }
          }
        ).response

        setReviewMessage(
          response?.data?.detail || 'Unable to submit your review.'
        )
      } else {
        setReviewMessage('Something went wrong. Please try again.')
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">
          Loading event details...
        </p>
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
                  {new Date(event.date).toLocaleString('en-IN')}
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
                <p className="text-sm text-gray-500">
                  Registered Participants
                </p>
                <p className="mt-1 font-semibold text-blue-700">
                  {event.registered_count}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Seats Available</p>
                <p className="mt-1 font-semibold text-green-700">
                  {event.available_seats}
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
              disabled={
                registering ||
                isRegistered ||
                event.available_seats === 0
              }
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {event.available_seats === 0
                ? 'Event Full'
                : isRegistered
                  ? 'Already Registered'
                  : registering
                    ? 'Registering...'
                    : 'Register for Event'}
            </button>

            {/* Reviews and Ratings */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Reviews & Ratings
              </h2>

              <div className="mt-3 rounded-xl bg-gray-50 p-4">
                <p className="text-3xl font-bold text-gray-900">
                  {averageRating.toFixed(1)} / 5
                </p>

                <div className="mt-1 text-xl text-yellow-500">
                  {'★'.repeat(Math.round(averageRating))}
                  {'☆'.repeat(5 - Math.round(averageRating))}
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Based on {reviews.length}{' '}
                  {reviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Review form */}
              {isRegistered && !hasReviewed && (
                <div className="mt-6 space-y-4 rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900">
                    Share Your Experience
                  </h3>

                  <div>
                    <p className="mb-2 text-sm text-gray-600">
                      Select your rating
                    </p>

                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          aria-label={`Rate ${star} out of 5`}
                          className={`text-3xl ${
                            star <= rating
                              ? 'text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your experience about this event..."
                    maxLength={1000}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}

              {!isRegistered && (
                <p className="mt-5 text-sm text-gray-500">
                  Register for this event to share your review.
                </p>
              )}

              {hasReviewed && (
                <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  You have already submitted a review for this event.
                </p>
              )}

              {reviewMessage && (
                <p
                  role="status"
                  className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
                >
                  {reviewMessage}
                </p>
              )}

              {/* Review list */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-gray-900">
                  What Participants Say
                </h3>

                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No reviews yet. Be the first to review this event!
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.review_id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          User #{review.user_id}
                        </p>

                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString(
                            'en-IN'
                          )}
                        </p>
                      </div>

                      <div className="mt-2 text-lg text-yellow-500">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>

                      {review.comment && (
                        <p className="mt-2 whitespace-pre-wrap text-gray-600">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetails
