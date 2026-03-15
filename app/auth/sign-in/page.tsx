import { SocialAuth } from "@/components/auth/social-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-primary/5 mb-4 group transition-transform hover:scale-105">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-lg">
            Sign in to your account to continue
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl transition-all hover:shadow-primary/5">
          <CardHeader className="space-y-1 pt-8">
            <CardTitle className="text-2xl font-semibold text-center hidden">
              Sign in
            </CardTitle>
            <CardDescription className="text-center hidden">
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <SocialAuth />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  Secure Access
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground px-8">
              By clicking continue, you agree to our{" "}
              <a
                href="#"
                className="underline underline-offset-4 hover:text-primary transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="underline underline-offset-4 hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a
            href="#"
            className="text-primary font-semibold hover:underline underline-offset-4 transition-all"
          >
            Contact us for access
          </a>
        </p>
      </div>
    </div>
  );
}
