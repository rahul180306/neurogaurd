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
                    <div className="h-8 w-52 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Stats row skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                    ))}
                </div>

                {/* Topology / table skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-72 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                    <div className="h-72 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                </div>
            </div>
        </div>
    );
}
