import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const collection = searchParams.get("collection");

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        // If no collection specified, return overview of all collections
        if (!collection) {
            const collections = await db.listCollections().toArray();
            const overview = {};

            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                overview[col.name] = { documentCount: count };
            }

            return NextResponse.json({
                success: true,
                database: process.env.MONGODB_DB,
                collections: overview,
                usage: "Add ?collection=threats (or devices, security_events, analytics) to see documents",
            });
        }

        // Fetch documents from the specified collection
        const docs = await db
            .collection(collection)
            .find({})
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json({
            success: true,
            collection: collection,
            count: docs.length,
            documents: docs,
        });
    } catch (err) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
