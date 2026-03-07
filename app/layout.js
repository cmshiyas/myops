export const metadata = {
  title: 'OpportunityFinder — AI-Powered Global Opportunities',
  description: 'Discover jobs, scholarships and migration pathways tailored to your profile by Claude AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
