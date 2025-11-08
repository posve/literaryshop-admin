import './globals.css'

export const metadata = {
  title: 'Admin Dashboard - Rare & Fine Books',
  description: 'Manage your bookstore',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}