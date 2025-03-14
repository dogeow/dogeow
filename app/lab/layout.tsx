import { Header } from "@/components/Header";

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="mx-auto container">
        <Header/>
        <main className="py-6">
            {children}
        </main>
      </div>
    );
  }
  