import mongoose from "mongoose";
import User from "../models/user.model";
import Event from "../models/event.model";
import InterestedUsers from "../models/interestedUsers.model";
import { UserRole } from "../models/userRole";
import dotenv from "dotenv";
import path from "path";

// Load .env from the server root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/festify";

// ==========================================
// CONFIGURATION: Adjust these values to mock
// your desired scenario!
// ==========================================

const NUM_USERS = 100; // Number of mock users to generate

// The ratio for each batch. Should add up to ~1.0
const BATCH_RATIOS = {
  f2022: 0.15, // 15%
  f2023: 0.25, // 25%
  f2024: 0.30, // 30%
  f2025: 0.30, // 30%
};

// Define higher interest categories. Default weight is 1.0.
// If an event matches a key here, it's 'weight' times more likely
// to be liked by a generated user.
const CATEGORY_WEIGHTS: Record<string, number> = {
  "Music": 5.0,     
  "Dance": 4.0,     
  "Cultural": 3.5,  
  "Technical": 2.0, 
  "Esports": 3.0,
  "Workshop": 1.5,
  "Sports": 2.5
};

// Base probability (e.g. 0.05 means 5% chance a random user likes a generic event)
const BASE_INTEREST_PROBABILITY = 0.05; 

// Time window for when the mock users and their "interests" were created.
// Useful for seeing interest spread over time in analytics.
const START_TIME = new Date("2026-04-01T00:00:00Z");
const END_TIME = new Date("2026-04-19T00:00:00Z");

// ==========================================

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function runSeeder() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Generate Users
    const usersToCreate = [];
    console.log(`Generating ${NUM_USERS} mock users...`);
    
    for (let i = 0; i < NUM_USERS; i++) {
      let rand = Math.random();
      let selectedBatch = "f2025";
      let cumulative = 0;
      for (const [batch, ratio] of Object.entries(BATCH_RATIOS)) {
        cumulative += ratio;
        if (rand <= cumulative) {
          selectedBatch = batch;
          break;
        }
      }

      const idNum = Math.floor(1000 + Math.random() * 9000);
      const email = `${selectedBatch}${idNum}@dubai.bits-pilani.ac.in`;
      
      usersToCreate.push({
        googleId: `mock_${selectedBatch}_${idNum}_${Date.now()}_${Math.random()}`,
        email,
        name: `Mock User ${selectedBatch.toUpperCase()}-${idNum}`,
        role: UserRole.FestAttendee,
        createdAt: getRandomDate(START_TIME, END_TIME)
      });
    }

    const createdUsers = await User.insertMany(usersToCreate);
    console.log(`Created ${createdUsers.length} mock users.`);

    // 2. Fetch Events
    const events = await Event.find({});
    if (events.length === 0) {
      console.log("No events found in the database! Run this script after you've created some events in the app.");
      process.exit(0);
    }
    console.log(`Found ${events.length} events to assign interests.`);

    // 3. Generate Interests
    const interestsToCreate = [];
    let interestCount = 0;

    for (const user of createdUsers) {
      for (const event of events) {
        const categoryWeight = CATEGORY_WEIGHTS[event.category] || 1.0;
        const probability = Math.min(BASE_INTEREST_PROBABILITY * categoryWeight, 1.0);

        if (Math.random() <= probability) {
          // User is interested!
          const interestDate = getRandomDate(new Date(user.createdAt), END_TIME);

          interestsToCreate.push({
            userId: user._id,
            eventId: event._id,
            createdAt: interestDate,
            updatedAt: interestDate
          });

          // Also push to event's interestedUsers array directly
          event.interestedUsers.push(user._id as mongoose.Types.ObjectId);
          interestCount++;
        }
      }
    }

    if (interestsToCreate.length > 0) {
      // Create interested users pivot records
      await InterestedUsers.insertMany(interestsToCreate);
      console.log(`Created ${interestCount} interested user records.`);
      
      // Save all updated events back to DB
      for (const event of events) {
        await event.save();
      }
      console.log(`Updated event.interestedUsers arrays in DB.`);
    }

    console.log("\nMock data seeding completed successfully! 🎉");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

runSeeder();
