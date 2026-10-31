import { PageHeader, Card, EmptyState } from './ui';
import { Hourglass } from 'lucide-react';

/** Placeholder so every route in the nav resolves to something real while the screen is being built. */
export function ComingSoon({ title }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <EmptyState icon={Hourglass} title="This screen is being built." />
      </Card>
    </div>
  );
}
