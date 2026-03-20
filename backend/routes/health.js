import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../db.js";
import {
  detectConflicts,
  validateSchedule,
} from "../algorithms/healthScheduler.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const isAdmin = req.user.role === "admin";
    const query = isAdmin ? {} : { userId: req.user._id.toString() };
    const goals = await getDB().collection("healthGoals").find(query).toArray();
    res.status(200).json(goals);
  } catch {
    res.status(500).json({ error: "Failed to fetch health goals" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const goal = await getDB()
      .collection("healthGoals")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.status(200).json(goal);
  } catch {
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      description,
      priority,
      startTime,
      endTime,
      days,
      startDate,
      endDate,
    } = req.body;

    if (
      !description ||
      !priority ||
      !startTime ||
      !endTime ||
      !days ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const userId = req.user?._id.toString();

    const newGoal = {
      description,
      category: "health",
      priority,
      startTime,
      endTime,
      days,
      startDate,
      endDate,
      userId,
      createdAt: new Date(),
    };

    const existingHealthGoals = await getDB()
      .collection("healthGoals")
      .find({ userId })
      .toArray();
    const existingAcademicGoals = await getDB()
      .collection("academicGoals")
      .find({ userId })
      .toArray();
    const allGoals = [...existingHealthGoals, ...existingAcademicGoals];
    const conflicts = detectConflicts(newGoal, allGoals);

    if (conflicts.length > 0) {
      return res
        .status(409)
        .json({ error: "Conflict detected", conflicts, newGoal });
    }

    const allGoalsForValidation = [...existingHealthGoals, newGoal];
    const warnings = validateSchedule(allGoalsForValidation);

    const result = await getDB().collection("healthGoals").insertOne(newGoal);
    res.status(201).json({ ...newGoal, _id: result.insertedId, warnings });
  } catch {
    res.status(500).json({ error: "Failed to create health goal" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      description,
      priority,
      startTime,
      endTime,
      days,
      startDate,
      endDate,
    } = req.body;

    const result = await getDB()
      .collection("healthGoals")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            description,
            category: "health",
            priority,
            startTime,
            endTime,
            days,
            startDate,
            endDate,
          },
        }
      );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Goal not found" });
    res.status(200).json({ message: "Goal updated successfully" });
  } catch {
    res.status(500).json({ error: "Failed to update health goal" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await getDB()
      .collection("healthGoals")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Goal not found" });
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete health goal" });
  }
});

export default router;
