import { MapPin } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
}: EventCardProps) => {
  const [isInterested, setIsInterested] = useState(initialInterestedStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  if (variant === 'featured' && image) {
    return (
      <div className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-dark-accent/30 transition-all duration-300">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
        <div className="p-4">
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
          {showInterestedButton && user && (
            <button
              onClick={async (e) => {
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
                } catch (error) {
                  console.error('Error toggling interest:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className={`mt-3 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isInterested
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? '...' : (isInterested ? 'Interested' : 'Mark as Interested')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-dark-accent/30 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-accent to-purple-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {title.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-tight">{title}</h3>
          <p className="text-dark-muted text-xs">{organizer}</p>
          {description && (
            <p className="text-dark-muted text-xs mt-1 line-clamp-1">{description}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-xs uppercase">{date}</p>
        <p className="text-dark-muted text-[10px]">{time}</p>
        {endTime && (
          <p className="text-dark-muted text-[10px]">End: {endTime}</p>
        )}
        {showInterestedButton && user && (
          <button
            onClick={async (e) => {
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
              } catch (error) {
                console.error('Error toggling interest:', error);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className={`mt-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isInterested
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '...' : (isInterested ? 'Interested' : 'Interested')}
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;
