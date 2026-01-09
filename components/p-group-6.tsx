import {
  Archive,
  DotsThree,
  FilmStrip,
  Files,
  PencilSimple,
  ShareNetwork,
  Trash,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Group, GroupSeparator } from "@/components/ui/group";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";

export default function Particle() {
  return (
    <Group aria-label="File actions">
      <Button>
        <Files />
        Files
      </Button>
      <GroupSeparator />
      <Button>
        <FilmStrip />
        Media
      </Button>
      <GroupSeparator />
      <Menu>
        <MenuTrigger render={<Button aria-label="Menu" size="icon" />}>
          <DotsThree className="size-4" />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem>
            <PencilSimple />
            Edit
          </MenuItem>
          <MenuItem>
            <Archive />
            Archive
          </MenuItem>
          <MenuItem>
            <ShareNetwork />
            Share
          </MenuItem>
          <MenuItem variant="destructive">
            <Trash />
            Delete
          </MenuItem>
        </MenuPopup>
      </Menu>
    </Group>
  );
}
