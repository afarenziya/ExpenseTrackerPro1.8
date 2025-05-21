import { 
  categories, 
  expenses, 
  type Category, 
  type Expense, 
  type InsertCategory, 
  type InsertExpense, 
  type InsertUser, 
  type User, 
  type ExpenseWithCategory, 
  type DateFilter, 
  type ExpenseSummary, 
  type CategoryDistribution, 
  type PaymentMethodDistribution, 
  type MonthlyExpense, 
  users,
  type UserStatus,
  type UserRole
} from "@shared/schema";
import session from "express-session";
import { scrypt } from "crypto";
import { promisify } from "util";
import createMemoryStore from "memorystore";
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Reverting to in-memory storage implementation
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, status: UserStatus): Promise<User | undefined>;
  getPendingUsers(): Promise<User[]>;
  updateUserLoginTime(id: number): Promise<User | undefined>;
  createPasswordResetToken(email: string): Promise<string | null>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(id: number, password: string): Promise<User | undefined>;
  
  // Category methods
  getCategories(userId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Expense methods
  getExpenses(userId: number, filter?: DateFilter): Promise<ExpenseWithCategory[]>;
  getExpense(id: number): Promise<ExpenseWithCategory | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Dashboard methods
  getExpenseSummary(userId: number, filter?: DateFilter): Promise<ExpenseSummary>;
  getCategoryDistribution(userId: number, filter?: DateFilter): Promise<CategoryDistribution[]>;
  getPaymentMethodDistribution(userId: number, filter?: DateFilter): Promise<PaymentMethodDistribution[]>;
  getMonthlyExpenseTrend(userId: number, months: number): Promise<MonthlyExpense[]>;
  getRecentExpenses(userId: number, limit: number): Promise<ExpenseWithCategory[]>;
  
  // Other
  sessionStore: any; // Using any to avoid type issues with different session stores
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private expenses: Map<number, Expense>;
  sessionStore: any; // Using any for the session store type
  userCurrentId: number;
  categoryCurrentId: number;
  expenseCurrentId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.expenses = new Map();
    this.userCurrentId = 1;
    this.categoryCurrentId = 1;
    this.expenseCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add default categories and users for demo purposes
    this.createDefaultCategories();
    this.createDefaultUsers();
  }
  
  // Added to hash Ajay's password
  private async hashAjayPassword(password: string): Promise<string> {
    const salt = "92b0cd78aad9d4e1540dfe369c4425f0"; // Use the same salt for consistency
    const buffer = await scryptAsync(password, salt, 64) as Buffer;
    return `${buffer.toString("hex")}.${salt}`;
  }

  private createDefaultCategories() {
    const defaultCategories = [
      { name: "Office Supplies", color: "#1A73E8" },
      { name: "Travel", color: "#34A853" },
      { name: "Utilities", color: "#FBBC05" },
      { name: "Marketing", color: "#EA4335" },
      { name: "Office Rent", color: "#9C27B0" },
    ];
    
    // These will be assigned to users as they register
  }
  
  private async createDefaultUsers() {
    // This is just for development/demo purposes
    // In production, we would never store passwords directly like this
    const hashedPassword = "08bd740ec4e737ac8cc4f62879bfabf764d9be4ed88841ba36c5f7856c38132a06d6d5a89743e5f9d2078908b2342bf99831052e052733dfcc5f82fb833568cf.92b0cd78aad9d4e1540dfe369c4425f0"; // "password123"
    
    // Generate hash for Ajay's password
    const ajayPassword = await this.hashAjayPassword("Ajay@1995");
    
    // Create default users with different roles
    const defaultUsers = [
      { 
        username: "ajay", 
        password: ajayPassword, 
        name: "Ajay Farenziya", 
        email: "afarenziya@gmail.com",
        role: "admin" as UserRole,
        status: "active" as UserStatus,
        createdAt: new Date()
      },
      { 
        username: "admin", 
        password: hashedPassword, 
        name: "Admin User", 
        email: "admin@ajayfarenziya.com",
        role: "admin" as UserRole,
        status: "active" as UserStatus,
        createdAt: new Date()
      },
      { 
        username: "accountant", 
        password: hashedPassword, 
        name: "Accountant User", 
        email: "accountant@ajayfarenziya.com",
        role: "accountant" as UserRole,
        status: "active" as UserStatus,
        createdAt: new Date()
      },
      { 
        username: "manager", 
        password: hashedPassword, 
        name: "Manager User", 
        email: "manager@ajayfarenziya.com",
        role: "manager" as UserRole,
        status: "active" as UserStatus,
        createdAt: new Date()
      },
      { 
        username: "user", 
        password: hashedPassword, 
        name: "Regular User", 
        email: "user@ajayfarenziya.com",
        role: "user" as UserRole, 
        status: "active" as UserStatus,
        createdAt: new Date()
      },
    ];
    
    // Create users if they don't exist
    for (const userData of defaultUsers) {
      const existingUser = await this.getUserByUsername(userData.username);
      if (!existingUser) {
        const id = this.userCurrentId++;
        // Ensure all required fields are properly typed
        const user: User = { 
          id,
          username: userData.username,
          password: userData.password,
          name: userData.name,
          email: userData.email,
          mobile: null,
          role: userData.role as UserRole,
          status: userData.status as UserStatus,
          createdAt: userData.createdAt,
          resetToken: null,
          resetTokenExpiry: null,
          lastLogin: null
        };
        this.users.set(id, user);
        
        // Create default categories for each user
        const defaultCategories = [
          { name: "Office Supplies", color: "#1A73E8", userId: id },
          { name: "Travel", color: "#34A853", userId: id },
          { name: "Utilities", color: "#FBBC05", userId: id },
          { name: "Marketing", color: "#EA4335", userId: id },
          { name: "Office Rent", color: "#9C27B0", userId: id },
        ];
        
        for (const category of defaultCategories) {
          await this.createCategory(category);
        }
      }
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.status === "pending"
    );
  }
  
  async updateUserStatus(id: number, status: UserStatus): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, status };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserLoginTime(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, lastLogin: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    // Set token expiry to 1 hour from now
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    
    // Update user with reset token
    const updatedUser = { 
      ...user, 
      resetToken: token,
      resetTokenExpiry: expiry 
    };
    
    this.users.set(user.id, updatedUser);
    return token;
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const now = new Date();
    
    return Array.from(this.users.values()).find(
      (user) => 
        user.resetToken === token && 
        user.resetTokenExpiry && 
        new Date(user.resetTokenExpiry) > now
    );
  }
  
  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      password, 
      resetToken: null, 
      resetTokenExpiry: null 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    
    // Ensure all required fields are properly typed
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name || null,
      email: insertUser.email,
      mobile: insertUser.mobile || null,
      role: insertUser.role,
      status: insertUser.status || "pending",
      createdAt: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
      lastLogin: null
    };
    
    this.users.set(id, user);
    
    // Create default categories for the new user
    const defaultCategories = [
      { name: "Office Supplies", color: "#1A73E8", userId: id },
      { name: "Travel", color: "#34A853", userId: id },
      { name: "Utilities", color: "#FBBC05", userId: id },
      { name: "Marketing", color: "#EA4335", userId: id },
      { name: "Office Rent", color: "#9C27B0", userId: id },
    ];
    
    for (const category of defaultCategories) {
      await this.createCategory(category);
    }
    
    return user;
  }

  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.userId === userId,
    );
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { ...existingCategory, ...categoryUpdate };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Check if category is used in any expense
    const categoryInUse = Array.from(this.expenses.values()).some(
      (expense) => expense.categoryId === id
    );
    
    if (categoryInUse) {
      return false;
    }
    
    return this.categories.delete(id);
  }

  // Expense methods
  async getExpenses(userId: number, filter?: DateFilter): Promise<ExpenseWithCategory[]> {
    let userExpenses = Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId
    );
    
    if (filter) {
      userExpenses = userExpenses.filter(expense => 
        new Date(expense.date) >= new Date(filter.startDate) && 
        new Date(expense.date) <= new Date(filter.endDate)
      );
    }
    
    // Join with categories
    return userExpenses.map(expense => {
      const category = this.categories.get(expense.categoryId);
      if (!category) {
        throw new Error(`Category not found: ${expense.categoryId}`);
      }
      return { ...expense, category };
    });
  }

  async getExpense(id: number): Promise<ExpenseWithCategory | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const category = this.categories.get(expense.categoryId);
    if (!category) {
      throw new Error(`Category not found: ${expense.categoryId}`);
    }
    
    return { ...expense, category };
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.expenseCurrentId++;
    const expense: Expense = { 
      ...insertExpense, 
      id, 
      createdAt: new Date(),
      description: insertExpense.description || null,
      receiptPath: insertExpense.receiptPath || null 
    };
    this.expenses.set(id, expense);
    return expense;
  }

  // Bulk create expenses
  async createExpensesBulk(expenses: InsertExpense[]): Promise<Expense[]> {
    const created: Expense[] = [];
    for (const expense of expenses) {
      const newExpense = await this.createExpense(expense);
      created.push(newExpense);
    }
    return created;
  }

  async updateExpense(id: number, expenseUpdate: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existingExpense = this.expenses.get(id);
    if (!existingExpense) return undefined;
    
    const updatedExpense = { ...existingExpense, ...expenseUpdate };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Dashboard methods
  async getExpenseSummary(userId: number, filter?: DateFilter): Promise<ExpenseSummary> {
    const expenses = await this.getExpenses(userId, filter);
    
    if (expenses.length === 0) {
      return {
        totalAmount: 0,
        highestCategory: null,
        mostUsedPaymentMethod: null,
        pendingReceipts: 0,
      };
    }
    
    // Calculate total amount
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Find highest category
    const categoryAmounts = new Map<number, number>();
    expenses.forEach(expense => {
      const currentAmount = categoryAmounts.get(expense.categoryId) || 0;
      categoryAmounts.set(expense.categoryId, currentAmount + expense.amount);
    });
    
    let highestCategoryId: number | null = null;
    let highestAmount = 0;
    
    categoryAmounts.forEach((amount, categoryId) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategoryId = categoryId;
      }
    });
    
    const highestCategory = highestCategoryId !== null 
      ? {
          name: (this.categories.get(highestCategoryId)?.name || "Unknown"),
          amount: highestAmount,
          percentage: parseFloat(((highestAmount / totalAmount) * 100).toFixed(1))
        }
      : null;
    
    // Find most used payment method
    const paymentMethodCounts = new Map<string, number>();
    expenses.forEach(expense => {
      const currentCount = paymentMethodCounts.get(expense.paymentMethod) || 0;
      paymentMethodCounts.set(expense.paymentMethod, currentCount + 1);
    });
    
    let mostUsedMethod: string | null = null;
    let highestCount = 0;
    
    paymentMethodCounts.forEach((count, method) => {
      if (count > highestCount) {
        highestCount = count;
        mostUsedMethod = method;
      }
    });
    
    const mostUsedPaymentMethod = mostUsedMethod !== null
      ? { method: mostUsedMethod, count: highestCount }
      : null;
    
    // Count pending receipts (expenses without receipt)
    const pendingReceipts = expenses.filter(expense => !expense.receiptPath).length;
    
    return {
      totalAmount,
      highestCategory,
      mostUsedPaymentMethod,
      pendingReceipts,
    };
  }

  async getCategoryDistribution(userId: number, filter?: DateFilter): Promise<CategoryDistribution[]> {
    const expenses = await this.getExpenses(userId, filter);
    
    if (expenses.length === 0) {
      return [];
    }
    
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group expenses by category
    const categoryMap = new Map<number, { amount: number, category: Category }>();
    
    expenses.forEach(expense => {
      const current = categoryMap.get(expense.categoryId) || { amount: 0, category: expense.category };
      current.amount += expense.amount;
      categoryMap.set(expense.categoryId, current);
    });
    
    // Convert to array and calculate percentages
    const distribution: CategoryDistribution[] = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.category.name,
      color: data.category.color,
      amount: data.amount,
      percentage: parseFloat(((data.amount / totalAmount) * 100).toFixed(1))
    }));
    
    // Sort by amount descending
    return distribution.sort((a, b) => b.amount - a.amount);
  }

  async getPaymentMethodDistribution(userId: number, filter?: DateFilter): Promise<PaymentMethodDistribution[]> {
    const expenses = await this.getExpenses(userId, filter);
    
    if (expenses.length === 0) {
      return [];
    }
    
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group expenses by payment method
    const methodMap = new Map<string, { amount: number, count: number }>();
    
    expenses.forEach(expense => {
      const current = methodMap.get(expense.paymentMethod) || { amount: 0, count: 0 };
      current.amount += expense.amount;
      current.count += 1;
      methodMap.set(expense.paymentMethod, current);
    });
    
    // Convert to array and calculate percentages
    const distribution: PaymentMethodDistribution[] = Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: parseFloat(((data.amount / totalAmount) * 100).toFixed(1))
    }));
    
    // Sort by amount descending
    return distribution.sort((a, b) => b.amount - a.amount);
  }

  async getMonthlyExpenseTrend(userId: number, months: number = 12): Promise<MonthlyExpense[]> {
    const result: MonthlyExpense[] = [];
    const now = new Date();
    
    // Generate last n months
    for (let i = 0; i < months; i++) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthName = format(date, 'MMM yyyy');
      
      // Filter expenses for this month
      const monthlyExpenses = await this.getExpenses(userId, {
        startDate: monthStart,
        endDate: monthEnd
      });
      
      const amount = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Add to beginning of array to get chronological order
      result.unshift({
        month: monthName,
        amount
      });
    }
    
    return result;
  }

  async getRecentExpenses(userId: number, limit: number = 5): Promise<ExpenseWithCategory[]> {
    const expenses = await this.getExpenses(userId);
    
    // Sort by date descending and limit
    return expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
