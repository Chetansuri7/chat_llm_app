import { useNavigate } from "@remix-run/react";
import { FaGoogle } from "react-icons/fa";
import { Button } from "~/components/ui/button"; // Assuming this is shadcn/ui Button or similar

export default function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const googleAuthURL = "https://api-chat.kwikon.club/auth/google/login";
      window.location.href = googleAuthURL;
    } catch (error) {
      console.error("Error during Google authentication:", error);
      // Consider showing a user-facing error message here
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground px-4 py-8 sm:py-12">
      <div className="max-w-md w-full bg-card text-card-foreground p-8 sm:p-10 rounded-xl shadow-2xl border border-border/70">
        {/* App Branding */}
        <div className="text-center mb-8">
          {/* Optional: You can add an SVG logo here if you have one */}
          {/* <img src="/path-to-your-logo.svg" alt="Krivi AI Logo" className="w-16 h-16 mx-auto mb-3" /> */}
          <h1 className="text-4xl font-bold text-primary">
            Krivi AI
          </h1>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl sm:text-3xl font-semibold mb-3 text-center text-card-foreground">
          Welcome!
        </h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base text-center">
          Sign in below, and we'll increase your message limits 😉
        </p>

        {/* Google Login Button */}
        <Button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-foreground hover:text-primary transition-all duration-200 ease-in-out shadow-md hover:shadow-lg border border-border transform hover:scale-[1.02]"
          // The original had shadow-lg, I've kept it as hover:shadow-lg and shadow-md for normal state.
          // Added transform hover:scale-[1.02] for a subtle zoom, using transition-all.
        >
          <FaGoogle className="mr-3 text-xl" /> {/* Slightly larger icon */}
          Sign in with Google
        </Button>

        {/* Terms */}
        <p className="mt-10 text-xs text-center text-muted-foreground">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent-foreground underline hover:text-accent-foreground/80 focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
            // Using text-accent-foreground for better contrast
            // hover:text-accent-foreground/80 for a slightly dimmed hover
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent-foreground underline hover:text-accent-foreground/80 focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
          >
            Privacy Policy
          </a>.
        </p>
      </div>
    </div>
  );
}