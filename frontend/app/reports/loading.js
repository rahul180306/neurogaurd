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
                    <div className="h-8 w-44 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Report cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-6 animate-pulse">
                            <div className="h-5 w-36 bg-white/10 rounded mb-4" />
                            <div className="h-3 w-full bg-white/5 rounded mb-2" />
                            <div className="h-3 w-2/3 bg-white/5 rounded mb-4" />
                            <div className="h-8 w-24 bg-white/10 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
