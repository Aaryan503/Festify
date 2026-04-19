import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Send, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

const MessagePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string } | null>(null);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isSending) return;

    try {
      setIsSending(true);
      setFeedback(null);
      // Send message with eventId to target specific event's interested members
      const response = await axios.post(
        `${API}/api/messages/send-to-interested`,
        {
          eventId: eventId,
          title: title.trim(),
          body: body.trim(),
        },
        { withCredentials: true }
      );
      setTitle('');
      setBody('');
      // Show success feedback
      setFeedback({
        type: 'success',
        message: response.data.message || `Message sent to ${response.data.successful || 0} users${response.data.failed > 0 ? ` (${response.data.failed} failed)` : ''}!`
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error feedback
      setFeedback({
        type: 'error',
        message: 'Failed to send message. Please try again.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={handleClose}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm font-semibold hover:border-dark-accent/40 transition-all"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Send Message</h1>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-dark-accent/20 to-blue-500/10 p-4">
        <h2 className="text-lg font-semibold text-white mb-2">Send Message to Interested Members</h2>
        <p className="text-sm text-dark-muted">
          Send a message to all members who have shown interest in your events.
        </p>
      </div>

      <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/20">
        {/* Feedback Message */}
        {feedback && (
          <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
            feedback.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter message title..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-dark-accent/50 transition-colors"
              required
            />
          </div>

          {/* Body Field */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-white mb-2">
              Body
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message content..."
              rows={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-dark-accent/50 transition-colors resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSending || !title.trim() || !body.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-accent hover:bg-dark-accent/80 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-dark-accent/25 font-medium text-sm"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl glass text-sm font-semibold hover:border-red-400/40 hover:bg-red-500/10 transition-colors"
            >
              <X size={16} />
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessagePage;