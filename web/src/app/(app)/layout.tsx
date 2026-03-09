import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/context/theme-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <header className="sticky top-0 z-50">
        <Navbar />
      </header>
      <main>{children}</main>
    </ThemeProvider>
  );
}
