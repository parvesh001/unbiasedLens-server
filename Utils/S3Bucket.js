const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

//creating client instance
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.S3_BUCKET_SECRET_ACCESS_KEY,
  },
  region: process.env.S3_REGION,
});

exports.setFileToS3Bucket = async (
  bucket,
  fileName,
  buffer,
  contentType,
  next
) => {
  const params = {
    Bucket: bucket,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  };
  const command = new PutObjectCommand(params);
  try {
    const result = await s3Client.send(command);
    return result;
  } catch (err) {
    next(err);
  }
};

exports.deleteFileFromS3Bucket = async (url, next) => {
  const parts = url.split("amazonaws.com/");
  const key = parts[1];
  const deleteParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };
  const deleteCommand = new DeleteObjectCommand(deleteParams);
  try {
    await s3Client.send(deleteCommand);
  } catch (err) {
    next(err)
  }
}