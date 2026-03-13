export default function Loading() {
    return (
        <div
            className="min-h-screen w-full bg-[#0a0a0a] text-white relative overflow-hidden"
            role="status"
            aria-live="polite"
        >
            <span className="sr-only">Loading...</span>
            <div className="relative z-10 pt-28 pb-12 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto">
                <div className="mb-8">
                    <div className="h-3 w-16 bg-white/5 rounded mb-2 animate-pulse" />
                    <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Table skeleton */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                                <div className="flex-1 h-4 bg-white/5 rounded animate-pulse" />
                                <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
                                <div className="w-16 h-6 bg-white/10 rounded-full animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
