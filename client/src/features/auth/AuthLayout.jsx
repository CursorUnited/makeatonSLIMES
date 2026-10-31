export function AuthLayout({ title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-700 text-lg font-semibold text-white">B</span>
          <p className="text-sm text-gray-600">Brightloop Software</p>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
