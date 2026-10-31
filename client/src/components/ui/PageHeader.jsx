export function PageHeader({ title, breadcrumb, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        {breadcrumb && <p className="text-sm text-gray-500">{breadcrumb}</p>}
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
