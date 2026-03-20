import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { getDB } from "./db.js";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const db = getDB();
      const user = await db.collection("users").findOne({ username });

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password" });
      }

      return done(null, user);
    } catch (_err){
      return done(_err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = getDB();
    const { ObjectId } = await import("mongodb");
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (_err) {
    done(_err);
  }
});

export default passport;
