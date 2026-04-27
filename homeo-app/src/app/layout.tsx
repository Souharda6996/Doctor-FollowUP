import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'MediFollowUp — Universal Doctor Follow-Up Platform',
  description:
    'Structured, continuous follow-up between doctors, patients, and caretakers. Works for any medical specialty — General Physician, Cardiologist, Homeopath, Physiotherapist, and more.',
  keywords: ['doctor follow-up', 'patient management', 'telemedicine', 'health tracking', 'medical'],
  authors: [{ name: 'MediFollowUp' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
