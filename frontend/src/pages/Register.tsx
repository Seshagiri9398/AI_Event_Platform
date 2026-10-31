
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (name.trim().length < 2) {
      setError('Name must contain at least 2 characters.')
      return
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)

      await api.post('/users', {
        name: name.trim(),
        email: email.trim(),
        password: password,
      })

      setSuccess('Account created successfully! You can now login.')

      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number
          data?: { detail?: string }
        }
      }

      if (error.response?.status === 409) {
        setError('This email is already registered.')
      } else {
        setError(
          error.response?.data?.detail || 'Registration failed. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700">
            EventHub
          </h1>

          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Create Account
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Join EventHub and discover exciting events.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
            <Link
              to="/login"
              className="ml-1 font-semibold underline"
            >
              Login here
            </Link>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              minLength={2}
              maxLength={100}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              minLength={8}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Login
          </Link>
        </p>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            Back to Events
          </Link>
        </div>

      </div>
    </div>
  )
}

export default Register
