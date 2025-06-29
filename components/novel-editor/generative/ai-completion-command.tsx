import { CheckCheck, RefreshCcwDot } from "lucide-react";
import { useEditor } from "novel";
import { CommandGroup, CommandItem, CommandSeparator } from "../ui/command";

interface AICompletionCommandsProps {
  onDiscard: () => void;
  completion: string;
}

const AICompletionCommands = ({ onDiscard }: AICompletionCommandsProps) => {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <>
      <CommandGroup heading="Accept">
        <CommandItem
          onSelect={() => {
            // Accept the completion
            onDiscard();
          }}
          className="flex gap-2 px-4"
          value="accept"
        >
          <CheckCheck className="h-4 w-4 text-green-500" />
          Accept
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Discard">
        <CommandItem
          onSelect={onDiscard}
          value="discard"
          className="gap-2 px-4"
        >
          <RefreshCcwDot className="h-4 w-4 text-red-500" />
          Discard
        </CommandItem>
      </CommandGroup>
    </>
  );
};

export default AICompletionCommands;