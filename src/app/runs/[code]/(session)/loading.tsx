export default function SessionLoading() {
  return (
    <div className="app-shell px-5">
      <div className="pt-10 h-12 w-48 bg-bg-surface rounded-md animate-pulse" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="h-40 bg-bg-surface rounded-lg animate-pulse" />
        <div className="h-40 bg-bg-surface rounded-lg animate-pulse" />
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <div className="h-11 bg-bg-surface rounded-md animate-pulse" />
        <div className="h-11 bg-bg-surface rounded-md animate-pulse" />
        <div className="h-11 bg-bg-surface rounded-md animate-pulse" />
      </div>
    </div>
  );
}
