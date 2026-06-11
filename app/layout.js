export const metadata = {
  title: "Life RPG",
  description: "Master your attributes. Level up your life.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life RPG",
  },
};

export const viewport = {
  themeColor: "#07060f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#07060f" }}>{children}</body>
    </html>
  );
}
