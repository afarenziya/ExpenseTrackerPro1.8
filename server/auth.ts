import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "expense-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours by default
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else if (user.status !== "active") {
        return done(null, false, { message: "Account not active. Please wait for admin approval." });
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate required fields
      if (!req.body.email) {
        console.error("Registration error: Email is missing");
        return res.status(400).json({ message: "Email is required" });
      }

      if (!req.body.username) {
        console.error("Registration error: Username is missing");
        return res.status(400).json({ message: "Username is required" });
      }

      if (!req.body.password) {
        console.error("Registration error: Password is missing");
        return res.status(400).json({ message: "Password is required" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        console.error("Registration error: Username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.error("Registration error: Email already in use");
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create user with pending status
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        status: "pending",
      });

      // Send registration confirmation email
      try {
        const { sendRegistrationEmail } = await import('./email');
        await sendRegistrationEmail(user.email, user.name || user.username);
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        return res.status(500).json({ message: "Failed to send confirmation email", reason: emailError.message });
      }

      // Return success response (but don't log them in yet)
      res.status(201).json({ 
        message: "Signup successful. Your account is pending approval.", 
        username: user.username 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        message: "Registration failed", 
        reason: error.message || "Unknown error occurred" 
      });
    }
  });

  app.post("/api/login", passport.authenticate("local"), async (req, res) => {
    // Update session cookie expiration if rememberMe is true
    if (req.body.rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }
    
    // Update last login time
    if (req.user) {
      await storage.updateUserLoginTime(req.user.id);
    }
    
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Password reset request (forgot password)
  app.post("/api/password-reset-request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).send("Email is required");
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security reasons, still return a success message even if the email doesn't exist
        return res.status(200).json({ message: "If your email exists in our system, you will receive a password reset link." });
      }
      
      // Generate a reset token
      const token = await storage.createPasswordResetToken(email);
      
      // Send password reset email
      const { sendPasswordResetEmail } = await import('./email');
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, user.name || user.username, resetLink);
      
      res.status(200).json({ message: "If your email exists in our system, you will receive a password reset link." });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).send("Password reset request failed");
    }
  });
  
  // Password reset (with token)
  app.post("/api/password-reset", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).send("Token and password are required");
      }
      
      // Find user by token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).send("Invalid or expired token");
      }
      
      // Update password
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).send("Password reset failed");
    }
  });
}
