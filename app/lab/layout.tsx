import { Header } from "@/components/lab/Header";

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="mx-auto container">
        <Header/>
        <main className="py-4">
            {children}
        </main>
      </div>
    );
  }
  