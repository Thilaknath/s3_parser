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

async function getBucketLocation(bucketName) {
    return await s3.getBucketLocation({
        Bucket: bucketName
    }).promise();
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

function mostRecentFile(bucketContents, storageClass) {

    try {
        let filteredBucketObjects = filterStorageClass(bucketContents, storageClass)

        if (filteredBucketObjects.length == 0) {
            return [{
                LastModified: "NO DATA",
                Key: "NO DATA"
            }]
        } else if (filteredBucketObjects.length < 1) {
            return filteredBucketObjects
        } else {
            return filteredBucketObjects.sort((x, y) => {
                let date1 = new Date(x.LastModified);
                let date2 = new Date(y.LastModified);
                return date2 - date1;
            })
        }
    } catch (exception) {
        console.log('Most Recent File Exception', exception)
    }

}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getBucketInformation(bucketName, storageClass) {
    Promise.all([
        getAllBucketInformation(),
        getBucketObjects(bucketName),
        getBucketLocation(bucketName)
    ]).then((res) => {
        console.log({
            name: bucketName,
            region: res[2].LocationConstraint,
            creationDate: getBucketCreationDate(res[0], bucketName),
            numberOfFiles: mostRecentFile(res[1], storageClass).length,
            totalFileSize: calculateFileSize(res[1], storageClass),
            lastModifiedDate: mostRecentFile(res[1], storageClass)[0].LastModified,
            lastModifiedFile: mostRecentFile(res[1], storageClass)[0].Key
        })
    })
}

getBucketInformation('coveotest2', 'INTELLIGENT_TIERING')
//getBucketInformation('coveotest1', 'INTELLIGENT_TIERING')