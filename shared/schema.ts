import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles
export const userRoles = [
  "admin",     // Full access to all features
  "manager",   // Can view all expenses, approve, but limited settings access
  "accountant", // Can manage expenses and reports
  "user",      // Basic access (default)
] as const;

export type UserRole = typeof userRoles[number];

export const userStatus = [
  "pending",  // Waiting for admin approval
  "active",   // Approved and active
  "rejected", // Rejected by admin
] as const;

export type UserStatus = typeof userStatus[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email").notNull().unique(),
  mobile: text("mobile"),
  role: text("role").$type<UserRole>().default("user"),
  status: text("status").$type<UserStatus>().default("pending"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").notNull(),
});

export const paymentMethods = [
  "UPI",
  "Cash",
  "Card",
  "Bank Transfer",
  "Cheque",
] as const;

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  categoryId: integer("category_id").notNull(),
  materialName: text("material_name").notNull(),
  vendorName: text("vendor_name").notNull(),
  amount: doublePrecision("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  description: text("description"),
  receiptPath: text("receipt_path"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  mobile: true,
  role: true,
  status: true,
}).extend({
  role: z.enum(userRoles).default("user"),
  status: z.enum(userStatus).default("pending"),
  mobile: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  color: true,
  userId: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  date: true,
  categoryId: true,
  materialName: true,
  vendorName: true,
  amount: true,
  paymentMethod: true,
  description: true,
  receiptPath: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;

export type PaymentMethod = typeof paymentMethods[number];

export const userLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export type UserLogin = z.infer<typeof userLoginSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[0-9])/, "Password must contain at least one letter and one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type PasswordReset = z.infer<typeof passwordResetSchema>;

export type ExpenseWithCategory = Expense & {
  category: Category;
};

export type DateFilter = {
  startDate: Date;
  endDate: Date;
};

export type ExpenseSummary = {
  totalAmount: number;
  highestCategory: {
    name: string;
    amount: number;
    percentage: number;
  } | null;
  mostUsedPaymentMethod: {
    method: string;
    count: number;
  } | null;
  pendingReceipts: number;
};

export type CategoryDistribution = {
  categoryId: number;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
};

export type PaymentMethodDistribution = {
  method: string;
  amount: number;
  count: number;
  percentage: number;
};

export type MonthlyExpense = {
  month: string;
  amount: number;
};
