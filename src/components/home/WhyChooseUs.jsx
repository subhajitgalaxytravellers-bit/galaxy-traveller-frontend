"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Award, HeadphonesIcon, ThumbsUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "Your safety is our priority with certified guides and secure payment systems",
  },
  {
    icon: Award,
    title: "Best Price Guarantee",
    description: "We offer the best rates with no hidden fees or surprises",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description:
      "Our travel experts are available around the clock to assist you",
  },
  {
    icon: ThumbsUp,
    title: "Trusted by Thousands",
    description: "Join over 50,000 happy travelers who've explored with us",
  },
];

const WhyChooseUs = () => {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold mb-2 uppercase tracking-wider">
            Why Choose Us
          </p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 italic tracking-wide">
            Your Perfect Travel Partner
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We go above and beyond to ensure your travel experience is
            unforgettable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center border-0 card-shadow hover:hover-shadow transition-all duration-300 group"
            >
              <CardContent className="pt-8 pb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
