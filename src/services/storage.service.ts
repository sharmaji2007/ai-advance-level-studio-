import AWS from 'aws-sdk';
import path from 'path';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const BUCKET = process.env.S3_BUCKET || 'ai-studio-media';

export async function uploadToS3(
  file: Express.Multer.File,
  userId: string,
  folder: string = 'uploads'
): Promise<string> {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${userId}/${randomUUID()}${fileExtension}`;

    await s3.putObject({
      Bucket: BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    }).promise();

    logger.info(`File uploaded to S3: ${fileName}`);

    return fileName;
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw error;
  }
}

export async function uploadBufferToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    await s3.putObject({
      Bucket: BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private'
    }).promise();

    logger.info(`Buffer uploaded to S3: ${fileName}`);

    return fileName;
  } catch (error) {
    logger.error('S3 buffer upload error:', error);
    throw error;
  }
}

export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: BUCKET,
      Key: key,
      Expires: expiresIn
    });

    return url;
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    throw error;
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  try {
    await s3.deleteObject({
      Bucket: BUCKET,
      Key: key
    }).promise();

    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw error;
  }
}
