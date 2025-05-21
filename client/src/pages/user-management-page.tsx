import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Check, X, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function UserManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<"pending" | "all">("pending");
  
  // Fetch pending users
  const { 
    data: pendingUsers = [], 
    isLoading: isPendingLoading,
    error: pendingError
  } = useQuery<User[]>({
    queryKey: ["/api/users/pending"],
    enabled: user?.role === "admin",
  });

  // Fetch all users
  const {
    data: allUsers = [],
    isLoading: isAllUsersLoading,
    error: allUsersError
  } = useQuery<User[]>({
    queryKey: ["/api/users/all"],
    enabled: user?.role === "admin",
  });
  
  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/approve`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to approve user");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "The user has been approved successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/reject`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reject user");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "The user has been rejected successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleApproveUser = (userId: number) => {
    approveMutation.mutate(userId);
  };
  
  const handleRejectUser = (userId: number) => {
    rejectMutation.mutate(userId);
  };

  const handleEditUser = (userId: number) => {
    // Logic to edit user details (e.g., open a modal or navigate to an edit page)
    console.log("Edit user", userId);
  };

  const handleDeleteUser = (userId: number) => {
    // Logic to delete a user
    console.log("Delete user", userId);
  };
  
  return (
    <PermissionGuard permission="manage_users">
      <div className="container py-10">
        <div className="mb-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => window.location.href = '/'}
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Review and manage user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="space-x-2">
                <Button 
                  variant={selectedTab === "pending" ? "default" : "outline"}
                  onClick={() => setSelectedTab("pending")}
                >
                  Pending Approvals
                </Button>
                <Button 
                  variant={selectedTab === "all" ? "default" : "outline"}
                  onClick={() => setSelectedTab("all")}
                >
                  All Users
                </Button>
              </div>
            </div>
            
            {selectedTab === "pending" && (
              <div>
                <h3 className="text-lg font-medium mb-4">Pending User Approvals</h3>
                
                {isPendingLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingError ? (
                  <div className="text-center text-destructive py-8">
                    Failed to load pending users
                  </div>
                ) : !pendingUsers || pendingUsers.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No pending user approvals at this time
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {pendingUsers.map((pendingUser: User) => (
                          <tr key={pendingUser.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{pendingUser.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{pendingUser.username}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{pendingUser.email}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{pendingUser.role}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                {pendingUser.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {pendingUser.createdAt ? format(new Date(pendingUser.createdAt), 'MMM d, yyyy') : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveUser(pendingUser.id)}
                                disabled={approveMutation.isPending}
                              >
                                {approveMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectUser(pendingUser.id)}
                                disabled={rejectMutation.isPending}
                              >
                                {rejectMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <X className="h-4 w-4 mr-1" />
                                )}
                                Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {selectedTab === "all" && (
              <div>
                <h3 className="text-lg font-medium mb-4">All Users</h3>

                {isAllUsersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allUsersError ? (
                  <div className="text-center text-destructive py-8">
                    Failed to load all users
                  </div>
                ) : !allUsers || allUsers.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No users found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {allUsers.map((user: User) => (
                          <tr key={user.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{user.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{user.username}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{user.email}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{user.role}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                {user.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleEditUser(user.id)}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}