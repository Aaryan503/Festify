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

// Update an event
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
