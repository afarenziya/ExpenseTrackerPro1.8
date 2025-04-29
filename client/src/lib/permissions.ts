import { UserRole } from "@shared/schema";

/**
 * Feature access levels based on user roles
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
 * Checks if a user with the given role has access to a specific feature
 * 
 * @param role - The user's role
 * @param feature - The feature to check access for
 * @returns True if the user has access, false otherwise
 */
export function hasPermission(role: UserRole, feature: string): boolean {
  if (!featureAccess[feature]) {
    return false;
  }
  
  // A minimum level of 1 is required for access
  return (featureAccess[feature][role] || 0) >= 1;
}

/**
 * Check if a user has admin-level access to a feature
 * 
 * @param role - The user's role
 * @param feature - The feature to check access for
 * @returns True if the user has admin access, false otherwise
 */
export function hasAdminPermission(role: UserRole, feature: string): boolean {
  if (!featureAccess[feature]) {
    return false;
  }
  
  // Level 3 is required for admin access
  return (featureAccess[feature][role] || 0) >= 3;
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