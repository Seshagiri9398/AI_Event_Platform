import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { jwtDecode } from 'jwt-decode'


interface CommunityPost {
  post_id: number
  community_id: number
  user_id: number
  title: string
  content: string
  created_at: string
}

interface TokenPayload {
  user_id: number
}

interface CommunityPostsProps {
  communityId: number
}

function CommunityPosts({ communityId }: CommunityPostsProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token)
        setCurrentUserId(decoded.user_id)
      } catch {
        setCurrentUserId(null)
      }
    }
  }, [token])

  const fetchPosts = async () => {
    try {
      const response = await api.get<CommunityPost[]>(
        `/communities/${communityId}/posts`
      )
      setPosts(response.data)
    } catch {
      setError('Failed to load community posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [communityId])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError('Please login to create a post.')
      return
    }

    if (!title.trim() || !content.trim()) {
      setError('Please enter both title and content.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await api.post(
        `/communities/${communityId}/posts`,
        {
          title: title.trim(),
          content: content.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setTitle('')
      setContent('')
      await fetchPosts()
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to create the post.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async (postId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this post?'
    )

    if (!confirmed || !token) return

    try {
      await api.delete(`/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setPosts((previousPosts) =>
        previousPosts.filter((post) => post.post_id !== postId)
      )
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to delete the post.'
      )
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Community Discussions
        </h2>
        <p className="mt-1 text-slate-400">
          Share ideas and learn from other community members.
        </p>
      </div>

      {token && (
        <form
          onSubmit={handleCreatePost}
          className="space-y-4 rounded-xl border border-slate-700 bg-slate-800 p-5"
        >
          <h3 className="text-lg font-semibold text-white">
            Create a Discussion
          </h3>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Discussion title"
            maxLength={200}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What would you like to discuss?"
            rows={4}
            className="w-full resize-y rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Create Post'}
          </button>
        </form>
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 p-3 text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-400">Loading discussions...</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-slate-700 p-6 text-center">
          <p className="text-slate-300">
            No discussions yet. Be the first to create one!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.post_id}
              className="rounded-xl border border-slate-700 bg-slate-800 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {post.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Posted by User #{post.user_id} ·{' '}
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>

                {currentUserId === post.user_id && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.post_id)}
                    className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
                {post.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default CommunityPosts