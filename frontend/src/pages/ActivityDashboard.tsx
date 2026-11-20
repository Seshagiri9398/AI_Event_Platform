import { useEffect, useState } from 'react'
import api from '../api/axios'

interface Activity {
  events_registered: number
  communities_joined: number
  discussions_created: number
  comments_made: number
}

function ActivityDashboard() {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const token = localStorage.getItem('access_token')

        const response = await api.get('/users/me/activity', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setActivity(response.data)
      } catch (err) {
        console.error(err)
        setError('Failed to load your activity. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [])

  const cards = [
    {
      title: 'Events Registered',
      count: activity?.events_registered ?? 0,
      emoji: '🎫',
      description: 'Events you have joined',
      color: 'border-blue-500',
    },
    {
      title: 'Communities Joined',
      count: activity?.communities_joined ?? 0,
      emoji: '👥',
      description: 'Communities you are part of',
      color: 'border-purple-500',
    },
    {
      title: 'Discussions Created',
      count: activity?.discussions_created ?? 0,
      emoji: '💬',
      description: 'Posts you have shared',
      color: 'border-green-500',
    },
    {
      title: 'Comments Made',
      count: activity?.comments_made ?? 0,
      emoji: '📝',
      description: 'Comments you have written',
      color: 'border-orange-500',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold sm:text-4xl">
            My Activity Dashboard
          </h1>

          <p className="mt-3 text-slate-400">
            Track your activity and participation across EventHub.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center text-slate-400">
            Loading your activity...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
            {error}
          </div>
        )}

        {/* Activity Cards */}
        {!loading && !error && activity && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.title}
                  className={`rounded-2xl border border-slate-800 border-l-4 ${card.color} bg-slate-900 p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-3xl">{card.emoji}</span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                      Activity
                    </span>
                  </div>

                  <p className="text-4xl font-bold">{card.count}</p>

                  <h2 className="mt-3 text-lg font-semibold text-slate-200">
                    {card.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
              <h2 className="text-xl font-semibold">Your EventHub Journey 🚀</h2>

              <p className="mt-3 text-slate-400">
                You have registered for{' '}
                <span className="font-semibold text-blue-400">
                  {activity.events_registered}
                </span>{' '}
                events, joined{' '}
                <span className="font-semibold text-purple-400">
                  {activity.communities_joined}
                </span>{' '}
                communities, created{' '}
                <span className="font-semibold text-green-400">
                  {activity.discussions_created}
                </span>{' '}
                discussions, and written{' '}
                <span className="font-semibold text-orange-400">
                  {activity.comments_made}
                </span>{' '}
                comments.
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Keep participating, connecting, and learning. Every step counts!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ActivityDashboard