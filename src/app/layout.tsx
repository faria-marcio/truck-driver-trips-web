export const metadata = {
  title: 'Truck Driver Trips',
  description: 'Log and track your daily trips',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}