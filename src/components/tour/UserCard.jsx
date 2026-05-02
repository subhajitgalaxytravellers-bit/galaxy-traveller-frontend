import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function UserCard({ avatar, name, description, id, slug }) {
  return (
    <Card className="w-full   border border-gray-100 rounded-lg shadow-sm my-6 py-4  ">
      <CardContent className="flex  gap-3 space-y-3 justify-center items-center">
        {/* Avatar */}

        <Avatar className="w-25 h-25 rounded-sm mr-3 object-cover border-2 border-white/30">
          <AvatarImage
            className={" rounded-sm w-full h-full"}
            src={avatar}
            alt={name}
          />
          <AvatarFallback
            className={"text-white rounded-sm bg-gray-800 w-full h-full"}
          >
            {name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 flex flex-col gap-2 ">
          <h3 className="text-lg font-semibold">{name}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
          <a
            href={`/creator/${slug}`}
            className="text-sm text-orange-500  font-medium "
          >
            View Profile
          </a>
        </div>

        {/* Name */}
      </CardContent>
    </Card>
  );
}
