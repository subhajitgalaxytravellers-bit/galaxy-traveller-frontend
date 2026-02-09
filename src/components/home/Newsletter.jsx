"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

const Newsletter = () => {
  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Mail className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Travel Inspiration
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Subscribe to our newsletter and receive exclusive deals, travel
            tips, and destination guides
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-12 bg-white text-foreground border-0"
            />
            <Button size="lg" variant="default" className="whitespace-nowrap">
              Subscribe Now
            </Button>
          </div>

          <p className="text-sm mt-4 opacity-75">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
