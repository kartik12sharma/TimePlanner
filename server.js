import "dotenv/config";
import express from "express";
import session from "express-session";
import { connectDB } from "./backend/db.js";
import passport from "./backend/passport.js";
import healthRoutes from "./backend/routes/health.js";
import userRoutes from "./backend/routes/users.js";
import academicRoutes from "./backend/routes/academic.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static("client/build"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/health", healthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/academic", academicRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
