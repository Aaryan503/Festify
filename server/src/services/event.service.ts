// src/services/event.service.ts
import InterestedUser from "../models/interestedUsers.model";
import { getBatchFromEmail } from "../utils/emailParser"; 

//Service function to aggregate and process event analytics.

export const generateEventAnalytics = async (eventId: string) => {
  // 1. Fetch data with a JOIN to get user emails
  const interestedList = await InterestedUser.find({ eventId: eventId })
                                             .populate("userId", "email");

  // 2. Initialize our contract/object
  const analytics = {
    totalInterested: interestedList.length,
    yearBreakdown: {} as Record<string, number>
  };

  // 3. Process each entry using our Utility function
  interestedList.forEach((entry: any) => {
    if (entry.userId && entry.userId.email) {
      const batch = getBatchFromEmail(entry.userId.email);
      analytics.yearBreakdown[batch] = (analytics.yearBreakdown[batch] || 0) + 1;
    }
  });

  return analytics;
};

//Temporary Function
export const getFestAnalyticsData = async () => {
  // MOCK DATA: We will replace this with Mongoose Aggregation pipelines later.
  return {
    totalUniqueInterested: 142,
    topEvents: [
      { title: "Comedy Night", interestedCount: 85 },
      { title: "RoboWars", interestedCount: 62 },
      { title: "Jonita Gandhi", interestedCount: 45 },
      { title: "Binary Battles", interestedCount: 38 },
      { title: "Dance Off", interestedCount: 29 }
    ]
  };
};