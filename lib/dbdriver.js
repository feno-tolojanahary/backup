const { MongoClient } = require("mongodb");

exports.databaseExists = async (uri, dbName) => {
    const client = new MongoClient(uri, { connectTimeoutMS: 5000 });

    try {
        await client.connect();
        const adminDb = client.db().admin();
        const { databases } = await adminDb.listDatabases();
        const exists = databases.some(db => db.name === dbName);
        return exists;
    } catch (err) {
        return false;
    }
}