"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

export function Navbar() {
    const pathname = usePathname();

    const navTabs = [
        { name: "Home", href: "/" },
        { name: "Dashboard", href: "/dashboard" },
        { name: "Devices", href: "/devices" },
        { name: "Threats", href: "/threats" },
        { name: "Network", href: "/network" },
        { name: "Investigations", href: "/investigations" },
        { name: "Reports", href: "/reports" },
    ];

    return (
        <>
            {/* Logo + Brand Name */}
            <div className="absolute top-6 left-2 z-50 flex items-center gap-2">
                <Image
                    src="/nglogo.png"
                    alt="NeuroGaurd Logo"
                    width={72}
                    height={72}
                    className="object-contain"
                    priority
                />
                <h1 className="text-4xl tracking-wide -ml-3 pointer-events-none select-none">
                    <span className="font-semibold text-white">Neuro</span>
                    <span className="font-light text-gray-400">Gaurd</span>
                </h1>
            </div>

            {/* Liquid Glass Navbar - Center */}
            <div className="absolute top-7 left-1/2 -translate-x-1/2 z-50">
                <LiquidButton as="div" size="lg" variant="default" className="rounded-full px-3 py-1.5 h-12 cursor-default">
                    <nav className="flex items-center gap-1 text-sm font-medium">
                        {navTabs.map((tab) => {
                            const isActive = pathname === tab.href;
                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className={`relative px-3 py-1.5 transition-colors z-20 whitespace-nowrap ${isActive ? "text-white" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.2)] border border-white/20 -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </nav>
                </LiquidButton>
            </div>
        </>
    );
}
