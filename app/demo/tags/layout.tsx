import { Metadata } from "next"

export const metadata: Metadata = {
  title: "标签选择器演示",
  description: "展示自定义标签选择器组件的功能和用法",
}

export default function TagsDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
} 