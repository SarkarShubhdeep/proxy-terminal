"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
      <Toaster richColors closeButton />
    </ThemeProvider>
  );
}
