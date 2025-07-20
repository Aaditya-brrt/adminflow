import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-base">
            We've sent you a confirmation link to verify your email address. 
            Please check your inbox and click the link to complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Didn't receive the email? Check your spam folder or</p>
            <Link href="/auth/signup" className="text-primary hover:underline">
              try signing up again
            </Link>
          </div>
          
          <div className="pt-4">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                Proceed to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 