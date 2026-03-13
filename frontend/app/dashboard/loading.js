export default function Loading() {
    return (
        <div
            className="min-h-screen w-full bg-[#0a0a0a] text-white relative overflow-hidden"
            role="status"
            aria-live="polite"
        >
            <span className="sr-only">Loading dashboard...</span>

            <div className="relative z-10 pt-28 pb-12 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto">

                {/* Header skeleton */}
                <div className="mb-8">
                    <div className="h-3 w-20 bg-white/5 rounded mb-2 animate-pulse" />
                    <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Cards skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="min-h-[96px] rounded-2xl bg-white/5 border border-white/10 animate-pulse"
                        />
                    ))}
                </div>

                {/* Main grid skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="min-h-[256px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                        <div className="min-h-[192px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                    </div>

                    <div className="space-y-6">
                        <div className="min-h-[160px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                        <div className="min-h-[160px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                        <div className="min-h-[128px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                    </div>
                </div>

            </div>
        </div>
    );
}
