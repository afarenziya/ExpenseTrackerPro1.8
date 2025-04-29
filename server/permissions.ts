import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@shared/schema';

/**
 * Permission levels for different features based on user roles
 * 0 = No access
 * 1 = Basic access (view/own)
 * 2 = Advanced access (edit/all)
 * 3 = Full access (delete/admin)
 */
export const featureAccess: Record<string, Record<UserRole, number>> = {
  // Features for expense management
  "create_expense": {
    "admin": 3,
    "accountant": 2,
    "manager": 1,
    "user": 1
  },
  "edit_all_expenses": {
    "admin": 3,
    "accountant": 2,
    "manager": 1,
    "user": 0
  },
  "delete_all_expenses": {
    "admin": 3,
    "accountant": 0,
    "manager": 0,
    "user": 0
  },
  
  // Features for category management
  "create_category": {
    "admin": 3,
    "accountant": 2,
    "manager": 0,
    "user": 0
  },
  "edit_categories": {
    "admin": 3,
    "accountant": 2,
    "manager": 0,
    "user": 0
  },
  "delete_categories": {
    "admin": 3,
    "accountant": 0,
    "manager": 0,
    "user": 0
  },
  
  // Features for reports
  "export_reports": {
    "admin": 3,
    "accountant": 2,
    "manager": 1,
    "user": 0
  },
  
  // Features for user management
  "manage_users": {
    "admin": 3,
    "accountant": 0,
    "manager": 0,
    "user": 0
  }
};

/**
 * Check if a user has permission for a specific feature
 * 
 * @param userRole - The user's role
 * @param feature - The feature to check permissions for
 * @returns True if user has permission, false otherwise
 */
export function hasPermission(userRole: UserRole, feature: string): boolean {
  if (!featureAccess[feature]) {
    return false;
  }
  
  // A minimum level of 1 is required for access
  return (featureAccess[feature][userRole] || 0) >= 1;
}

/**
 * Middleware to require permission for a specific feature
 * 
 * @param feature - The feature to check permission for
 * @returns Express middleware function
 */
export function requirePermission(feature: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userRole = req.user!.role as UserRole;
    
    if (hasPermission(userRole, feature)) {
      return next();
    } else {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
  };
}

/**
 * Middleware to check if user is the owner of a resource
 * or has permission to access resources they don't own
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function isResourceOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = req.user!.id;
  const resourceUserId = parseInt(req.params.userId);
  const userRole = req.user!.role as UserRole;
  
  // Allow if user is the resource owner
  if (userId === resourceUserId) {
    return next();
  }
  
  // Allow if user has admin permissions
  if (userRole === 'admin') {
    return next();
  }
  
  // Allow accountants to access all financial data
  if (userRole === 'accountant' && 
      (req.path.includes('/expenses') || req.path.includes('/reports'))) {
    return next();
  }
  
  return res.status(403).json({ message: "Access denied" });
}

/**
 * Get a display name for a user role
 * 
 * @param role - The user role
 * @returns User-friendly name for the role
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    "admin": "Administrator",
    "accountant": "Accountant",
    "manager": "Manager",
    "user": "Regular User"
  };
  
  return displayNames[role] || role;
}