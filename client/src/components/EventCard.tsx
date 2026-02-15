import { MapPin } from 'lucide-react';

interface EventCardProps {
  title: string;
  organizer: string;
  date: string;
  time: string;
  image?: string;
  location?: string;
  variant?: 'list' | 'featured';
}

const EventCard = ({
  title,
  organizer,
  date,
  time,
  image,
  location,
  variant = 'list',
}: EventCardProps) => {
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
          <p className="text-sm font-bold text-white">{date} {time}</p>
          <p className="text-dark-muted text-xs flex items-center gap-1 mt-1">
            <MapPin size={12} />
            {location || 'TBD'}
          </p>
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
        <div>
          <h3 className="font-semibold text-sm leading-tight">{title}</h3>
          <p className="text-dark-muted text-xs">{organizer}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-xs uppercase">{date}</p>
        <p className="text-dark-muted text-[10px]">{time}</p>
      </div>
    </div>
  );
};

export default EventCard;
