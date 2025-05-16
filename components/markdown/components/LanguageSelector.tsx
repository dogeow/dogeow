import React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/helpers'
import { ReactEditor } from 'slate-react'
import { Editor, Element as SlateElement, Path, Transforms } from 'slate'

interface LanguageSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const LANGUAGES = [
  { value: 'text', label: '纯文本' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'php', label: 'PHP' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'swift', label: 'Swift' },
];

export const LanguageSelector = ({ value = 'text', onChange }: LanguageSelectorProps) => {
  const [open, setOpen] = React.useState(false)
  
  // 查找当前选择的语言
  const selectedLanguage = LANGUAGES.find(lang => lang.value === value) || LANGUAGES[0];
  
  // 语言选择处理函数，这里需要额外处理Slate编辑器的更新
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="min-w-[150px] justify-between text-xs"
        >
          {selectedLanguage.label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[200px] p-0">
        <Command>
          <CommandInput placeholder="搜索语言..." />
          <CommandEmpty>未找到语言</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {LANGUAGES.map((language) => (
              <CommandItem
                key={language.value}
                value={language.value}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === language.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {language.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 