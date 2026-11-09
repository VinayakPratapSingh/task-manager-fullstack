
import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";

const router = express.Router();

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;

// GET /api/tasks - Fetch all tasks.
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id - Fetch one task.
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Create a task.
router.post("/", async (req, res, next) => {
  try {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an object",
      });
    }

    const allowedFields = ["title", "description"];

    if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
      return res.status(400).json({
        success: false,
        message: "Only title and description are allowed",
      });
    }

    const { title, description = "" } = body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (title.trim().length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Title cannot exceed ${MAX_TITLE_LENGTH} characters`,
      });
    }

    if (
      typeof description !== "string" ||
      description.trim().length > MAX_DESCRIPTION_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters and must be text`,
      });
    }

    const task = await Task.create({
      title,
      description,
      user: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id - Update a task.
router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const allowedFields = ["title", "description", "completed"];
    const fields = Object.keys(body);

    if (fields.some((field) => !allowedFields.includes(field))) {
      return res.status(400).json({
        success: false,
        message: "Only title, description, and completed can be updated",
      });
    }

    if (
      Object.hasOwn(body, "title") &&
      (typeof body.title !== "string" ||
        !body.title.trim() ||
        body.title.trim().length > MAX_TITLE_LENGTH)
    ) {
      return res.status(400).json({
        success: false,
        message: `Title must be non-empty and cannot exceed ${MAX_TITLE_LENGTH} characters`,
      });
    }

    if (
      Object.hasOwn(body, "description") &&
      (typeof body.description !== "string" ||
        body.description.trim().length > MAX_DESCRIPTION_LENGTH)
    ) {
      return res.status(400).json({
        success: false,
        message: `Description must be text and cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      });
    }

    if (
      Object.hasOwn(body, "completed") &&
      typeof body.completed !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Completed must be true or false",
      });
    }

    const updates = {};

    if (Object.hasOwn(body, "title")) {
      updates.title = body.title.trim();
    }

    if (Object.hasOwn(body, "description")) {
      updates.description = body.description.trim();
    }

    if (Object.hasOwn(body, "completed")) {
      updates.completed = body.completed;
    }

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );
    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Delete a task.
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: deletedTask,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
