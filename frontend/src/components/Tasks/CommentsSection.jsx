import { useState, useEffect } from "react";
import { commentsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import socketService from "../../services/socket";
import { formatDistanceToNow } from "date-fns";

function CommentsSection({ taskId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchComments();

    // Real-time updates
    socketService.onCommentCreated((comment) => {
      if (comment.task === taskId) {
        setComments((prev) => [comment, ...prev]);
      }
    });

    socketService.onCommentUpdated((updatedComment) => {
      setComments((prev) =>
        prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
      );
    });

    socketService.onCommentDeleted((commentId) => {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    });
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const response = await commentsAPI.getComments(taskId);
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await commentsAPI.createComment({
        content: newComment,
        task: taskId,
      });
      setComments((prev) => [response.data, ...prev]);
      socketService.emitCommentCreated(response.data);
      setNewComment("");
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const response = await commentsAPI.updateComment(commentId, {
        content: editContent,
      });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? response.data : c))
      );
      socketService.emitCommentUpdated(response.data);
      setEditingId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await commentsAPI.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      socketService.emitCommentDeleted(commentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div className="mt-6 border-t border-slate-800 pt-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-teal-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        Comments ({comments.length})
      </h3>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="bg-slate-800/30 rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {comment.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {comment.user?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                        {comment.isEdited && (
                          <span className="ml-1">(edited)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {editingId === comment._id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:border-teal-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEdit(comment._id)}
                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditContent("");
                        }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-300 text-sm">{comment.content}</p>
                  )}
                </div>

                {/* Actions (only for comment owner) */}
                {comment.user?._id === user?._id &&
                  editingId !== comment._id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(comment._id);
                          setEditContent(comment.content);
                        }}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-teal-400 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentsSection;
