import { ErrorFallback } from '@/components/ErrorFallback';

export default function NotFound() {
  return (
    <ErrorFallback
      code="404"
      title="Page not found"
      subtitle="The requested skill has not been dispensed"
    />
  );
}
