import { useEffect, useState } from 'react'
import api from '../api/axios'

interface UserProfile {
  user_id: number
  name: string
  email: string
  role: string
  created_at: string
}

function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setProfile(response.data)
      setName(response.data.name)
      setEmail(response.data.email)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await api.put(
        '/users/me',
        {
          name,
          email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setProfile(response.data)
      setName(response.data.name)
      setEmail(response.data.email)
      setIsEditing(false)
      setMessage('Profile updated successfully!')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setName(profile.name)
      setEmail(profile.email)
    }

    setIsEditing(false)
    setMessage('')
    setError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <p className="text-red-400">{error || 'Profile not found'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-slate-400 mt-2">
            Manage your personal account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-slate-400">{profile.email}</p>
              <span className="inline-block mt-2 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-sm">
                {profile.role}
              </span>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-5 p-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          {/* Profile Fields */}
          <div className="space-y-5">

            {/* User ID */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                User ID
              </label>
              <div className="bg-slate-800 rounded-lg p-3 text-slate-300">
                {profile.user_id}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Full Name
              </label>

              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="bg-slate-800 rounded-lg p-3 text-slate-300">
                  {profile.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Email Address
              </label>

              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="bg-slate-800 rounded-lg p-3 text-slate-300">
                  {profile.email}
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Account Role
              </label>
              <div className="bg-slate-800 rounded-lg p-3 text-slate-300">
                {profile.role}
              </div>
            </div>

            {/* Joined Date */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Member Since
              </label>
              <div className="bg-slate-800 rounded-lg p-3 text-slate-300">
                {new Date(profile.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={saving || name.trim().length < 2 || !email.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg font-medium transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="bg-slate-700 hover:bg-slate-600 px-5 py-2.5 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(true)
                  setMessage('')
                  setError('')
                }}
                className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-lg font-medium transition"
              >
                Edit Profile
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default Profile