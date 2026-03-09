import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Pojok Property",
  description: "Website Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "text-sm",
              success: {
                style: { background: "#16a34a", color: "white" },
              },
              error: {
                style: { background: "#dc2626", color: "white" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
