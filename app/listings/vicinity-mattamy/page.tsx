import type { Metadata } from 'next';
import DevelopmentLanding from '../../../components/marketing/DevelopmentLanding';
import { getDevelopmentBySlug } from '../../../lib/developmentsData';
import { buildMetadata } from '../../../lib/buildMetadata';

const data = getDevelopmentBySlug('vicinity-mattamy')!;

export const metadata: Metadata = buildMetadata({
  title: data.metaTitle,
  description: data.metaDescription,
  slug: '/listings/vicinity-mattamy',
  keywords: data.keywords,
  image: data.heroImageUrl,
  titleAbsolute: true,
});

export const revalidate = 3600;

export default function Page() {
  return <DevelopmentLanding data={data}/>;
}
