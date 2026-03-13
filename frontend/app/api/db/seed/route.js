import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        // ── 1. Threats Collection ──────────────────────────────────
        const threatsCollection = db.collection("threats");
        const existingThreats = await threatsCollection.countDocuments();

        if (existingThreats === 0) {
            await threatsCollection.insertMany([
                {
                    type: "Port Scan",
                    severity: "High",
                    sourceIp: "192.168.1.105",
                    targetDevice: "Smart Camera",
                    status: "active",
                    description: "Sequential port scanning detected from external IP targeting IoT camera on ports 80, 443, 554, 8080.",
                    timestamp: new Date("2026-03-10T18:42:31Z"),
                    resolved: false,
                },
                {
                    type: "Brute Force",
                    severity: "Critical",
                    sourceIp: "10.0.0.87",
                    targetDevice: "IoT Gateway",
                    status: "active",
                    description: "Multiple failed SSH authentication attempts detected. 847 attempts in 5 minutes from botnet signature.",
                    timestamp: new Date("2026-03-10T18:38:14Z"),
                    resolved: false,
                },
                {
                    type: "DoS Attempt",
                    severity: "Medium",
                    sourceIp: "172.16.0.44",
                    targetDevice: "Thermostat",
                    status: "mitigated",
                    description: "SYN flood packets detected targeting thermostat API endpoint. Rate limiting applied.",
                    timestamp: new Date("2026-03-10T18:35:02Z"),
                    resolved: true,
                },
                {
                    type: "Unauthorized Access",
                    severity: "High",
                    sourceIp: "192.168.1.201",
                    targetDevice: "Smart Lock",
                    status: "active",
                    description: "Unauthorized API call intercepted attempting to unlock smart door lock using expired token.",
                    timestamp: new Date("2026-03-10T18:29:56Z"),
                    resolved: false,
                },
                {
                    type: "Malware Beacon",
                    severity: "Low",
                    sourceIp: "10.0.0.15",
                    targetDevice: "Smart Bulb",
                    status: "monitoring",
                    description: "Periodic outbound connection to known C2 server IP detected from smart bulb firmware.",
                    timestamp: new Date("2026-03-10T18:15:22Z"),
                    resolved: false,
                },
            ]);
        }

        // ── 2. Devices Collection ──────────────────────────────────
        const devicesCollection = db.collection("devices");
        const existingDevices = await devicesCollection.countDocuments();

        if (existingDevices === 0) {
            await devicesCollection.insertMany([
                {
                    name: "Smart Camera",
                    type: "Camera",
                    ipAddress: "192.168.1.50",
                    macAddress: "AA:BB:CC:DD:EE:01",
                    status: "under_attack",
                    firmware: "v2.1.4",
                    lastSeen: new Date(),
                    vulnerabilities: 3,
                },
                {
                    name: "IoT Gateway",
                    type: "Gateway",
                    ipAddress: "192.168.1.1",
                    macAddress: "AA:BB:CC:DD:EE:02",
                    status: "suspicious",
                    firmware: "v5.0.2",
                    lastSeen: new Date(),
                    vulnerabilities: 1,
                },
                {
                    name: "Thermostat",
                    type: "Sensor",
                    ipAddress: "192.168.1.101",
                    macAddress: "AA:BB:CC:DD:EE:03",
                    status: "safe",
                    firmware: "v1.8.0",
                    lastSeen: new Date(),
                    vulnerabilities: 0,
                },
                {
                    name: "Smart Lock",
                    type: "Actuator",
                    ipAddress: "192.168.1.120",
                    macAddress: "AA:BB:CC:DD:EE:04",
                    status: "safe",
                    firmware: "v3.2.1",
                    lastSeen: new Date(),
                    vulnerabilities: 0,
                },
                {
                    name: "Smart Bulb",
                    type: "Light",
                    ipAddress: "192.168.1.155",
                    macAddress: "AA:BB:CC:DD:EE:05",
                    status: "monitoring",
                    firmware: "v1.0.3",
                    lastSeen: new Date(),
                    vulnerabilities: 2,
                },
            ]);
        }

        // ── 3. Security Events (Audit Log) ─────────────────────────
        const eventsCollection = db.collection("security_events");
        const existingEvents = await eventsCollection.countDocuments();

        if (existingEvents === 0) {
            await eventsCollection.insertMany([
                {
                    action: "Firewall Rule Added",
                    type: "auto_response",
                    details: "Blocked IP 192.168.1.105 on all ports",
                    triggeredBy: "AI Engine",
                    timestamp: new Date("2026-03-10T18:42:35Z"),
                },
                {
                    action: "Rate Limit Applied",
                    type: "auto_response",
                    details: "Applied rate limiting to Thermostat API endpoint (max 10 req/min)",
                    triggeredBy: "AI Engine",
                    timestamp: new Date("2026-03-10T18:35:10Z"),
                },
                {
                    action: "Alert Escalated",
                    type: "notification",
                    details: "Critical brute force alert sent to SOC team via Slack",
                    triggeredBy: "System",
                    timestamp: new Date("2026-03-10T18:38:20Z"),
                },
                {
                    action: "Token Revoked",
                    type: "auto_response",
                    details: "Expired authentication token revoked and device re-authenticated",
                    triggeredBy: "AI Engine",
                    timestamp: new Date("2026-03-10T18:30:05Z"),
                },
                {
                    action: "Firmware Scan Initiated",
                    type: "scan",
                    details: "Deep firmware integrity scan started on Smart Bulb (v1.0.3)",
                    triggeredBy: "Manual",
                    timestamp: new Date("2026-03-10T18:16:00Z"),
                },
            ]);
        }

        // ── 4. Analytics / Stats Snapshot ──────────────────────────
        const analyticsCollection = db.collection("analytics");
        const existingAnalytics = await analyticsCollection.countDocuments();

        if (existingAnalytics === 0) {
            await analyticsCollection.insertOne({
                date: new Date("2026-03-10"),
                totalThreats: 89,
                criticalThreats: 12,
                threatsBlocked: 73,
                activeDevices: 5,
                systemUptime: 99.97,
                attackDistribution: {
                    portScan: 35,
                    bruteForce: 25,
                    dos: 20,
                    unauthorized: 12,
                    other: 8,
                },
                weeklyTrends: [
                    { day: "Sun", threats: 12 },
                    { day: "Mon", threats: 8 },
                    { day: "Tue", threats: 15 },
                    { day: "Wed", threats: 24 },
                    { day: "Thu", threats: 18 },
                    { day: "Fri", threats: 7 },
                    { day: "Sat", threats: 5 },
                ],
            });
        }

        // Create indexes for performance
        await threatsCollection.createIndex({ timestamp: -1 });
        await threatsCollection.createIndex({ severity: 1 });
        await devicesCollection.createIndex({ status: 1 });
        await eventsCollection.createIndex({ timestamp: -1 });

        // Return summary
        const summary = {
            threats: await threatsCollection.countDocuments(),
            devices: await devicesCollection.countDocuments(),
            security_events: await eventsCollection.countDocuments(),
            analytics: await analyticsCollection.countDocuments(),
        };

        return NextResponse.json({
            success: true,
            message: "✅ Database seeded successfully!",
            collections: summary,
        });
    } catch (err) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
