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

function getBucketCreationDate(allBucketObject, bucketName){
    let filteredBucket = allBucketObject.Buckets.filter(function(bucket){
        return bucket.Name == bucketName
    })

    return filteredBucket[0].CreationDate
}

function calculateFileSize(bucketContents, storageClass){
    let objectSizeArray = []
    let filteredBucketObjects = filterStorageClass(bucketContents, storageClass)

    filteredBucketObjects.forEach((bucket) => {
            objectSizeArray.push(bucket.Size)
    })

    let totalBucketSize = arr => arr.reduce((a,b) => a + b, 0)
    return formatBytes(totalBucketSize(objectSizeArray), 2) 
}

function filterStorageClass(objects, storageClass){
    let filteredObjects = objects.Contents.filter(function(object){
        return object.StorageClass == storageClass
    })

    return filteredObjects
}