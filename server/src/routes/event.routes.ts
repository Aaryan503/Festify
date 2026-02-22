import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import Event from "../models/event.model";
import { UserRole } from "../models/userRole";

const router = express.Router();

// Create an event 
router.post("/", isAuthenticated, async (req, res) => {
  try {
    // Check if user is an event manager
    if (req.user?.role !== UserRole.EventManager && req.user?.role !== UserRole.FestOrganizingBody) {
         return res.status(403).json({ message: "Access denied. Only managers can create events." });
    }

    const { title, description, image, location, startTime, endTime, category } = req.body;

    const event = await Event.create({
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

    // Build search filter - only by event name (title)
    const filter: any = {};

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

    // Build filter object
    const filter: any = {};

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

export default router;
