
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

interface LoginResponse {
  access_token: string
  token_type: string
}

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post<LoginResponse>('/login', {
        email: email.trim(),
        password,
      })

      localStorage.setItem('access_token', response.data.access_token)

      // Return to the events page after login.
      navigate('/')
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof err.response === 'object' &&
        err.response !== null &&
        'data' in err.response &&
        typeof err.response.data === 'object' &&
        err.response.data !== null &&
        'detail' in err.response.data &&
        typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : 'Unable to log in. Please check your details and try again.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <Link
          to="/"
          className="text-xl font-bold text-indigo-400"
        >
          EventHub
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          Welcome back
        </h1>

        <p className="mt-2 text-slate-400">
          Log in to discover events and connect with communities.
        </p>

        <form onSubmit={handleLogin} className="mt-8">
          <label htmlFor="email" className="block text-sm font-medium">
            Email address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />

          <label
            htmlFor="password"
            className="mt-5 block text-sm font-medium"
          >
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Back to events?{' '}
          <Link to="/" className="text-indigo-400 hover:text-indigo-300">
            Explore events
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Login
