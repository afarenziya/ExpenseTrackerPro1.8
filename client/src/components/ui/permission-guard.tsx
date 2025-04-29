import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";  
import { ReactNode } from "react";

/**
 * Feature access levels based on user roles
 * 0 = No access
 * 1 = Basic access (view/own)
 * 2 = Advanced access (edit/all)
 * 3 = Full access (delete/admin)
 */
const featureAccess: Record<string, Record<UserRole, number>> = {
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
 */
function hasPermission(role: UserRole | null | undefined, feature: string): boolean {
  if (!role || !featureAccess[feature]) {
    return false;
  }
  
  // A minimum level of 1 is required for access
  return (featureAccess[feature][role] || 0) >= 1;
}

interface PermissionGuardProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on user's permissions
 * 
 * @param permission - The permission key to check
 * @param fallback - Optional alternative component to render if user lacks permission
 * @param children - Content to render if user has permission
 */
export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  const userHasPermission = hasPermission(user.role, permission);
  
  if (userHasPermission) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}