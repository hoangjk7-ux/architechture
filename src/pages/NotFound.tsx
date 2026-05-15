import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="text-center space-y-2">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
        <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      </div>
      <Button asChild>
        <Link to="/">
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
