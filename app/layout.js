export const metadata = {
  title: 'Codelabs — AI-Powered Global Opportunities',
  description: 'Discover jobs, scholarships and migration pathways tailored to your profile. Powered by Codelabs Pvt Ltd.',
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
