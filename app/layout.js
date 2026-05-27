export const metadata = {
  title: "Life RPG",
  description: "Master Your Attributes",
  manifest: "/manifest.json",
  themeColor: "#060610",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life RPG",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body style={{ margin: 0, background: "#060610", fontFamily: "'Georgia', serif", color: "#e5e7eb", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
