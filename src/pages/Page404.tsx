import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Page404: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">404</h1>
          <p className="text-muted-foreground">
            This route does not exist. Use one of the safe actions below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button asChild variant="outline" className="w-full gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
          <Button asChild className="w-full gap-2">
            <Link to="/app">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page404;
