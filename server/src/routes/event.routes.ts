import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import Event from "../models/event.model";
import InterestedUsers from "../models/interestedUsers.model";
import { UserRole } from "../models/userRole";
import { generateEventAnalytics } from "../services/event.service";
import { getFestAnalyticsData } from '../services/event.service';


const router = express.Router();

// Public browsing should only show approved events.
// For backwards compatibility with older events that may not yet have `status`,
// we treat missing status as "accepted".
const PUBLIC_APPROVED_FILTER: any = {
  $or: [{ status: "accepted" }, { status: { $exists: false } }],
};

// Valid campus venues (must match navigationGraph venue names)
const VALID_VENUES = [
  "Room F103",
  "Lecture Theater Complex",
  "Room F208",
  "Room G206",
  "Room G104",
  "Library Lawns",
  "Library",
  "Amphitheatre",
  "E Block Entrance",
  "Stage 1",
];

// Create an event 
router.post("/", isAuthenticated, async (req, res) => {
  try {
    // Check if user is an event manager
    if (req.user?.role !== UserRole.EventManager && req.user?.role !== UserRole.FestOrganizingBody) {
         return res.status(403).json({ message: "Access denied. Only managers can create events." });
    }

    const { title, description, image, location, startTime, endTime, category } = req.body;

    // Validate: event must be in the future
    if (new Date(startTime) <= new Date()) {
      return res.status(400).json({ message: "Event must be scheduled in the future." });
    }

    // Validate: location must be a known campus venue
    if (!VALID_VENUES.includes(location)) {
      return res.status(400).json({ message: `Invalid venue. Must be one of: ${VALID_VENUES.join(", ")}` });
    }

    const status =
      req.user?.role === UserRole.FestOrganizingBody ? "accepted" : "pending";

    const event = await Event.create({
      status,
      title,
      description,
      image,
      location,
      startTime,
      endTime,
      category,
      organizer: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all events for home page
router.get("/", async (req, res) => {
  try {
    const events = await Event.find(PUBLIC_APPROVED_FILTER)
      .populate("organizer", "name email")
      .sort({ startTime: 1 })
      .lean();
    res.json(events);
  } catch (error) {
    console.error("Error fetching all events:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get logged-in user's events
router.get("/my-events", isAuthenticated, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user?._id }).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search events by name only
router.get("/search", async (req, res) => {
  try {
    const {
      name,
      page = "1",
      limit = "10",
      sortBy = "startTime",
      sortOrder = "asc",
    } = req.query;

    // Build search filter - only by event name (title) + public approved events
    const filter: any = { ...PUBLIC_APPROVED_FILTER };

    if (name && typeof name === "string") {
      filter.title = { $regex: name, $options: "i" };
    }
    // If no name provided, filter remains empty and returns all events

    // Pagination parameters
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10))); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Sort parameters
    const sortOptions: any = {};
    const validSortFields = ["startTime", "endTime", "title", "createdAt"];
    const sortFieldStr = typeof sortBy === "string" ? sortBy : "startTime";
    const sortField: string = validSortFields.includes(sortFieldStr) ? sortFieldStr : "startTime";
    const sortOrderStr = typeof sortOrder === "string" ? sortOrder : "asc";
    sortOptions[sortField] = sortOrderStr === "desc" ? -1 : 1;

    // Execute query with pagination
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      events,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error searching events:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Filter events by dates, times, location, category, etc.
router.get("/filter", async (req, res) => {
  try {
    const {
      category,
      location,
      startDate,
      endDate,
      startTime,
      endTime,
      page = "1",
      limit = "10",
      sortBy = "startTime",
      sortOrder = "asc",
    } = req.query;

    // Build filter object (public approved events only)
    const filter: any = { ...PUBLIC_APPROVED_FILTER };

    // Category filter
    if (category && typeof category === "string") {
      filter.category = category;
    }

    // Location filter (case-insensitive)
    if (location && typeof location === "string") {
      filter.location = { $regex: location, $options: "i" };
    }

    // Date range filters
    if (startDate && typeof startDate === "string") {
      const startDateTime = new Date(startDate);
      if (startTime && typeof startTime === "string") {
        // Combine date and time
        const [hours, minutes] = startTime.split(":");
        startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      filter.startTime = { ...filter.startTime, $gte: startDateTime };
    }

    if (endDate && typeof endDate === "string") {
      const endDateTime = new Date(endDate);
      if (endTime && typeof endTime === "string") {
        // Combine date and time
        const [hours, minutes] = endTime.split(":");
        endDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 59, 999);
      } else {
        // If only date is provided, set to end of day
        endDateTime.setHours(23, 59, 59, 999);
      }
      filter.endTime = { ...filter.endTime, $lte: endDateTime };
    }

    // Time-only filters (for events on any date)
    if (startTime && typeof startTime === "string" && !startDate) {
      const [hours, minutes] = startTime.split(":");
      const today = new Date();
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      filter.startTime = { ...filter.startTime, $gte: today };
    }

    if (endTime && typeof endTime === "string" && !endDate) {
      const [hours, minutes] = endTime.split(":");
      const today = new Date();
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 59, 999);
      filter.endTime = { ...filter.endTime, $lte: today };
    }

    // Pagination parameters
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10))); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Sort parameters
    const sortOptions: any = {};
    const validSortFields = ["startTime", "endTime", "title", "createdAt"];
    const sortFieldStr = typeof sortBy === "string" ? sortBy : "startTime";
    const sortField: string = validSortFields.includes(sortFieldStr) ? sortFieldStr : "startTime";
    const sortOrderStr = typeof sortOrder === "string" ? sortOrder : "asc";
    sortOptions[sortField] = sortOrderStr === "desc" ? -1 : 1;

    // Execute query with pagination
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      events,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error filtering events:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/fest-analytics', isAuthenticated, async (req, res) => {
  try {
    const analytics = await getFestAnalyticsData();
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching fest analytics:', error);
    res.status(500).json({ message: 'Server error fetching fest analytics' });
  }
});

router.get("/:eventId/analytics", async (req, res) => {
  try {
    // Extract the dynamic ID from the URL (e.g., the "123" in /events/123/analytics)
    const { eventId } = req.params;
    
    // Call your new service
    const analyticsData = await generateEventAnalytics(eventId);
    
    // Send the JSON "contract" back
    res.status(200).json(analyticsData);
    
  } catch (error: any) {
    console.error("Failed to fetch analytics:", error);
    res.status(500).json({ message: "Failed to generate analytics data" });
  }
});

router.patch("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: "Access denied. You can only update your own events." });
    }

    const { title, description, image, location, startTime, endTime, category } = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { title, description, image, location, startTime, endTime, category },
      { new: true }
    );

    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== APPROVAL WORKFLOW ====================

// Fest Organizing Body: view pending events submitted by Event Managers
router.get("/approvals/pending", isAuthenticated, async (req, res) => {
  try {
    if (req.user?.role !== UserRole.FestOrganizingBody) {
      return res.status(403).json({ message: "Access denied." });
    }

    const pendingEvents = await Event.find({ status: "pending" })
      .populate({ path: "organizer", select: "name email role" })
      .sort({ startTime: 1 })
      .lean();

    const submittedByManagers = pendingEvents.filter(
      (e: any) => e.organizer?.role === UserRole.EventManager
    );

    res.json({ events: submittedByManagers });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fest Organizing Body: approve/reject pending events
router.patch("/:id/approval", isAuthenticated, async (req, res) => {
  try {
    if (req.user?.role !== UserRole.FestOrganizingBody) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;
    const { status } = req.body as { status?: "accepted" | "rejected" };

    if (!status || !["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use accepted or rejected." });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "pending") {
      return res.status(400).json({ message: `Event is not pending (current: ${event.status}).` });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("organizer", "name email role");

    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event approval status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an event
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: "Access denied. You can only delete your own events." });
    }

    await Event.findByIdAndDelete(id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== INTERESTED USERS CRUD OPERATIONS ====================

// CREATE: Add user's interest in an event
router.post("/:id/interested", isAuthenticated, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user?._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if already interested
    const existing = await InterestedUsers.findOne({ userId, eventId });
    if (existing) {
      return res.status(400).json({ message: "User is already interested in this event" });
    }

    // Add interest
    const interest = await InterestedUsers.create({ userId, eventId });
    
    // Update event's interestedUsers array
    await Event.findByIdAndUpdate(eventId, { $addToSet: { interestedUsers: userId } });

    res.status(201).json({ message: "Successfully marked as interested", interest });
  } catch (error) {
    console.error("Error adding interest:", error);
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return res.status(400).json({ message: "User is already interested in this event" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// READ: Check if user is interested in a specific event
router.get("/:id/interested/status", isAuthenticated, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user?._id;

    const interest = await InterestedUsers.findOne({ userId, eventId });
    res.json({ interested: !!interest });
  } catch (error) {
    console.error("Error checking interest status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// READ: Get all events a user is interested in
router.get("/interested/my-events", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const interests = await InterestedUsers.find({ userId })
      .populate({
        path: 'eventId',
        match: PUBLIC_APPROVED_FILTER,
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await InterestedUsers.countDocuments({ userId });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
        events: interests.map(interest => interest.eventId).filter((e) => !!e),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user's interested events:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// READ: Get all users interested in a specific event
router.get("/:id/interested/users", isAuthenticated, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { page = "1", limit = "10" } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const interests = await InterestedUsers.find({ eventId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await InterestedUsers.countDocuments({ eventId });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      users: interests.map(interest => interest.userId),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching interested users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE: Toggle interest (add if not exists, remove if exists)
router.post("/:id/interested/toggle", isAuthenticated, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user?._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if already interested
    const existing = await InterestedUsers.findOne({ userId, eventId });
    
    if (existing) {
      await InterestedUsers.deleteOne({ userId, eventId });
      await Event.findByIdAndUpdate(eventId, { $pull: { interestedUsers: userId } });
      res.json({ interested: false, message: "Removed from interested" });
    } else {
      // Add interest
      await InterestedUsers.create({ userId, eventId });
      await Event.findByIdAndUpdate(eventId, { $addToSet: { interestedUsers: userId } });
      res.json({ interested: true, message: "Added to interested" });
    }
  } catch (error) {
    console.error("Error toggling interest:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE: Remove user's interest in an event
router.delete("/:id/interested", isAuthenticated, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user?._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const result = await InterestedUsers.deleteOne({ userId, eventId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Interest not found" });
    }

    // Update event's interestedUsers array
    await Event.findByIdAndUpdate(eventId, { $pull: { interestedUsers: userId } });

    res.json({ message: "Successfully removed from interested" });
  } catch (error) {
    console.error("Error removing interest:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
