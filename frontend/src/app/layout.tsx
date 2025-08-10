import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeContextProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/auth-context";
import { SocketProvider } from "../contexts/SocketContext";
import { RealtimeNotifications } from "../components/notifications/RealtimeNotifications";
import { SocketDebugger } from "../components/SocketDebugger";
import "./globals.css";

// Note: Install React DevTools browser extension for better development experience
// Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
// Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Prevent font preload warnings
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Prevent font preload warnings
  preload: true,
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: "WhatsApp API Wrapper",
  description: "Frontend application for WhatsApp Web.js REST API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeContextProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <RealtimeNotifications
                enabled={true}
                position={{ vertical: 'top', horizontal: 'right' }}
                enableSound={true}
                enablePushNotifications={true}
                maxNotifications={5}
                autoHideDuration={5000}
              />
              {process.env.NODE_ENV === 'development' && <SocketDebugger />}
            </SocketProvider>
          </AuthProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
