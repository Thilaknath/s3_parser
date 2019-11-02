# AWS S3 Parser tool 

The tool returns the following information

For each bucket:
- Name
- Region
- Creation date
- Number of files
- Total size of files
- Last modified date of the most recent file
- Last modified file
- Bucket Cost (Currently returns the sum of BlendedCost for a particular Bucket) 

Usage
Clone the repository and set your aws credentials (Stored as an environment variable in the system)

***
    $ npm i


Parameters
- b [bucketName] (coveotest1, coveotest2, coveotest3, coveotest4)
- t [storageType] (STANDARD, INTELLIGENT_TIERING, REDUCED_REDUNDANCY)

***

    $ node ./index.js -b coveotest1 -t INTELLIGENT_TIERING
