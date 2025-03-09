import { Button } from "@/components/ui/button"
import {ModeToggle} from "@/components/ModeToggle"

export default function Home() {
  return (
    <div className="text-center">
      <Button>Click me</Button>
      <ModeToggle />
    </div>
  );
}
