export function CardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded w-2/3" />
          <div className="h-3 bg-white/5 rounded w-1/3" />
          <div className="flex gap-1.5 mt-1.5">
            <div className="h-5 bg-white/5 rounded-full w-12" />
            <div className="h-5 bg-white/5 rounded-full w-10" />
            <div className="h-5 bg-white/5 rounded-full w-14" />
          </div>
          <div className="h-3 bg-white/5 rounded w-full mt-1.5" />
        </div>
      </div>
    </div>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5 animate-pulse flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded w-3/4" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
      </div>
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="h-3 bg-white/5 rounded w-1/3" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 mx-auto" />
        <div className="h-6 bg-white/5 rounded w-32 mx-auto mt-4" />
        <div className="h-4 bg-white/5 rounded w-20 mx-auto mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="h-3 bg-white/5 rounded w-16" />
            <div className="h-6 bg-white/5 rounded w-12 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
