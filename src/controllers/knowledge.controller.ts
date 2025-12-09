import type { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import process from 'process';
import { KnowledgeBaseModel } from '../../shared/models';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export class KnowledgeController {
    static async upload(req: Request, res: Response) {
        const file = req.file;
        // TODO: Get userId from auth middleware. Hardcoded for now.
        const userId = '656e616d65645f6167656e74';

        if (!file) {
            res.status(400).send({ error: 'No file uploaded' });
            return;
        }

        try {
            const buffer = file.buffer;
            const filename = file.originalname;
            const key = `knowledge-base/${userId}/${Date.now()}-${filename}`;

            // Upload to S3
            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: file.mimetype
            }));

            // Save metadata to DB
            const kbEntry = new KnowledgeBaseModel({
                userId,
                filename,
                s3Key: key,
                contentType: file.mimetype,
                size: file.size
            });
            await kbEntry.save();

            res.send(kbEntry);
        } catch (err) {
            console.error('Upload Error:', err);
            res.status(500).send({ error: 'Upload failed' });
        }
    }

    static async list(req: Request, res: Response) {
        // TODO: Get userId from auth middleware. Hardcoded for now.
        const userId = '656e616d65645f6167656e74';

        try {
            const files = await KnowledgeBaseModel.find({ userId }).sort({ createdAt: -1 });
            res.send(files);
        } catch (err) {
            console.error('List Error:', err);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    }
}
