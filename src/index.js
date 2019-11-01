const aws = require('aws-sdk')
const s3 = new aws.S3();
const config = require('../config/env.json')

async function getBucketObjects(bucketName) {
    return await s3.listObjectsV2({
        Bucket: bucketName
    }).promise();
}

async function getAllBucketInformation() {
    return await s3.listBuckets().promise();
}