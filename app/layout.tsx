import "./globals.css";
import { Toaster } from "sonner";
import {Providers} from "./provider";
export const metadata = {
  title: 'Flowline', // This is the title that will appear in the browser tab
  description: 'A social media platform for sharing and connecting.',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
        {children}
        <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
