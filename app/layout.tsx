import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
