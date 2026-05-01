import { UploadForm } from '@/components/upload-form';

export const metadata = {
  title: 'Upload your hotel inventory — Hotel Mapping Tool',
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Upload your hotel inventory
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll match each row to a Tripadvisor Location ID using our four-signal scoring algorithm.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
