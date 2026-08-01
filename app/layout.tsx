import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LearnHub - English Proficiency Assessment',
  description: 'Adaptive English proficiency assessment platform with CEFR level evaluation',
  charset: 'utf-8',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
