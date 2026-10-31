import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

interface Notification {
  notification_id: number
  user_id: number
  message: string
  is_read: boolean
  created_at: string
}

function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('access_token')

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setError('Please login to view your notifications.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      const [notificationResponse, countResponse] = await Promise.all([
        api.get<Notification[]>('/notifications?skip=0&limit=100', config),
        api.get('/notifications/unread-count', config),
      ])

      setNotifications(notificationResponse.data)
      setUnreadCount(countResponse.data.unread_count)
    } catch {
      setError('Unable to load notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.patch(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      )

      setUnreadCount((previous) => Math.max(0, previous - 1))
      setMessage('Notification marked as read.')
    } catch {
      setMessage('Unable to mark notification as read.')
    }
  }

  const handleDelete = async (notificationId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this notification?'
    )

    if (!confirmed) return

    try {
      await api.delete(`/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const deletedNotification = notifications.find(
        (item) => item.notification_id === notificationId
      )

      setNotifications((previous) =>
        previous.filter(
          (item) => item.notification_id !== notificationId
        )
      )

      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((previous) => Math.max(0, previous - 1))
      }

      setMessage('Notification deleted successfully.')
    } catch {
      setMessage('Unable to delete notification.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Notifications
            </h1>

            <p className="mt-2 text-gray-600">
              Stay updated with your EventHub activities.
            </p>
          </div>

          <Link
            to="/"
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Back to Events
          </Link>
        </div>

        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Unread Notifications
          </p>

          <p className="mt-1 text-3xl font-bold text-blue-700">
            {unreadCount}
          </p>
        </div>

        {message && (
          <p
            role="status"
            className="mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
          >
            {message}
          </p>
        )}

        {loading && (
          <p className="py-10 text-center text-gray-600">
            Loading notifications...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-red-50 p-5 text-red-700">
            <p>{error}</p>

            <button
              onClick={fetchNotifications}
              className="mt-3 font-semibold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              No notifications yet
            </h2>

            <p className="mt-2 text-gray-500">
              Your notifications will appear here.
            </p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.notification_id}
                className={`rounded-xl border p-5 shadow-sm ${
                  notification.is_read
                    ? 'border-gray-200 bg-white'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          notification.is_read
                            ? 'bg-gray-300'
                            : 'bg-blue-600'
                        }`}
                      />

                      <span className="text-xs font-semibold uppercase text-gray-500">
                        {notification.is_read ? 'Read' : 'Unread'}
                      </span>
                    </div>

                    <p className="text-gray-800">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString(
                        'en-IN'
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() =>
                          handleMarkAsRead(notification.notification_id)
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Mark as Read
                      </button>
                    )}

                    <button
                      onClick={() =>
                        handleDelete(notification.notification_id)
                      }
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications