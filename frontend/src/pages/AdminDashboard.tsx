import { useEffect, useState } from 'react'
import api from '../api/axios'

interface RecentUser {
  user_id: number
  name: string
  email: string
  role: string
  created_at: string
}

interface RecentEvent {
  event_id: number
  title: string
  date: string
  location: string
  capacity: number
  status: string
}

interface DashboardData {
  total_users: number
  total_events: number
  total_communities: number
  total_registrations: number
  recent_users: RecentUser[]
  recent_events: RecentEvent[]
}

function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('access_token')

        const response = await api.get('/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setData(response.data)
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("Access denied. Only administrators can view this dashboard.")
        } else if (err.response?.status === 401) {
          setError('Please log in to access the dashboard.')
        } else {
          setError('Failed to load dashboard. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const stats = [
    {
      title: 'Total Users',
      value: data?.total_users ?? 0,
      icon: '👥',
      color: 'border-blue-500',
    },
    {
      title: 'Total Events',
      value: data?.total_events ?? 0,
      icon: '🎫',
      color: 'border-purple-500',
    },
    {
      title: 'Communities',
      value: data?.total_communities ?? 0,
      icon: '🌐',
      color: 'border-green-500',
    },
    {
      title: 'Registrations',
      value: data?.total_registrations ?? 0,
      icon: '📊',
      color: 'border-orange-500',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
            EventHub Administration
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-slate-400">
            Monitor platform activity and manage your EventHub overview.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center text-slate-400">
            Loading admin dashboard...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
            {error}
          </div>
        )}

        {/* Dashboard */}
        {!loading && !error && data && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className={`rounded-2xl border border-slate-800 border-l-4 ${stat.color} bg-slate-900 p-6 shadow-lg transition hover:-translate-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <span className="text-3xl">{stat.icon}</span>
                  </div>

                  <p className="mt-4 text-4xl font-bold">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Users */}
            <div className="mt-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 p-6">
                <h2 className="text-xl font-semibold">Recent Users</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Latest accounts registered on EventHub
                </p>
              </div>

              {data.recent_users.length === 0 ? (
                <p className="p-6 text-slate-400">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/60 text-sm text-slate-400">
                      <tr>
                        <th className="px-6 py-4">User ID</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Joined</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.recent_users.map((user) => (
                        <tr
                          key={user.user_id}
                          className="border-t border-slate-800 transition hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-4 text-slate-400">
                            #{user.user_id}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              user.role === 'ADMIN'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Events */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 p-6">
                <h2 className="text-xl font-semibold">Recent Events</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Latest events created on the platform
                </p>
              </div>

              {data.recent_events.length === 0 ? (
                <p className="p-6 text-slate-400">No events found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/60 text-sm text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Event ID</th>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4">Capacity</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.recent_events.map((event) => (
                        <tr
                          key={event.event_id}
                          className="border-t border-slate-800 transition hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-4 text-slate-400">
                            #{event.event_id}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {event.title}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {new Date(event.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {event.location}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {event.capacity}
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                              {event.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard