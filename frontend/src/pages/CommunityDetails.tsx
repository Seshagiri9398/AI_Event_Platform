
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'

interface Community {
  community_id: number
  name: string
  description: string
  creator_id: number
  created_at: string
}

interface CommunityMember {
  member_id: number
  user_id: number
  community_id: number
  joined_at: string
}

function CommunityDetails() {
  const { communityId } = useParams<{ communityId: string }>()

  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCommunityDetails = async () => {
      try {
        setLoading(true)
        setError('')

        // Get JWT token from localStorage
        const token = localStorage.getItem('access_token')

        if (!token) {
          setError('Please login to view community members.')
          return
        }

        // Fetch community details and members
        const [communityResponse, membersResponse] = await Promise.all([
          api.get<Community>(
            `/communities/${communityId}`
          ),

          api.get<CommunityMember[]>(
            `/communities/${communityId}/members`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
        ])

        setCommunity(communityResponse.data)
        setMembers(membersResponse.data)

      } catch (err: unknown) {
        const apiError = err as {
          response?: {
            status?: number
            data?: {
              detail?: string
            }
          }
        }

        if (apiError.response?.status === 401) {
          setError('Authentication failed. Please login again.')
        } else {
          setError(
            apiError.response?.data?.detail ||
            'Unable to load community details. Please try again.'
          )
        }

      } finally {
        setLoading(false)
      }
    }

    if (communityId) {
      fetchCommunityDetails()
    }
  }, [communityId])

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading community details...
      </main>
    )
  }

  // Error state
  if (error || !community) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-4xl text-center">

          <p className="text-red-400">
            {error || 'Community not found.'}
          </p>

          {error.includes('login') || error.includes('Authentication') ? (
            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
            >
              Login
            </Link>
          ) : null}

          <Link
            to="/communities"
            className="mt-6 ml-3 inline-block rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"
          >
            Back to Communities
          </Link>

        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Back Navigation */}
        <Link
          to="/communities"
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          ← Back to Communities
        </Link>

        {/* Community Information */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl font-bold text-indigo-400">
            {community.name.charAt(0).toUpperCase()}
          </div>

          <h1 className="mt-6 text-3xl font-bold">
            {community.name}
          </h1>

          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-400">
            {community.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-6 border-t border-slate-800 pt-5 text-sm text-slate-400">

            <p>
              Created by: User #{community.creator_id}
            </p>

            <p>
              Created on:{' '}
              {new Date(community.created_at).toLocaleDateString('en-IN')}
            </p>

          </div>
        </section>

        {/* Members Section */}
        <section className="mt-10">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-2xl font-bold">
              Community Members
            </h2>

            <span className="rounded-full bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-400">
              {members.length} Members
            </span>

          </div>

          {members.length === 0 ? (

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

              <h3 className="text-lg font-semibold">
                No members yet
              </h3>

              <p className="mt-2 text-slate-400">
                Be the first person to join this community!
              </p>

            </div>

          ) : (

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {members.map((member) => (

                <article
                  key={member.member_id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-indigo-500"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15 text-lg font-bold text-indigo-400">
                      {member.user_id}
                    </div>

                    <div>

                      <h3 className="font-semibold">
                        User #{member.user_id}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Community Member
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 border-t border-slate-800 pt-4">

                    <p className="text-xs text-slate-500">
                      Joined on
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {new Date(member.joined_at).toLocaleDateString('en-IN')}
                    </p>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </div>
    </main>
  )
}

export default CommunityDetails
