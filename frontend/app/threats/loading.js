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
                    <div className="h-8 w-56 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Threat cards skeleton */}
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-white/10" />
                                    <div className="h-5 w-40 bg-white/10 rounded" />
                                </div>
                                <div className="h-5 w-16 bg-white/10 rounded-full" />
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded mb-2" />
                            <div className="h-3 w-2/3 bg-white/5 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
