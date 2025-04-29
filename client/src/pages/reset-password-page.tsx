import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordResetSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, KeyRound, XCircle } from "lucide-react";

// Get token from URL
function useURLToken() {
  const [searchParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });
  
  return searchParams.get('token');
}

// Extend password reset schema for better validation
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, "Password must include a number and a symbol"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).superRefine(({ password, confirmPassword }: { password: string, confirmPassword: string }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const token = useURLToken();
  const { toast } = useToast();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset password form
  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
      password: "",
      confirmPassword: "",
    },
  });

  // Check if token is present
  useEffect(() => {
    if (!token) {
      setResetError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const onResetSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      setIsSubmitting(true);
      const { confirmPassword, ...resetData } = values;
      
      const response = await apiRequest("POST", "/api/password-reset", resetData);
      const data = await response.json();
      
      setResetSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        setLocation("/auth");
      }, 3000);
      
    } catch (error) {
      setResetError("Invalid or expired reset token. Please request a new password reset link.");
      toast({
        title: "Password Reset Failed",
        description: "There was an error resetting your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center flex justify-center items-center gap-2">
            <KeyRound className="h-6 w-6" />
            Reset Password
          </CardTitle>
          <CardDescription className="text-center">
            {!resetSuccess && !resetError
              ? "Enter your new password below to reset your account password"
              : resetSuccess
                ? "Your password has been reset successfully"
                : "There was an error with your reset request"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetSuccess ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your password has been reset successfully. You will be redirected to the login page shortly.
              </AlertDescription>
            </Alert>
          ) : resetError ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{resetError}</AlertDescription>
            </Alert>
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your new password" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        Password must be at least 8 characters and include a number and a symbol
                      </p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {(resetSuccess || resetError) && (
            <Button 
              variant="link" 
              onClick={() => setLocation("/auth")}
            >
              Back to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}