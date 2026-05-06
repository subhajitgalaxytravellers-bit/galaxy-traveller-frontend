import { Card, CardContent } from "../ui/card";
import { Clock, Users, Calendar, Globe } from "lucide-react";

function TourOverview({
  duration,
  groupSize,
  ageRange,
  languages,
  description,
  tagMonths = [],
}) {
  console.log("duration", duration);
  const stats = [
    {
      icon: Clock,
      label: "Duration",
      value: duration,
    },
    {
      icon: Users,
      label: "Group Size",
      value: groupSize,
    },
    {
      icon: Calendar,
      label: "Ages",
      value: ageRange,
    },
  ];

  return (
    <div className="space-y-6 flex flex-col gap-6 mb-6">
      {/* Clean stats grid */}
      <div className="w-full md:hidden">
        {stats.length > 0 && stats[1].value !== "" && stats[2].value !== "" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="border border-gray-100 text-center p-0   w-full"
              >
                <CardContent className="p-4">
                  <stat.icon className="h-6 w-6 text-primary  mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </div>
                  <div
                    className="font-medium text-base"
                    data-testid={`text-${stat.label
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Clean overview section */}
      <div>
        <h2 className="font-heading text-2xl font-bold mb-4 tracking-tight">Tour Overview</h2>
        <p
          className="text-base text-muted-foreground leading-relaxed"
          data-testid="text-description"
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export default TourOverview;
