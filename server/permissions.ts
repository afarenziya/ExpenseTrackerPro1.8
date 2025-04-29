import { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/schema";

// Define permission levels for each role from highest to lowest
const roleHierarchy: Record<UserRole, number> = {
  "admin": 100,
  "manager": 80,
  "accountant": 60,
  "user": 10
};

// Define feature access by minimum required role level
export const featureAccess: Record<string, number> = {
  // Dashboard permissions
  "view_dashboard": roleHierarchy.user,  // All users can view dashboard
  
  // Expense permissions
  "create_expense": roleHierarchy.user,     // All users can create
  "view_own_expenses": roleHierarchy.user,  // All users can view their own
  "edit_own_expenses": roleHierarchy.user,  // All users can edit their own
  "delete_own_expenses": roleHierarchy.user, // All users can delete their own
  "view_all_expenses": roleHierarchy.accountant, // Accountants+ can view all
  "edit_all_expenses": roleHierarchy.accountant, // Accountants+ can edit all
  "delete_all_expenses": roleHierarchy.manager,  // Managers+ can delete all
  
  // Category permissions
  "create_category": roleHierarchy.accountant, // Accountants+ can create
  "view_categories": roleHierarchy.user,      // All users can view
  "edit_categories": roleHierarchy.accountant, // Accountants+ can edit
  "delete_categories": roleHierarchy.accountant, // Accountants+ can delete
  
  // Report permissions
  "view_reports": roleHierarchy.user,       // All users can view
  "export_reports": roleHierarchy.accountant, // Accountants+ can export
  
  // User management permissions
  "view_users": roleHierarchy.manager,     // Managers+ can view users
  "create_users": roleHierarchy.admin,     // Only admins can create
  "edit_users": roleHierarchy.admin,       // Only admins can edit
  "delete_users": roleHierarchy.admin,     // Only admins can delete
  
  // System settings permissions
  "edit_settings": roleHierarchy.admin,   // Only admins can edit settings
};

// Check if user has permission to access a feature
export function hasPermission(userRole: UserRole, feature: string): boolean {
  const userLevel = roleHierarchy[userRole];
  const requiredLevel = featureAccess[feature];
  
  if (requiredLevel === undefined) {
    // If feature doesn't exist in permissions, deny access
    return false;
  }
  
  return userLevel >= requiredLevel;
}

// Middleware to check if user has permission to access a feature
export function requirePermission(feature: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userRole = req.user.role as UserRole;
    
    if (!hasPermission(userRole, feature)) {
      return res.status(403).json({ 
        message: "You don't have permission to access this feature"
      });
    }
    
    next();
  };
}

// Middleware to check if user is accessing their own resource
export function isResourceOwner(req: Request, res: Response, next: NextFunction) {
  const resourceUserId = parseInt(req.params.userId);
  const currentUserId = req.user!.id;
  
  if (resourceUserId !== currentUserId) {
    // If not resource owner, check if has permission to access all resources
    const userRole = req.user!.role as UserRole;
    
    // Different permission checks for different resource types
    let permissionRequired: string;
    
    if (req.path.includes("/expenses")) {
      permissionRequired = "view_all_expenses";
    } else if (req.path.includes("/categories")) {
      permissionRequired = "edit_categories";
    } else {
      // Default to admin only for unspecified resource types
      permissionRequired = "edit_users";
    }
    
    if (!hasPermission(userRole, permissionRequired)) {
      return res.status(403).json({ 
        message: "You don't have permission to access this resource" 
      });
    }
  }
  
  next();
}

// Helper function to get role display name
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    "admin": "Administrator",
    "manager": "Manager",
    "accountant": "Accountant",
    "user": "Regular User"
  };
  
  return displayNames[role] || role;
}