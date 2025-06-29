import { CheckCheck, RefreshCcwDot } from "lucide-react";
import { useEditor } from "novel";
import { CommandGroup, CommandItem, CommandSeparator } from "../ui/command";

interface AICompletionCommandsProps {
  onDiscard: () => void;
  completion: string;
  originalSelection?: {from: number, to: number} | null;
}

const AICompletionCommands = ({ onDiscard, completion, originalSelection }: AICompletionCommandsProps) => {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <>
      <CommandGroup heading="Accept">
        <CommandItem
          onSelect={() => {
            // Accept the completion - 替换选中的文本
            if (editor && completion) {
              // 使用原始选择范围，如果没有则使用当前选择
              const selection = originalSelection || editor.state.selection;
              const { from, to } = selection;
              editor.chain().focus().deleteRange({ from, to }).insertContent(completion).run();
            }
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