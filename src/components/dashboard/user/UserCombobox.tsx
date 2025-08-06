import * as React from "react";
import { Check, ChevronsUpDown, Loader } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { GetOrgUsersQueryResponse, useGetOrgUsers } from "~/lib/kubb";

export default function UserCombobox({
  user: selectedUser,
  onSelect,
}: {
  user?: GetOrgUsersQueryResponse["array"][number];
  onSelect?: (user: GetOrgUsersQueryResponse["array"][number]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const getOrgUsersQuery = useGetOrgUsers(undefined, {
    query: {
      enabled: open,
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedUser != null
            ? [selectedUser.first_name, selectedUser.surname].join(" ")
            : "Select user..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        {getOrgUsersQuery.status === "success" ? (
          <Command>
            <CommandInput placeholder="Search user..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {getOrgUsersQuery.data?.array.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => {
                      onSelect?.(user);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        user.id === selectedUser?.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {[user.first_name, user.surname].join(" ")}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : getOrgUsersQuery.status === "pending" ? (
          <div className="flex justify-center p-2">
            <Loader className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div>{getOrgUsersQuery.error.message}</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
