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

interface Comment {
  comment_id: number
  post_id: number
  user_id: number
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
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState<number | null>(null)

  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const token = localStorage.getItem('access_token')

  // Get current user ID from JWT token
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

  // Fetch comments for a single post
  const fetchComments = async (postId: number) => {
    try {
      const response = await api.get<Comment[]>(
        `/posts/${postId}/comments`
      )

      setComments((previous) => ({
        ...previous,
        [postId]: response.data,
      }))
    } catch {
      setError(`Failed to load comments for post #${postId}.`)
    }
  }

  // Fetch posts and their comments
  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get<CommunityPost[]>(
        `/communities/${communityId}/posts`
      )

      setPosts(response.data)

      // Fetch comments for all posts
      await Promise.all(
        response.data.map((post) => fetchComments(post.post_id))
      )
    } catch {
      setError('Failed to load community posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [communityId])

  // Create a new post
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

  // Delete your own post
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

      setComments((previous) => {
        const updated = { ...previous }
        delete updated[postId]
        return updated
      })
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to delete the post.'
      )
    }
  }

  // Create a comment
  const handleCreateComment = async (
    postId: number,
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!token) {
      setError('Please login to comment.')
      return
    }

    const commentText = commentInputs[postId]?.trim()

    if (!commentText) {
      setError('Comment cannot be empty.')
      return
    }

    setCommentSubmitting(postId)
    setError('')

    try {
      await api.post(
        `/posts/${postId}/comments`,
        {
          content: commentText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Clear the input after successful comment
      setCommentInputs((previous) => ({
        ...previous,
        [postId]: '',
      }))

      // Refresh comments
      await fetchComments(postId)
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to create comment.'
      )
    } finally {
      setCommentSubmitting(null)
    }
  }

  // Delete your own comment
  const handleDeleteComment = async (commentId: number, postId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this comment?'
    )

    if (!confirmed || !token) return

    try {
      await api.delete(`/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setComments((previous) => ({
        ...previous,
        [postId]: (previous[postId] || []).filter(
          (comment) => comment.comment_id !== commentId
        ),
      }))
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to delete comment.'
      )
    }
  }

  return (
    <section className="mt-8 space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Community Discussions
        </h2>
        <p className="mt-1 text-slate-400">
          Share ideas and learn from other community members.
        </p>
      </div>

      {/* Create Post Form */}
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

      {/* Error Message */}
      {error && (
        <p className="rounded-lg bg-red-500/10 p-3 text-red-400">
          {error}
        </p>
      )}

      {/* Posts */}
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
              {/* Post Header */}
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

              {/* Post Content */}
              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
                {post.content}
              </p>

              {/* Comments Section */}
              <div className="mt-6 border-t border-slate-700 pt-5">
                <h4 className="mb-4 font-semibold text-white">
                  Comments ({comments[post.post_id]?.length || 0})
                </h4>

                {/* Comment List */}
                <div className="space-y-3">
                  {(comments[post.post_id] || []).map((comment) => (
                    <div
                      key={comment.comment_id}
                      className="rounded-lg bg-slate-900 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-indigo-400">
                            User #{comment.user_id}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>

                        {currentUserId === comment.user_id && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteComment(
                                comment.comment_id,
                                post.post_id
                              )
                            }
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                {token && (
                  <form
                    onSubmit={(e) => handleCreateComment(post.post_id, e)}
                    className="mt-4 flex flex-col gap-3 sm:flex-row"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.post_id] || ''}
                      onChange={(e) =>
                        setCommentInputs((previous) => ({
                          ...previous,
                          [post.post_id]: e.target.value,
                        }))
                      }
                      placeholder="Write a comment..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />

                    <button
                      type="submit"
                      disabled={commentSubmitting === post.post_id}
                      className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {commentSubmitting === post.post_id
                        ? 'Sending...'
                        : 'Comment'}
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default CommunityPosts