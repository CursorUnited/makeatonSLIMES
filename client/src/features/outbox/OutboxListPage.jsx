import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader, Card, DataTable, useListQuery, Modal } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import { api } from '../../api/client';

const COLUMNS = [
  { key: 'toEmail', header: 'To' },
  { key: 'subject', header: 'Subject' },
  { key: 'kind', header: 'Kind' },
  { key: 'createdAt', header: 'Sent', render: (r) => formatDateTime(r.createdAt) },
];

export function OutboxListPage() {
  const query = useListQuery();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['outbox', query],
    queryFn: () => api.get('/outbox', { params: query }).then((r) => r.data),
  });
  const [openId, setOpenId] = useState(null);

  return (
    <div>
      <PageHeader title="Outbox" breadcrumb="Settings" />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load the outbox."}
            onRetry={refetch}
            onRowClick={(row) => setOpenId(row.id)}
            searchPlaceholder="Search subject or recipient…"
            emptyTitle="No emails sent yet."
          />
        </div>
      </Card>
      <OutboxMessageModal id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function OutboxMessageModal({ id, onClose }) {
  const { data } = useQuery({
    queryKey: ['outbox', id],
    queryFn: () => api.get(`/outbox/${id}`).then((r) => r.data.data),
    enabled: id != null,
  });

  return (
    <Modal open={id != null} onClose={onClose} title={data?.subject ?? 'Message'} size="lg">
      {data && (
        <div>
          <p className="mb-3 text-sm text-gray-600">
            To {data.toEmail} &middot; {formatDateTime(data.createdAt)}
          </p>
          <div className="rounded-md border border-gray-200 p-4" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
        </div>
      )}
    </Modal>
  );
}
