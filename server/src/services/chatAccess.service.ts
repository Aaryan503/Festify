import { Types } from "mongoose";
import Event from "../models/event.model";
import InterestedUsers from "../models/interestedUsers.model";
import User from "../models/user.model";
import { UserRole } from "../models/userRole";

export interface ChatAccessContext {
  eventId: string;
  organizerId: string;
  participantIds: Set<string>;
  adminIds: Set<string>;
}

export const getChatAccessContext = async (
  eventId: string
): Promise<ChatAccessContext | null> => {
  if (!Types.ObjectId.isValid(eventId)) {
    return null;
  }

  const event = await Event.findById(eventId).select("organizer").lean();
  if (!event) {
    return null;
  }

  const [interests, fobUsers] = await Promise.all([
    InterestedUsers.find({ eventId }).select("userId").lean(),
    User.find({ role: UserRole.FestOrganizingBody }).select("_id").lean(),
  ]);

  const organizerId = event.organizer.toString();
  const participantIds = new Set<string>([organizerId]);
  const adminIds = new Set<string>([organizerId]);

  for (const interest of interests) {
    participantIds.add(interest.userId.toString());
  }

  for (const user of fobUsers) {
    const userId = user._id.toString();
    participantIds.add(userId);
    adminIds.add(userId);
  }

  return {
    eventId,
    organizerId,
    participantIds,
    adminIds,
  };
};

export const isParticipant = (userId: string, context: ChatAccessContext): boolean => {
  return context.participantIds.has(userId);
};

export const isChatAdmin = (userId: string, context: ChatAccessContext): boolean => {
  return context.adminIds.has(userId);
};
