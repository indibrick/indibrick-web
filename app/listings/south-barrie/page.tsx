import type { Metadata } from 'next';
import DevelopmentLanding from '../../../components/marketing/DevelopmentLanding';
import { getDevelopmentBySlug } from '../../../lib/developmentsData';
import { buildMetadata } from '../../../lib/buildMetadata';

const data = getDevelopmentBySlug('south-barrie')!;

export const metadata: Metadata = buildMetadata({
  title: data.metaTitle,
  description: data.metaDescription,
  slug: '/listings/south-barrie',
  keywords: data.keywords,
  image: data.heroImageUrl,
  titleAbsolute: true,
});

export const revalidate = 3600;

export default function Page() {
  return <DevelopmentLanding data={data}/>;
}
