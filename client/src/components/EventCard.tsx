import { MapPin, Heart, MessageCircle, Navigation } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
  _id: string;
  title: string;
  organizer: string;
  date: string;
  time: string;
  image?: string;
  location?: string;
  description?: string;
  endTime?: string;
  variant?: 'list' | 'featured';
  showInterestedButton?: boolean;
  initialInterestedStatus?: boolean;
  onInterestChange?: (nextInterested: boolean) => void;
  showChatButton?: boolean;
  onViewChat?: () => void;
}

const EventCard = ({
  _id,
  title,
  organizer,
  date,
  time,
  image,
  location,
  description,
  endTime,
  variant = 'list',
  showInterestedButton = false,
  initialInterestedStatus = false,
  onInterestChange,
  showChatButton = false,
  onViewChat,
}: EventCardProps) => {
  const [isInterested, setIsInterested] = useState(initialInterestedStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsInterested(initialInterestedStatus);
  }, [initialInterestedStatus]);

  const handleInterestToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        `/api/events/${_id}/interested/toggle`,
        {},
        { withCredentials: true }
      );
      setIsInterested(response.data.interested);
      onInterestChange?.(response.data.interested);
    } catch (error) {
      console.error('Error toggling interest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chatButton = showChatButton ? (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onViewChat?.();
      }}
      className="flex-1 min-w-[100px] justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
    >
      <MessageCircle size={13} />
      View Chat
    </button>
  ) : null;

  if (variant === 'featured' && image) {
    return (
      <div className="glass h-full flex flex-col rounded-2xl overflow-hidden group cursor-pointer hover:border-dark-accent/30 hover:shadow-lg hover:shadow-black/25 transition-all duration-300">
        <div className="relative aspect-video overflow-hidden shrink-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-white mb-1">{title}</h3>
          {description && (
            <p className="text-dark-muted text-xs mb-2 line-clamp-2">{description}</p>
          )}
          <p className="text-sm font-bold text-white mb-1">{date} {time}</p>
          {endTime && (
            <p className="text-dark-muted text-xs mb-1">Ends: {endTime}</p>
          )}
          <p className="text-dark-muted text-xs flex items-center gap-1">
            <MapPin size={12} />
            {location || 'TBD'}
          </p>
          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            {showInterestedButton && user && (
              <button
                onClick={handleInterestToggle}
                disabled={isLoading}
                className={`flex-1 min-w-[120px] justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  isInterested
                    ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart size={13} className={isInterested ? 'fill-green-300' : ''} />
                {isLoading ? '...' : 'Interested'}
              </button>
            )}
            {chatButton}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/directions/${location}`);
              }}
              className="flex-1 min-w-[100px] justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
            >
              <Navigation size={13} />
              Directions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass h-full rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-dark-accent/30 hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
      <div className="flex items-center gap-3">
        {(() => {
          const firstChar = Array.from(title)[0] || '';
          const isEmoji = /\p{Extended_Pictographic}/u.test(firstChar);
          return (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${isEmoji ? 'bg-white/5 text-xl' : 'bg-gradient-to-br from-dark-accent to-purple-800 text-sm font-bold'}`}>
              {firstChar}
            </div>
          );
        })()}
        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{title}</h3>
          <p className="text-dark-muted text-xs">{organizer}</p>
          <div className="flex items-center gap-1 mt-1">
            <p className="font-bold text-xs uppercase">{date}</p>
            <span className="text-dark-muted text-[10px]">•</span>
            <p className="text-dark-muted text-[10px]">{time}</p>
            {endTime && (
              <>
                <span className="text-dark-muted text-[10px]">-</span>
                <p className="text-dark-muted text-[10px]">{endTime}</p>
              </>
            )}
          </div>
          {description && (
            <p className="text-dark-muted text-xs mt-2 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
        {showInterestedButton && user && (
          <button
            onClick={handleInterestToggle}
            disabled={isLoading}
            className={`flex-1 min-w-[120px] justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              isInterested
                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart size={13} className={isInterested ? 'fill-green-300' : ''} />
            {isLoading ? '...' : 'Interested'}
          </button>
        )}
        {chatButton}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/directions/${location}`);
          }}
          className="flex-1 min-w-[100px] justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
        >
          <Navigation size={13} />
          Directions
        </button>
      </div>
    </div>
  );
};

export default EventCard;
