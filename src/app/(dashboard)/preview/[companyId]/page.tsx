import { WebflowPreview } from '@/components/webflow-preview';

interface PreviewPageProps {
  params: {
    companyId: string;
  };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  return (
    <div className="container mx-auto p-8">
      <WebflowPreview companyId={params.companyId} />
    </div>
  );
}
