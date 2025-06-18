import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mic } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  first_name: z.string().min(1, { message: "First name is required." }),
  last_name: z.string().min(1, { message: "Last name is required." }),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function Landing() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const handleSignIn = async ({ email, password }: SignInFormValues) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast({ title: "Signed in successfully" });
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignUp = async ({ email, password, first_name, last_name }: SignUpFormValues) => {
    try {
      setLoading(true);
      
      // Sign up the user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
          }
        }
      });
      
      if (error) throw error;
      
      // If signup successful and user is created, also create/update profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            first_name: first_name,
            last_name: last_name,
            updated_at: new Date().toISOString(),
          });
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't throw here as the user account was created successfully
          // Just log the error for debugging
        }
      }
      
      toast({
        title: "Check your email",
        description: "We've sent a confirmation link to your email address.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mic className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Fluency Rater</h1>
          <p className="text-gray-600 mt-1">Help me improve my communication</p>
        </div>

        {/* Auth Form */}
        <Tabs defaultValue="sign-in" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in">
            <Card className="shadow-md border-0">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-medium">Welcome back</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-in">Email</Label>
                    <Input 
                      id="email-in" 
                      type="email" 
                      placeholder="Enter your email"
                      {...signInForm.register("email")} 
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-in">Password</Label>
                    <Input 
                      id="password-in" 
                      type="password" 
                      placeholder="Enter your password"
                      {...signInForm.register("password")} 
                    />
                    {signInForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sign-up">
            <Card className="shadow-md border-0">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-medium">Join the journey</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input 
                        id="first-name" 
                        placeholder="First name"
                        {...signUpForm.register("first_name")} 
                      />
                      {signUpForm.formState.errors.first_name && (
                        <p className="text-red-500 text-sm">{signUpForm.formState.errors.first_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input 
                        id="last-name" 
                        placeholder="Last name"
                        {...signUpForm.register("last_name")} 
                      />
                      {signUpForm.formState.errors.last_name && (
                        <p className="text-red-500 text-sm">{signUpForm.formState.errors.last_name.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up">Email</Label>
                    <Input 
                      id="email-up" 
                      type="email" 
                      placeholder="Enter your email"
                      {...signUpForm.register("email")} 
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">{signUpForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-up">Password</Label>
                    <Input 
                      id="password-up" 
                      type="password" 
                      placeholder="Create a password"
                      {...signUpForm.register("password")} 
                    />
                    {signUpForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">{signUpForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
