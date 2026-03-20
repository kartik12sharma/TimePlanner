import { Router } from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import passport from "../passport.js";
import { getDB } from "../db.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const db = getDB();
    const existing = await db.collection("users").findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username,
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
    };

    await db.collection("users").insertOne(newUser);
    res.status(201).json({ message: "User created successfully" });
  } catch {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(200).json({
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
        },
      });
    });
  })(req, res, next);
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.status(200).json({ message: "Logged out successfully" });
  });
});

router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.status(200).json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: { password: 0 } }
      );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { username, role } = req.body;
    const db = getDB();

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { username, role } }
      );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User updated successfully" });
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
