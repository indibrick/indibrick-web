import React from 'react';

// This is where the magic happens for Google and AI bots
export const metadata = {
  title: "1515 Pickering Parkway Condos | VIP Pre-Construction Prices & Floor Plans",
  description: "Register for VIP Access to 1515 Pickering Parkway by Sevoy Developments. Pre-construction condos in Downtown Pickering steps to the GO Station. Starting in the $400s.",
  keywords: "1515 Pickering Parkway, Pickering pre-construction condos, Sevoy Developments, Durham Region real estate investment, Downtown Pickering condos, Pickering GO Station condos, Indibrick",
  openGraph: {
    title: "1515 Pickering Parkway | Exclusive VIP Access",
    description: "Get floor plans and investor pricing for Downtown Pickering's newest landmark transit-oriented condo.",
    images: ['/PICKERING AD .png'], // This makes it look premium when shared on social media
  }
};

export default function PickeringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}