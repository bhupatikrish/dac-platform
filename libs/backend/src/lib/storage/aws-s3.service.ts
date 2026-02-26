import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, DocumentNode } from './storage.provider';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
// Note: We'll install the aws-sdk momentarily.

@Injectable()
export class AwsS3StorageService implements StorageProvider {
    private readonly logger = new Logger(AwsS3StorageService.name);
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = process.env.AWS_S3_DOCUMENT_BUCKET || 'dac-enterprise-docs';
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1'
        });
    }

    async getDocumentContent(path: string): Promise<string> {
        this.logger.debug(`Fetching from S3 gs://${this.bucketName}/${path}`);

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: path,
            });

            const response = await this.s3Client.send(command);
            return response.Body ? await response.Body.transformToString() : '';
        } catch (error: any) {
            this.logger.error(`Failed to fetch document from S3: ${path}`, error.stack);
            throw new Error(`Document not found: ${path}`);
        }
    }

    async getCatalogTree(): Promise<DocumentNode[]> {
        // In Production mode, the S3 driver isn't actually responsible for building the tree.
        // That is the job of the Catalog Postgres Registry API!
        // We fulfill the strict interface but throw if invoked illegally by the platform.
        throw new Error('getCatalogTree() on S3Provider is unsupported in Production Mode. Taxonomies must be pulled via Postgres DB Registry.');
    }

    async getSearchIndex(): Promise<any> {
        throw new Error('getSearchIndex() on S3Provider is currently unsupported.');
    }
}
