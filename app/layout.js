export const metadata = {
  title: 'Lumivo — AI-Powered Global Opportunities',
  description: 'Lumivo uses AI to discover jobs, scholarships and migration pathways tailored to your profile — worldwide.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png',    type: 'image/png', sizes: '32x32' },
    ],
    apple: { url: '/apple-icon.png', sizes: '180x180' },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
