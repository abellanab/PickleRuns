export default function DashboardLoading() {
  return (
    <div className="app-shell px-5">
      <div className="pt-10 h-12 w-40 bg-bg-surface rounded-md animate-pulse" />
      <div className="mt-8 flex flex-col gap-3">
        <div className="h-28 bg-bg-surface rounded-lg animate-pulse" />
        <div className="h-28 bg-bg-surface rounded-lg animate-pulse" />
        <div className="h-28 bg-bg-surface rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
