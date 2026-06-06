import React from 'react';
import { buildMetadata } from '../../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: '1515 Pickering Parkway Condos — VIP Pre-Construction Prices & Floor Plans',
  description: "Register for VIP Access to 1515 Pickering Parkway by Sevoy Developments. Pre-construction condos in Downtown Pickering steps to the GO Station. Starting in the $400s.",
  slug: '/vip-access/1515-pickering-pkwy',
  image: '/PICKERING AD .png',
  keywords: ['1515 Pickering Parkway', 'Pickering pre-construction condos', 'Sevoy Developments', 'Durham Region real estate investment', 'Downtown Pickering condos', 'Pickering GO Station condos'],
});

export default function PickeringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}