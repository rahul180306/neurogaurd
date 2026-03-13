import { Comfortaa } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import VoiceAgent from "@/components/dashboard/VoiceAgent";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "NeuroGaurd",
  description: "NeuroGaurd - Global Network Monitoring",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${comfortaa.variable} font-comfortaa antialiased overflow-x-hidden min-h-screen relative`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <Navbar />
          {children}
          <VoiceAgent />
        </ThemeProvider>
      </body>
    </html>
  );
}
