import { Header } from "@/components/Header";

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div>
        <Header/>
        <main className="container py-6">
            {children}
        </main>
      </div>
    );
  }
  