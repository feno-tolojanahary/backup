const s3Wasabi = require("../helper/s3");

async function listAllObjectsFromSourceBucket({ source, sourceConfig = null, prefix = "" } = {}) {
    if (!source || typeof source !== "string" || !source.trim()) {
        throw new Error("A valid source bucket name is required.");
    }

    const trimmedSource = source.trim();
    const s3 = s3Wasabi.getClient(sourceConfig);
    const objects = [];
    let continuationToken;

    do {
        const response = await s3.listObjectsV2({
            Bucket: trimmedSource,
            Prefix: prefix || undefined,
            ContinuationToken: continuationToken
        }).promise();

        if (Array.isArray(response.Contents) && response.Contents.length > 0) {
            objects.push(...response.Contents);
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return objects;
}

async function objectExistsInBucket(s3Client, bucket, key) {
    try {
        await s3Client.headObject({
            Bucket: bucket,
            Key: key
        }).promise();
        return true;
    } catch (error) {
        if (error && (error.code === "NotFound" || error.statusCode === 404)) {
            return false;
        }
        throw error;
    }
}

async function replicateMissingObjectsToDestination({
    source,
    sourceConfig = null,
    destination,
    destinationConfig = null,
    sourceObjects = []
} = {}) {
    if (!destination || typeof destination !== "string" || !destination.trim()) {
        throw new Error("A valid destination bucket name is required.");
    }

    const trimmedSource = source && typeof source === "string" ? source.trim() : "";
    const trimmedDestination = destination.trim();
    const sourceS3 = s3Wasabi.getClient(sourceConfig);
    const destinationS3 = s3Wasabi.getClient(destinationConfig);

    const result = {
        uploaded: [],
        skipped: []
    };

    for (const objectMeta of sourceObjects) {
        const key = objectMeta && objectMeta.Key ? objectMeta.Key : null;
        if (!key) {
            continue;
        }

        const alreadyExists = await objectExistsInBucket(destinationS3, trimmedDestination, key);
        if (alreadyExists) {
            result.skipped.push(key);
            continue;
        }

        const objectData = await sourceS3.getObject({
            Bucket: trimmedSource,
            Key: key
        }).promise();

        await destinationS3.putObject({
            Bucket: trimmedDestination,
            Key: key,
            Body: objectData.Body,
            ContentType: objectData.ContentType
        }).promise();

        result.uploaded.push(key);
    }

    return result;
}

module.exports = {
    listAllObjectsFromSourceBucket,
    replicateMissingObjectsToDestination
};
