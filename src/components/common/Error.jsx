import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Error = ({ message = "Something went wrong. Please try again." }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 space-y-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {message}
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  );
};

export default Error;
