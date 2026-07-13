import { Avatar } from "@/components/ui/Avatar";
import type { AvatarSelectOption } from "@/components/ui/inputs/AvatarSelect";
import { CHAT_TEAMMATES } from "@/lib/chats/chat-teammates";

export const CHAT_TEAMMATE_SELECT_OPTIONS: AvatarSelectOption[] =
  CHAT_TEAMMATES.map((teammate) => ({
    value: teammate.id,
    label: teammate.name,
    description: teammate.role,
    avatar: (
      <Avatar
        initials={teammate.avatarInitials}
        src={teammate.avatarImageSrc}
        alt={teammate.name}
        colorClassName={teammate.avatarColorClassName}
      />
    ),
  }));
