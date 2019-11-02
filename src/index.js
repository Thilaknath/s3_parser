const aws = require('aws-sdk')
aws.config.update({ region: 'us-east-1' });

const s3 = new aws.S3();
const awsCost = new aws.CostExplorer();
const config = require('../config/env.json')

const argv = require('yargs')
    .usage('Usage: $0 -b -t [string] [string]')
    .demandOption(['b', 't'])
    .argv;

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

async function getBucketTags(bucketName) {
    return await s3.getBucketTagging({
        Bucket: bucketName
    }).promise();
}

async function getAWSCost() {
    return await awsCost.getCostAndUsage({
        Filter: {
            Dimensions: {
                Key: "SERVICE",
                Values: [
                    "Amazon Simple Storage Service"
                ]
            }
        },
        Granularity: "MONTHLY",
        GroupBy: [
            {
                Key: "SERVICE",
                Type: "DIMENSION"
            },
            {
                Key: "costCentre",
                Type: "TAG"
            }
        ],
        TimePeriod: {
            End: "2019-11-02",
            Start: "2019-10-20"
        },
        Metrics: ["BlendedCost", "UnblendedCost", "UsageQuantity"],

    }).promise();
}

function getBucketCreationDate(allBucketObject, bucketName) {
    return allBucketObject.Buckets.filter(function (bucket) {
        return bucket.Name == bucketName
    })[0].CreationDate
}

function calculateFileSize(bucketContents, storageClass) {
    let objectSizeArray = []
    let filteredBucketObjects = filterStorageClass(bucketContents, storageClass)

    filteredBucketObjects.forEach((bucket) => {
        objectSizeArray.push(bucket.Size)
    })

    let totalBucketSize = arr => arr.reduce((a, b) => a + b, 0)
    return formatBytes(totalBucketSize(objectSizeArray), 2)
}

function calculateNoOfFiles(bucketContents, storageClass) {
    let filteredBucketObjects = filterStorageClass(bucketContents, storageClass)

    if (filteredBucketObjects == 0)
        return 0

    return filteredBucketObjects.length
}

function filterStorageClass(objects, storageClass) {
    let filteredObjects = objects.Contents.filter(function (object) {
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

function getTags(bucketTags) {
    let tagSetArray = []
    bucketTags.TagSet.forEach((tag) => {
        tagSetArray.push(`${tag.Key}$${tag.Value}`)
    })
    return tagSetArray
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function calculateBucketCost(groupObject, bucketTags) {

    let tagSetArray = getTags(bucketTags)
    let amount = 0

    if (groupObject.ResultsByTime.length > 0) {
        groupObject.ResultsByTime.forEach((result) => {
            if (result.Groups.length > 0) {
                result.Groups.map(x => {
                    let keyValue = x.Keys.find(i => i.includes('$'))
                    if (tagSetArray.includes(keyValue)) {
                        amount += parseFloat(x.Metrics.BlendedCost.Amount);
                    }
                })
            }
        })
    }

    return amount
}

function getBucketInformation(bucketName, storageClass) {
    Promise.all([
        getAllBucketInformation(),
        getBucketObjects(bucketName),
        getBucketLocation(bucketName),
        getBucketTags(bucketName),
        getAWSCost()
    ]).then((res) => {

        let bucketInfo = res[0]
        let bucketObjectInfo = res[1]
        let bucketLocation = res[2]
        let bucketTags = res[3]
        let bucketCostInfo = res[4]

        console.table({
            name: bucketName,
            region: bucketLocation.LocationConstraint,
            storageType: storageClass,
            creationDate: getBucketCreationDate(bucketInfo, bucketName).toLocaleDateString("en-US"),
            numberOfFiles: calculateNoOfFiles(bucketObjectInfo, storageClass),
            totalFileSize: calculateFileSize(bucketObjectInfo, storageClass),
            lastModifiedDate: mostRecentFile(bucketObjectInfo, storageClass)[0].LastModified.toLocaleDateString("en-US"),
            lastModifiedFile: mostRecentFile(bucketObjectInfo, storageClass)[0].Key,
            bucketCost: calculateBucketCost(bucketCostInfo, bucketTags)
        })
    })
}

getBucketInformation(argv.b, argv.t)