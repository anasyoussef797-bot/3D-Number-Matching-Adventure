import React from 'react';
import './globals.css';

export const metadata = {
  title: '3D Number Matching Adventure - Impact Hub Egypt',
  description: 'An interactive AAA 3D educational game for children aged 3-6 to master numbers and counting through matching quantities on floating 3D islands.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}
