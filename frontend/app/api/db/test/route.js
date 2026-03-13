import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        // Ping the database to confirm connection
        await db.command({ ping: 1 });

        // Get list of existing collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map((c) => c.name);

        return NextResponse.json({
            success: true,
            message: "✅ Successfully connected to MongoDB Atlas!",
            database: process.env.MONGODB_DB,
            collections: collectionNames,
            clusterInfo: client.options?.srvHost || "Connected",
        });
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                error: err.message,
            },
            { status: 500 }
        );
    }
}
