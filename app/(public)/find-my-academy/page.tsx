import { Metadata } from 'next';
import FindMyAcademyClient from './FindMyAcademyClient';

export const metadata: Metadata = {
  title: 'Find My Best Academy | AI Coaching Matchmaker - AcademyFind',
  description:
    'Tell our AI counselor your target exam (JEE, NEET, UPSC), city, budget, batch size preference, and weaknesses to get your personalized shortlist of the 3 most suitable coaching institutes in India.',
  keywords: [
    'AI coaching matchmaker',
    'best coaching for JEE 2028',
    'NEET coaching recommendations',
    'personalized coaching shortlist',
    'coaching fee comparison India',
    'small batch coaching Agra Delhi Kota',
    'AcademyFind AI counselor',
  ],
  openGraph: {
    title: 'Find My Best Academy | AI Coaching Matchmaker - AcademyFind',
    description:
      'Get a tailored shortlist of the 3 most suitable coaching institutes matching your budget, batch size, learning pace, and city.',
    url: 'https://academyfind.com/find-my-academy',
    siteName: 'AcademyFind',
    type: 'website',
  },
  alternates: {
    canonical: 'https://academyfind.com/find-my-academy',
  },
};

export default function FindMyAcademyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'AcademyFind AI Academy Matchmaker',
    url: 'https://academyfind.com/find-my-academy',
    description:
      'AI-powered personalized coaching matcher evaluating student budget, batch sizes, faculty doubt support, and learning weaknesses.',
    parentOrganization: {
      '@type': 'Organization',
      name: 'AcademyFind',
      url: 'https://academyfind.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FindMyAcademyClient />
    </>
  );
}
