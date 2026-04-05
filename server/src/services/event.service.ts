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


// export const generateEventAnalytics = async (eventId: string) => {
//   // TEMPORARY MOCK DATA 
//   console.log(`Mocking analytics for event: ${eventId}`);
  
//   return {
//     totalInterested: 42,
//     yearBreakdown: {
//       "23 batch": 15,
//       "24 batch": 12,
//       "25 batch": 10,
//       "26 batch": 5
//     }
//   };
// };