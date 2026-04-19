// src/services/event.service.ts
import InterestedUser from "../models/interestedUsers.model";
import ChatMessage from "../models/chatMessage.model";
import EventChat from "../models/eventChat.model";
import User from "../models/user.model";
import { getBatchFromEmail } from "../utils/emailParser";
import Event from "../models/event.model";
import mongoose from "mongoose";

// ======================== PER-EVENT ANALYTICS ========================

export const generateEventAnalytics = async (eventId: string) => {
  const eventObjectId = new mongoose.Types.ObjectId(eventId);

  // 1. Fetch event details
  const event = await Event.findById(eventId)
    .populate("organizer", "name email")
    .lean();

  if (!event) throw new Error("Event not found");

  // 2. Fetch interested users with emails
  const interestedList = await InterestedUser.find({ eventId })
    .populate("userId", "email name")
    .lean();

  const totalInterested = interestedList.length;

  // 3. Batch breakdown
  const yearBreakdown: Record<string, number> = {};
  interestedList.forEach((entry: any) => {
    if (entry.userId && entry.userId.email) {
      const batch = getBatchFromEmail(entry.userId.email);
      yearBreakdown[batch] = (yearBreakdown[batch] || 0) + 1;
    }
  });

  // 4. Chat message count for this event
  const eventChat = await EventChat.findOne({ eventId }).lean();
  let chatMessageCount = 0;
  let chatTimeline: { date: string; count: number }[] = [];
  let chatHourlyActivity: { hour: number; count: number }[] = [];

  if (eventChat) {
    chatMessageCount = await ChatMessage.countDocuments({ eventId: eventObjectId });

    // Chat messages per day
    const chatTimelineRaw = await ChatMessage.aggregate([
      { $match: { eventId: eventObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]);
    chatTimeline = chatTimelineRaw;

    // Chat messages by hour of day
    const chatHourlyRaw = await ChatMessage.aggregate([
      { $match: { eventId: eventObjectId } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: "$_id", count: 1 } },
    ]);
    // Fill all 24 hours
    const hourMap = new Map(chatHourlyRaw.map((h: any) => [h.hour, h.count]));
    chatHourlyActivity = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: (hourMap.get(i) || 0) as number,
    }));
  } else {
    chatHourlyActivity = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  }

  // 5. Engagement rate — interested / total platform users
  const totalUsers = await User.countDocuments();
  const engagementRate = totalUsers > 0 ? Math.round((totalInterested / totalUsers) * 100 * 10) / 10 : 0;

  // 6. Interest over time (daily sign-ups)
  const interestTimelineRaw = await InterestedUser.aggregate([
    { $match: { eventId: eventObjectId } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", count: 1 } },
  ]);

  // Convert to cumulative timeline
  let cumulative = 0;
  const interestTimeline = interestTimelineRaw.map((entry: any) => {
    cumulative += entry.count;
    return { date: entry.date, count: entry.count, cumulative };
  });

  // 7. Comparison with same-category and same-venue events
  const categoryComparison = await InterestedUser.aggregate([
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "event",
      },
    },
    { $unwind: "$event" },
    {
      $match: {
        "event.category": (event as any).category,
        "event.status": { $in: ["accepted", undefined] },
      },
    },
    {
      $group: {
        _id: "$eventId",
        title: { $first: "$event.title" },
        interestedCount: { $sum: 1 },
      },
    },
    { $sort: { interestedCount: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        eventId: "$_id",
        title: 1,
        interestedCount: 1,
        isCurrentEvent: { $eq: ["$_id", eventObjectId] },
      },
    },
  ]);

  const venueComparison = await InterestedUser.aggregate([
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "event",
      },
    },
    { $unwind: "$event" },
    {
      $match: {
        "event.location": (event as any).location,
        "event.status": { $in: ["accepted", undefined] },
      },
    },
    {
      $group: {
        _id: "$eventId",
        title: { $first: "$event.title" },
        interestedCount: { $sum: 1 },
      },
    },
    { $sort: { interestedCount: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        eventId: "$_id",
        title: 1,
        interestedCount: 1,
        isCurrentEvent: { $eq: ["$_id", eventObjectId] },
      },
    },
  ]);

  return {
    eventDetails: {
      title: (event as any).title,
      category: (event as any).category,
      location: (event as any).location,
      startTime: (event as any).startTime,
      endTime: (event as any).endTime,
      organizer: (event as any).organizer?.name || "Unknown",
    },
    totalInterested,
    chatMessageCount,
    engagementRate,
    yearBreakdown,
    interestTimeline,
    chatTimeline,
    chatHourlyActivity,
    categoryComparison,
    venueComparison,
  };
};

// ======================== FEST-WIDE ANALYTICS ========================

export const getFestAnalyticsData = async () => {
  // 1. Total Unique Interested Users
  const uniqueUsers = await InterestedUser.distinct("userId");
  const totalUniqueInterested = uniqueUsers.length;

  // 2. Total accepted events
  const totalEvents = await Event.countDocuments({
    $or: [{ status: "accepted" }, { status: { $exists: false } }],
  });

  // 3. Total chat messages across all events
  const totalChatMessages = await ChatMessage.countDocuments();

  // 4. Average interest per event
  const totalInterests = await InterestedUser.countDocuments();
  const avgInterestPerEvent = totalEvents > 0 ? Math.round((totalInterests / totalEvents) * 10) / 10 : 0;

  // 5. Top 5 Performing Events
  const topEvents = await InterestedUser.aggregate([
    {
      $group: {
        _id: "$eventId",
        interestedCount: { $sum: 1 },
      },
    },
    { $sort: { interestedCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "_id",
        as: "eventDetails",
      },
    },
    { $unwind: "$eventDetails" },
    {
      $project: {
        _id: 0,
        title: "$eventDetails.title",
        interestedCount: 1,
      },
    },
  ]);

  // 6. Category Distribution
  const categoryDistribution = await Event.aggregate([
    {
      $match: {
        $or: [{ status: "accepted" }, { status: { $exists: false } }],
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $project: { _id: 0, category: "$_id", count: 1 } },
  ]);

  // 7. Interest Trend (daily sign-ups across all events)
  const interestTrend = await InterestedUser.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", count: 1 } },
  ]);

  // 8. Overall Batch Breakdown
  const allInterested = await InterestedUser.find()
    .populate("userId", "email")
    .lean();
  const overallBatchBreakdown: Record<string, number> = {};
  allInterested.forEach((entry: any) => {
    if (entry.userId && entry.userId.email) {
      const batch = getBatchFromEmail(entry.userId.email);
      overallBatchBreakdown[batch] = (overallBatchBreakdown[batch] || 0) + 1;
    }
  });

  // 9. Events Timeline (events per day based on startTime)
  const eventsTimeline = await Event.aggregate([
    {
      $match: {
        $or: [{ status: "accepted" }, { status: { $exists: false } }],
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", count: 1 } },
  ]);

  // 10. Venue Popularity (total interested grouped by event location)
  const venuePopularity = await InterestedUser.aggregate([
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "event",
      },
    },
    { $unwind: "$event" },
    {
      $group: {
        _id: "$event.location",
        interestedCount: { $sum: 1 },
      },
    },
    { $sort: { interestedCount: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, venue: "$_id", interestedCount: 1 } },
  ]);

  return {
    totalUniqueInterested,
    totalEvents,
    totalChatMessages,
    avgInterestPerEvent,
    topEvents,
    categoryDistribution,
    interestTrend,
    overallBatchBreakdown,
    eventsTimeline,
    venuePopularity,
  };
};