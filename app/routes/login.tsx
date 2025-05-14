// app/routes/login.tsx
import { useNavigate } from "@remix-run/react";
import { FaGoogle } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { preventAuthenticatedUser } from "~/auth.server";
import { json } from "@remix-run/node";
// import { toast } from "sonner"; // If you want to show toast for logoutError

export async function loader({ request }: LoaderFunctionArgs) {
  await preventAuthenticatedUser(request, "/"); // Redirect to home if already logged in
  // const url = new URL(request.url);
  // if (url.searchParams.get("logoutError")) {
  //  return json({ logoutError: "Logout failed. Please try again or clear cookies." });
  // }
  return json({}); // Must return a response
}

export default function LoginPage() {
  const navigate = useNavigate();
  // const loaderData = useLoaderData<typeof loader>();

  // React.useEffect(() => {
  //   if (loaderData.logoutError) {
  //     toast.error(loaderData.logoutError);
  //   }
  // }, [loaderData]);

  const handleGoogleLogin = async () => {
    try {
      const googleAuthURL = "https://api-chat.kwikon.club/auth/google/login";
      window.location.href = googleAuthURL;
    } catch (error) {
      console.error("Error during Google authentication:", error);
      // toast.error("Google login failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground px-4 py-8 sm:py-12">
      <div className="max-w-md w-full bg-card text-card-foreground p-8 sm:p-10 rounded-xl shadow-2xl border border-border/70">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">
            Krivi AI
          </h1>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-3 text-center text-card-foreground">
          Welcome!
        </h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base text-center">
          Sign in below, and we'll increase your message limits 😉
        </p>
        <Button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-foreground hover:text-primary transition-all duration-200 ease-in-out shadow-md hover:shadow-lg border border-border transform hover:scale-[1.02]"
        >
          <FaGoogle className="mr-3 text-xl" />
          Sign in with Google
        </Button>
        <p className="mt-10 text-xs text-center text-muted-foreground">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent-foreground underline hover:text-accent-foreground/80 focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
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