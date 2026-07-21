import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Reply, Heart, MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { reviewsService, Review } from '../services/reviewsService'
import { authService } from '../services/authService'
import { Link } from 'react-router-dom'
import UserAvatar from './UserAvatar'
import { usersService } from '../services/usersService'

interface CommentsSectionProps {
  trackId: number
}

const CommentsSection = ({ trackId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null)
  const [userAvatars, setUserAvatars] = useState<Record<string, string | null>>({})
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set())
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null)
  const menuRefs = useRef<Record<string | number, HTMLDivElement | null>>({})
  const currentUser = authService.getCurrentUser()

  useEffect(() => {
    loadComments()
    loadCurrentUserProfile()
  }, [trackId])

  const loadCurrentUserProfile = async () => {
    if (!currentUser?.displayName) return
    try {
      const profileData = await usersService.getPublicProfile(currentUser.displayName)
      setCurrentUserAvatarUrl(profileData.profile?.avatarUrl || null)
    } catch (error) {
      console.error('Failed to load current user profile:', error)
    }
  }

  const loadComments = async () => {
    try {
      setLoading(true)
      const data = await reviewsService.getByTrackId(trackId)
      const parentComments = data.filter((c) => !c.parentId)
      const replies = data.filter((c) => c.parentId)
      
      const commentsWithReplies = parentComments.map((comment) => ({
        ...comment,
        replies: replies.filter((reply) => reply.parentId === comment.id),
      }))
      
      setComments(commentsWithReplies)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser) return

    try {
      await reviewsService.create(trackId, {
        comment: newComment,
      })
      setNewComment('')
      loadComments()
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert('Не удалось оставить комментарий')
    }
  }

  const handleSubmitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault()
    if (!replyText.trim() || !currentUser) return

    try {
      await reviewsService.create(trackId, {
        comment: replyText,
        parentId,
      })
      setReplyText('')
      setReplyingTo(null)
      loadComments()
    } catch (error) {
      console.error('Failed to create reply:', error)
      alert('Не удалось оставить ответ')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuElement = menuRefs.current[openMenuId]
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const handleEdit = (comment: Review) => {
    setEditingCommentId(comment.id)
    setEditingText(comment.comment || '')
    setOpenMenuId(null)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingText('')
  }

  const handleSaveEdit = async (commentId: number) => {
    if (!editingText.trim()) return

    try {
      await reviewsService.update(commentId, { comment: editingText })
      setEditingCommentId(null)
      setEditingText('')
      setComments((prevComments) =>
        prevComments.map((c) => {
          if (c.id === commentId) {
            return { ...c, comment: editingText }
          }
          const updatedReplies = c.replies?.map((r) =>
            r.id === commentId ? { ...r, comment: editingText } : r
          )
          if (updatedReplies) {
            return { ...c, replies: updatedReplies }
          }
          return c
        })
      )
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert('Не удалось обновить комментарий')
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      await reviewsService.delete(commentId)
      setOpenMenuId(null)
      setComments((prevComments) =>
        prevComments
          .map((c) => {
            if (c.id === commentId) {
              return null
            }
            if (c.replies) {
              const updatedReplies = c.replies.filter((r) => r.id !== commentId)
              return { ...c, replies: updatedReplies }
            }
            return c
          })
          .filter((c): c is Review => c !== null)
      )
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Не удалось удалить комментарий')
    }
  }

  useEffect(() => {
    const loadUserAvatars = async () => {
      const uniqueUsers = new Set<string>()
      comments.forEach((comment) => {
        if (comment.user?.displayName) {
          uniqueUsers.add(comment.user.displayName)
        }
        comment.replies?.forEach((reply) => {
          if (reply.user?.displayName) {
            uniqueUsers.add(reply.user.displayName)
          }
        })
      })

      const avatarPromises = Array.from(uniqueUsers).map(async (displayName) => {
        if (userAvatars[displayName] !== undefined) return
        try {
          const profileData = await usersService.getPublicProfile(displayName)
          return { displayName, avatarUrl: profileData.profile?.avatarUrl || null }
        } catch (error) {
          console.error(`Failed to load profile for ${displayName}:`, error)
          return { displayName, avatarUrl: null }
        }
      })

      const results = await Promise.all(avatarPromises)
      const newAvatars: Record<string, string | null> = {}
      results.forEach((result) => {
        if (result) {
          newAvatars[result.displayName] = result.avatarUrl
        }
      })
      setUserAvatars((prev) => ({ ...prev, ...newAvatars }))
    }

    if (comments.length > 0) {
      loadUserAvatars()
    }
  }, [comments])

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-xl font-semibold text-white mb-6">Комментарии</h2>

      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-3 text-white placeholder-gray-400"
            rows={3}
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Отправить
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg text-center text-gray-300">
          <Link to="/login" className="text-primary-400 hover:underline">
            Войдите
          </Link>
          {' '}чтобы оставить комментарий
        </div>
      )}

      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p>Пока нет комментариев</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-700 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                {comment.user && (
                  <UserAvatar
                    displayName={comment.user.displayName}
                    avatarUrl={userAvatars[comment.user.displayName] || undefined}
                    size="md"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/profile/${comment.user?.displayName || 'unknown'}`}
                        className="font-semibold text-white hover:text-primary-400 transition-colors"
                      >
                        {comment.user?.displayName || 'Неизвестный пользователь'}
                      </Link>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {currentUser && (currentUser.id === comment.userId || currentUser.role === 'admin') && (
                      <div className="relative" ref={(el) => (menuRefs.current[comment.id] = el)}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                        {openMenuId === comment.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-1 z-10">
                            <button
                              onClick={() => handleEdit(comment)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span>Редактировать</span>
                            </button>
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-600 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Удалить</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm text-white placeholder-gray-400"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                          Отмена
                        </button>
                        {currentUser && currentUser.role !== 'admin' && (
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                          >
                            Сохранить
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-white whitespace-pre-wrap">{comment.comment}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2">
                    {currentUser && currentUser.role !== 'admin' && (
                      <button
                        onClick={async () => {
                          try {
                            const result = await reviewsService.toggleLike(comment.id)
                            setComments((prevComments) =>
                              prevComments.map((c) =>
                                c.id === comment.id
                                  ? { ...c, isLiked: result.isLiked, likesCount: result.likesCount || 0 }
                                  : c
                              )
                            )
                          } catch (error) {
                            console.error('Failed to toggle like:', error)
                          }
                        }}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          comment.isLiked
                            ? 'text-red-500 hover:text-red-400'
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                        <span>{comment.likesCount || 0}</span>
                      </button>
                    )}
                    {(!currentUser || currentUser.role === 'admin') && (comment.likesCount || 0) > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                        <Heart className="h-4 w-4" />
                        <span>{comment.likesCount || 0}</span>
                      </div>
                    )}
                    
                    {currentUser && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-sm text-gray-400 hover:text-primary-400 transition-colors flex items-center space-x-1"
                      >
                        <Reply className="h-4 w-4" />
                        <span>Ответить</span>
                      </button>
                    )}
                  </div>

                  {replyingTo === comment.id && currentUser && (
                    <form
                      onSubmit={(e) => handleSubmitReply(e, comment.id)}
                      className="mt-3 pl-4 border-l-2 border-gray-700"
                    >
                      <div className="flex items-start space-x-2">
                        {currentUser && (
                          <UserAvatar
                            displayName={currentUser.displayName}
                            avatarUrl={currentUserAvatarUrl || undefined}
                            size="sm"
                            linkToProfile={false}
                          />
                        )}
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Ответить ${comment.user?.displayName || 'пользователю'}...`}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm text-white placeholder-gray-400"
                            rows={2}
                            required
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                              }}
                              className="px-3 py-1 text-sm text-gray-300 hover:text-white transition-colors"
                            >
                              Отмена
                            </button>
                            <button
                              type="submit"
                              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded-lg transition-colors text-sm flex items-center space-x-1"
                            >
                              <Send className="h-3 w-3" />
                              <span>Отправить</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="mt-3 text-sm text-gray-400 hover:text-primary-400 transition-colors flex items-center space-x-1"
                    >
                      {expandedReplies.has(comment.id) ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span>Скрыть ответы ({comment.replies.length})</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span>Показать ответы ({comment.replies.length})</span>
                        </>
                      )}
                    </button>
                  )}

                  {comment.replies && comment.replies.length > 0 && expandedReplies.has(comment.id) && (
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-700 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start space-x-2">
                          {reply.user && (
                            <UserAvatar
                              displayName={reply.user.displayName}
                              avatarUrl={userAvatars[reply.user.displayName] || undefined}
                              size="sm"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <Link
                                  to={`/profile/${reply.user?.displayName || 'unknown'}`}
                                  className="font-semibold text-sm text-white hover:text-primary-400 transition-colors"
                                >
                                  {reply.user?.displayName || 'Неизвестный пользователь'}
                                </Link>
                                <span className="text-xs text-gray-400">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              {currentUser && (currentUser.id === reply.userId || currentUser.role === 'admin') && (
                                <div className="relative" ref={(el) => (menuRefs.current[`reply-${reply.id}`] = el)}>
                                  <button
                                    onClick={() => setOpenMenuId(openMenuId === `reply-${reply.id}` ? null : `reply-${reply.id}`)}
                                    className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                                  >
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                  </button>
                                  {openMenuId === `reply-${reply.id}` && (
                                    <div className="absolute right-0 mt-1 w-40 bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-1 z-10">
                                      <button
                                        onClick={() => handleEdit(reply)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                        <span>Редактировать</span>
                                      </button>
                                      <button
                                        onClick={() => handleDelete(reply.id)}
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-600 flex items-center space-x-2"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span>Удалить</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {editingCommentId === reply.id ? (
                              <div className="mt-2">
                                <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm text-white placeholder-gray-400"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex justify-end space-x-2 mt-2">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 text-xs text-gray-300 hover:text-white transition-colors"
                                  >
                                    Отмена
                                  </button>
                                  {currentUser && currentUser.role !== 'admin' && (
                                    <button
                                      onClick={() => handleSaveEdit(reply.id)}
                                      className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                                    >
                                      Сохранить
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-white whitespace-pre-wrap">
                                {reply.comment}
                              </p>
                            )}
                            {currentUser && currentUser.role !== 'admin' && (
                              <button
                                onClick={async () => {
                                  try {
                                    const result = await reviewsService.toggleLike(reply.id)
                                    setComments((prevComments) =>
                                      prevComments.map((c) =>
                                        c.id === comment.id
                                          ? {
                                              ...c,
                                              replies: c.replies?.map((r) =>
                                                r.id === reply.id
                                                  ? { ...r, isLiked: result.isLiked, likesCount: result.likesCount || 0 }
                                                  : r
                                              ),
                                            }
                                          : c
                                      )
                                    )
                                  } catch (error) {
                                    console.error('Failed to toggle like:', error)
                                  }
                                }}
                                className={`flex items-center space-x-1 text-xs mt-1 transition-colors ${
                                  reply.isLiked
                                    ? 'text-red-500 hover:text-red-400'
                                    : 'text-gray-400 hover:text-red-500'
                                }`}
                              >
                                <Heart className={`h-3 w-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                <span>{reply.likesCount || 0}</span>
                              </button>
                            )}
                            {(!currentUser || currentUser.role === 'admin') && (reply.likesCount || 0) > 0 && (
                              <div className="flex items-center space-x-1 text-xs mt-1 text-gray-400">
                                <Heart className="h-3 w-3" />
                                <span>{reply.likesCount || 0}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommentsSection

