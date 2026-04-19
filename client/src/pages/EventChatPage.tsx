import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Link as LinkIcon, Loader2, Plus, Send, Trash2, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

interface ChatUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface ChatMessage {
  _id: string;
  content: string;
  senderId: ChatUser;
  createdAt: string;
}

interface ChatResource {
  _id: string;
  title: string;
  url: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const renderMessageWithLinks = (content: string) => {
  const parts = content.split(URL_REGEX);
  return parts.map((part, idx) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={`${part}-${idx}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-blue-300 underline break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={`${part}-${idx}`}>{part}</span>;
  });
};

const EventChatPage = () => {
  const getLinkPreviewText = (url: string) => {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname !== '/' ? parsed.pathname : ''}`;
    } catch {
      return url;
    }
  };

  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [resources, setResources] = useState<ChatResource[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [tab, setTab] = useState<'chat' | 'resources'>('chat');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingResource, setIsSavingResource] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const canOperate = useMemo(() => !!eventId, [eventId]);

  const fetchMessages = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await axios.get(`${API}/api/chats/events/${eventId}/messages`, {
        withCredentials: true,
        params: { limit: 50 },
      });
      setMessages(response.data.messages || []);
      setIsAdmin(Boolean(response.data.isAdmin));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [eventId]);

  const fetchResources = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoadingResources(true);
      const response = await axios.get(`${API}/api/chats/events/${eventId}/resources`, {
        withCredentials: true,
      });
      setResources(response.data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoadingResources(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    axios.get(`${API}/api/chats/events/${eventId}`, { withCredentials: true }).catch((error) => {
      console.error('Error initializing chat:', error);
    });
    fetchMessages();
    fetchResources();
  }, [eventId, fetchMessages, fetchResources]);

  useEffect(() => {
    if (!eventId) return;
    const intervalId = setInterval(() => {
      fetchMessages();
      fetchResources();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [eventId, fetchMessages, fetchResources]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId || !messageInput.trim() || isSending) return;

    try {
      setIsSending(true);
      await axios.post(
        `${API}/api/chats/events/${eventId}/messages`,
        { content: messageInput.trim() },
        { withCredentials: true }
      );
      setMessageInput('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!eventId || !isAdmin) return;
    try {
      await axios.delete(`${API}/api/chats/events/${eventId}/messages/${messageId}`, {
        withCredentials: true,
      });
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleAddResource = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId || !resourceTitle.trim() || !resourceUrl.trim() || isSavingResource) return;

    try {
      setIsSavingResource(true);
      await axios.post(
        `${API}/api/chats/events/${eventId}/resources`,
        {
          title: resourceTitle.trim(),
          url: resourceUrl.trim(),
        },
        { withCredentials: true }
      );
      setResourceTitle('');
      setResourceUrl('');
      setShowResourceForm(false);
      fetchResources();
    } catch (error) {
      console.error('Error adding resource:', error);
    } finally {
      setIsSavingResource(false);
    }
  };

  if (!canOperate) {
    return <div className="p-6 text-dark-muted">Invalid event chat.</div>;
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={() => navigate('/interested-events')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm font-semibold hover:border-dark-accent/40 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Interested Events
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Event Chat</h1>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-gradient-to-r from-dark-accent/20 to-blue-500/10 p-4">
        <p className="text-sm text-dark-muted">
          Stay coordinated with organizers and attendees. Share updates, logistics, and resource links.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('chat')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'chat' ? 'bg-dark-accent text-white shadow-lg shadow-dark-accent/25' : 'glass hover:border-dark-accent/30'
          }`}
        >
          <MessageCircle size={14} />
          Chat
        </button>
        <button
          onClick={() => setTab('resources')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'resources' ? 'bg-dark-accent text-white shadow-lg shadow-dark-accent/25' : 'glass hover:border-dark-accent/30'
          }`}
        >
          <Sparkles size={14} />
          Resources
        </button>
      </div>

      {tab === 'chat' ? (
        <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/20">
          {isLoadingMessages ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="animate-spin text-dark-accent" />
            </div>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-2">
              {messages.length === 0 ? (
                <p className="text-sm text-dark-muted">No messages yet.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-4 hover:border-dark-accent/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{msg.senderId?.name || 'Unknown User'}</p>
                        <p className="text-xs text-dark-muted">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap break-words leading-relaxed">
                      {renderMessageWithLinks(msg.content)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-5 mb-3">
            <h2 className="text-sm font-semibold text-dark-muted">Quick actions</h2>
            <button
              onClick={() => setShowResourceForm((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              <Plus size={14} />
              Add Resource
            </button>
          </div>

          {showResourceForm && (
            <form onSubmit={handleAddResource} className="grid gap-2 mb-4 p-3 rounded-xl border border-white/10 bg-white/5">
              <input
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Resource title"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-dark-accent/50"
              />
              <input
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://resource-link"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-dark-accent/50"
              />
              <button
                type="submit"
                disabled={isSavingResource}
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-dark-accent hover:bg-dark-accent/80 disabled:opacity-60"
              >
                {isSavingResource ? 'Saving...' : 'Save Resource'}
              </button>
            </form>
          )}

          <form onSubmit={handleSend} className="flex gap-2 mt-4">
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-dark-accent/50"
            />
            <button
              type="submit"
              disabled={isSending}
              className="px-4 py-3 rounded-xl bg-dark-accent hover:bg-dark-accent/80 disabled:opacity-60 transition-colors shadow-lg shadow-dark-accent/25"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/20">
          {isLoadingResources ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="animate-spin text-dark-accent" />
            </div>
          ) : resources.length === 0 ? (
            <p className="text-sm text-dark-muted">No resources added yet.</p>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => (
                <a
                  key={resource._id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 hover:border-blue-400/40 hover:bg-blue-500/5 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{resource.title}</p>
                      <p className="text-xs text-dark-muted truncate">{resource.url}</p>
                      <p className="text-xs text-blue-300 truncate">
                        Preview: {getLinkPreviewText(resource.url)}
                      </p>
                      <p className="text-xs text-dark-muted mt-1">
                        Added by {resource.createdBy?.name || 'Unknown'} on{' '}
                        {new Date(resource.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <LinkIcon size={16} className="text-blue-300 shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventChatPage;
