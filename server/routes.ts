import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { upload } from "./multer";
import { format, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { z } from "zod";
import { insertCategorySchema, insertExpenseSchema, UserRole } from "@shared/schema";
import { createReadStream } from "fs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import ExcelJS from "exceljs";
import { requirePermission, isResourceOwner, hasPermission } from "./permissions";

// Extended request type to handle file uploads
interface RequestWithFile extends Request {
  file?: {
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // setup authentication routes
  setupAuth(app);
  
  // API middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // User management routes (admin only)
  app.get("/api/users/pending", requireAuth, async (req, res) => {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).send("Only administrators can access this resource");
    }

    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).send("Failed to fetch pending users");
    }
  });

  app.post("/api/users/:id/approve", requireAuth, async (req, res) => {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).send("Only administrators can approve user accounts");
    }

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).send("Invalid user ID");
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }

      if (user.status === "active") {
        return res.status(400).send("User is already active");
      }

      const updatedUser = await storage.updateUserStatus(userId, "active");
      
      // Send approval email
      const { sendApprovalEmail } = await import('./email');
      await sendApprovalEmail(user.email, user.name || user.username);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).send("Failed to approve user");
    }
  });

  app.post("/api/users/:id/reject", requireAuth, async (req, res) => {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).send("Only administrators can reject user accounts");
    }

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).send("Invalid user ID");
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }

      if (user.status === "rejected") {
        return res.status(400).send("User is already rejected");
      }

      const updatedUser = await storage.updateUserStatus(userId, "rejected");
      
      // Send rejection email
      const { sendRejectionEmail } = await import('./email');
      await sendRejectionEmail(user.email, user.name || user.username);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).send("Failed to reject user");
    }
  });

  // ========== Category Routes ==========
  
  // Get all categories
  app.get("/api/categories", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const categories = await storage.getCategories(userId);
    res.json(categories);
  });
  
  // Create category
  app.post("/api/categories", requireAuth, requirePermission("create_category"), async (req, res) => {
    const userId = req.user!.id;
    
    try {
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        userId,
      });
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data", error });
    }
  });
  
  // Update category
  app.put("/api/categories/:id", requireAuth, requirePermission("edit_categories"), async (req, res) => {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id);
    
    const category = await storage.getCategory(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const userRole = req.user!.role as UserRole;
    
    // Check if user owns the category or has permission to edit all categories
    const isOwner = category.userId === userId;
    const canEditAll = hasPermission(userRole, "edit_categories");
    
    if (!isOwner && !canEditAll) {
      return res.status(403).json({ message: "You don't have permission to update this category" });
    }
    
    try {
      const categoryData = {
        ...req.body,
        userId,
      };
      
      const updatedCategory = await storage.updateCategory(categoryId, categoryData);
      res.json(updatedCategory);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data", error });
    }
  });
  
  // Delete category
  app.delete("/api/categories/:id", requireAuth, requirePermission("delete_categories"), async (req, res) => {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id);
    
    const category = await storage.getCategory(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const userRole = req.user!.role as UserRole;
    
    // Check if user owns the category or has permission to delete categories
    const isOwner = category.userId === userId;
    const canDeleteAll = hasPermission(userRole, "delete_categories");
    
    if (!isOwner && !canDeleteAll) {
      return res.status(403).json({ message: "You don't have permission to delete this category" });
    }
    
    const deleted = await storage.deleteCategory(categoryId);
    if (!deleted) {
      return res.status(400).json({ message: "Category is in use and cannot be deleted" });
    }
    
    res.status(204).end();
  });
  
  // ========== Expense Routes ==========
  
  // Get all expenses with optional date filtering
  app.get("/api/expenses", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;
    
    let dateFilter = undefined;
    
    if (startDate && endDate) {
      try {
        dateFilter = {
          startDate: parseISO(startDate as string),
          endDate: parseISO(endDate as string),
        };
      } catch (error) {
        return res.status(400).json({ message: "Invalid date format" });
      }
    }
    
    const expenses = await storage.getExpenses(userId, dateFilter);
    res.json(expenses);
  });
  
  // Get single expense
  app.get("/api/expenses/:id", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id);
    
    const expense = await storage.getExpense(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    const userRole = req.user!.role as UserRole;
    
    // Check if user owns the expense or has permission to view all expenses
    const isOwner = expense.userId === userId;
    const canViewAll = hasPermission(userRole, "edit_all_expenses");
    
    if (!isOwner && !canViewAll) {
      return res.status(403).json({ message: "You don't have permission to view this expense" });
    }
    
    res.json(expense);
  });
  
  // Create expense with receipt upload
  app.post("/api/expenses", requireAuth, requirePermission("create_expense"), upload.single("receipt"), async (req: RequestWithFile, res) => {
    const userId = req.user!.id;
    
    try {
      let receiptPath = undefined;
      
      if (req.file) {
        receiptPath = `/uploads/${req.file.filename}`;
      }
      
      const expenseData = {
        ...JSON.parse(req.body.expense || "{}"),
        userId,
        receiptPath,
      };
      
      // Parse the date string to a Date object
      if (expenseData.date && typeof expenseData.date === "string") {
        expenseData.date = new Date(expenseData.date);
      }
      
      const parsedData = insertExpenseSchema.parse(expenseData);
      const expense = await storage.createExpense(parsedData);
      
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Invalid expense data", error });
    }
  });
  
  // Update expense with receipt upload
  app.put("/api/expenses/:id", requireAuth, requirePermission("edit_all_expenses"), upload.single("receipt"), async (req: RequestWithFile, res) => {
    const userId = req.user!.id;
    const userRole = req.user!.role as UserRole;
    const expenseId = parseInt(req.params.id);
    
    const expense = await storage.getExpense(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    // Check if user owns the expense or has permission to edit all expenses
    const isOwner = expense.userId === userId;
    const canEditAll = hasPermission(userRole, "edit_all_expenses");
    
    if (!isOwner && !canEditAll) {
      return res.status(403).json({ message: "You don't have permission to update this expense" });
    }
    
    try {
      let receiptPath = expense.receiptPath;
      
      if (req.file) {
        receiptPath = `/uploads/${req.file.filename}`;
      }
      
      const expenseData = {
        ...JSON.parse(req.body.expense || "{}"),
        userId: isOwner ? userId : expense.userId, // Preserve original userId if admin is editing
        receiptPath,
      };
      
      // Parse the date string to a Date object
      if (expenseData.date && typeof expenseData.date === "string") {
        expenseData.date = new Date(expenseData.date);
      }
      
      const updatedExpense = await storage.updateExpense(expenseId, expenseData);
      res.json(updatedExpense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data", error });
    }
  });
  
  // Delete expense
  app.delete("/api/expenses/:id", requireAuth, requirePermission("delete_all_expenses"), async (req, res) => {
    const userId = req.user!.id;
    const userRole = req.user!.role as UserRole;
    const expenseId = parseInt(req.params.id);
    
    const expense = await storage.getExpense(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    // Check if user owns the expense or has permission to delete all expenses
    const isOwner = expense.userId === userId;
    const canDeleteAll = hasPermission(userRole, "delete_all_expenses");
    
    if (!isOwner && !canDeleteAll) {
      return res.status(403).json({ message: "You don't have permission to delete this expense" });
    }
    
    await storage.deleteExpense(expenseId);
    res.status(204).end();
  });
  
  // ========== Dashboard Routes ==========
  
  // Get expense summary
  app.get("/api/dashboard/summary", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;
    
    let dateFilter = undefined;
    
    if (startDate && endDate) {
      try {
        dateFilter = {
          startDate: parseISO(startDate as string),
          endDate: parseISO(endDate as string),
        };
      } catch (error) {
        return res.status(400).json({ message: "Invalid date format" });
      }
    }
    
    const summary = await storage.getExpenseSummary(userId, dateFilter);
    res.json(summary);
  });
  
  // Get category distribution
  app.get("/api/dashboard/category-distribution", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;
    
    let dateFilter = undefined;
    
    if (startDate && endDate) {
      try {
        dateFilter = {
          startDate: parseISO(startDate as string),
          endDate: parseISO(endDate as string),
        };
      } catch (error) {
        return res.status(400).json({ message: "Invalid date format" });
      }
    }
    
    const distribution = await storage.getCategoryDistribution(userId, dateFilter);
    res.json(distribution);
  });
  
  // Get payment method distribution
  app.get("/api/dashboard/payment-distribution", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;
    
    let dateFilter = undefined;
    
    if (startDate && endDate) {
      try {
        dateFilter = {
          startDate: parseISO(startDate as string),
          endDate: parseISO(endDate as string),
        };
      } catch (error) {
        return res.status(400).json({ message: "Invalid date format" });
      }
    }
    
    const distribution = await storage.getPaymentMethodDistribution(userId, dateFilter);
    res.json(distribution);
  });
  
  // Get monthly expense trends
  app.get("/api/dashboard/monthly-trend", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const months = req.query.months ? parseInt(req.query.months as string) : 12;
    
    const trend = await storage.getMonthlyExpenseTrend(userId, months);
    res.json(trend);
  });
  
  // Get recent expenses
  app.get("/api/dashboard/recent-expenses", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    
    const expenses = await storage.getRecentExpenses(userId, limit);
    res.json(expenses);
  });
  
  // ========== Report Routes ==========
  
  // Export expense report as PDF
  app.get("/api/reports/pdf", requireAuth, requirePermission("export_reports"), async (req, res) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;
    
    let dateFilter = undefined;
    
    if (startDate && endDate) {
      try {
        dateFilter = {
          startDate: parseISO(startDate as string),
          endDate: parseISO(endDate as string),
        };
      } catch (error) {
        return res.status(400).json({ message: "Invalid date format" });
      }
    }
    
    const expenses = await storage.getExpenses(userId, dateFilter);
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    // Set metadata
    pdfDoc.setTitle("Expense Report");
    pdfDoc.setAuthor("AjayFarenziya Expense Manager");
    
    // Title
    page.drawText("Expense Report", {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
    });
    
    // Date range
    if (dateFilter) {
      const dateRangeText = `Period: ${format(dateFilter.startDate, 'dd MMM yyyy')} to ${format(dateFilter.endDate, 'dd MMM yyyy')}`;
      page.drawText(dateRangeText, {
        x: 50,
        y: height - 80,
        size: 12,
        font,
      });
    }
    
    // Total amount
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    page.drawText(`Total Expenses: ₹${totalAmount.toFixed(2)}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: boldFont,
    });
    
    // Table header
    const tableTop = height - 140;
    const columnWidths = [80, 80, 100, 100, 80, 100];
    const startX = 50;
    
    page.drawText("Date", { x: startX, y: tableTop, size: 10, font: boldFont });
    page.drawText("Category", { x: startX + columnWidths[0], y: tableTop, size: 10, font: boldFont });
    page.drawText("Vendor", { x: startX + columnWidths[0] + columnWidths[1], y: tableTop, size: 10, font: boldFont });
    page.drawText("Description", { x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2], y: tableTop, size: 10, font: boldFont });
    page.drawText("Payment", { x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], y: tableTop, size: 10, font: boldFont });
    page.drawText("Amount", { x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], y: tableTop, size: 10, font: boldFont });
    
    // Draw horizontal line
    page.drawLine({
      start: { x: startX, y: tableTop - 5 },
      end: { x: startX + columnWidths.reduce((a, b) => a + b, 0), y: tableTop - 5 },
      thickness: 1,
    });
    
    // Table rows
    let currentY = tableTop - 25;
    
    for (const expense of expenses) {
      // Add new page if needed
      if (currentY < 50) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        currentY = height - 50;
      }
      
      page.drawText(format(new Date(expense.date), 'dd/MM/yyyy'), { x: startX, y: currentY, size: 9, font });
      page.drawText(expense.category.name, { x: startX + columnWidths[0], y: currentY, size: 9, font });
      page.drawText(expense.vendorName.substring(0, 15), { x: startX + columnWidths[0] + columnWidths[1], y: currentY, size: 9, font });
      
      const description = expense.description ? expense.description.substring(0, 20) : "";
      page.drawText(description, { x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2], y: currentY, size: 9, font });
      
      page.drawText(expense.paymentMethod, { x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], y: currentY, size: 9, font });
      page.drawText(`₹${expense.amount.toFixed(2)}`, { x: startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], y: currentY, size: 9, font });
      
      currentY -= 20;
    }
    
    // Footer
    page.drawText("Generated by AjayFarenziya Expense Manager", {
      x: 50,
      y: 30,
      size: 8,
      font,
    });
    
    // Serialize PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=expense-report.pdf');
    
    // Send PDF
    res.send(Buffer.from(pdfBytes));
  });
  
  // Export expense report as Excel
  app.get("/api/reports/excel", requireAuth, requirePermission("export_reports"), async (req, res) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;
    
    let dateFilter = undefined;
    
    if (startDate && endDate) {
      try {
        dateFilter = {
          startDate: parseISO(startDate as string),
          endDate: parseISO(endDate as string),
        };
      } catch (error) {
        return res.status(400).json({ message: "Invalid date format" });
      }
    }
    
    const expenses = await storage.getExpenses(userId, dateFilter);
    
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AjayFarenziya Expense Manager";
    workbook.created = new Date();
    
    // Add worksheet
    const worksheet = workbook.addWorksheet("Expense Report");
    
    // Add headers
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Material/Service", key: "materialName", width: 30 },
      { header: "Vendor", key: "vendorName", width: 25 },
      { header: "Description", key: "description", width: 40 },
      { header: "Payment Method", key: "paymentMethod", width: 20 },
      { header: "Amount (₹)", key: "amount", width: 15 },
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add data
    expenses.forEach(expense => {
      worksheet.addRow({
        date: format(new Date(expense.date), 'dd/MM/yyyy'),
        category: expense.category.name,
        materialName: expense.materialName,
        vendorName: expense.vendorName,
        description: expense.description || "",
        paymentMethod: expense.paymentMethod,
        amount: expense.amount,
      });
    });
    
    // Style amount column
    worksheet.getColumn("amount").numFmt = "₹#,##0.00";
    
    // Add summary
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    worksheet.addRow([]);
    const totalRow = worksheet.addRow({
      date: "Total",
      amount: totalAmount,
    });
    totalRow.font = { bold: true };
    
    // Set content type and headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expense-report.xlsx');
    
    // Write to buffer and send response
    await workbook.xlsx.write(res);
    res.end();
  });

  const httpServer = createServer(app);

  return httpServer;
}
