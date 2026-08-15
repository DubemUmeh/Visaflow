import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface R2ObjectMetadata {
  contentLength: number;
  contentType: string | null;
  etag: string | null;
  lastModified: Date | null;
}

@Injectable()
export class R2StorageService {
  private client?: S3Client;

  constructor(private readonly configService: ConfigService) {}

  get bucketName() {
    const bucket = this.configService.get<string>('app.r2.bucketName') ?? '';
    if (!bucket)
      throw new InternalServerErrorException(
        'R2 document storage is not configured',
      );
    return bucket;
  }

  private getClient() {
    if (this.client) return this.client;
    const accountId = this.configService.get<string>('app.r2.accountId') ?? '';
    const accessKeyId =
      this.configService.get<string>('app.r2.accessKeyId') ?? '';
    const secretAccessKey =
      this.configService.get<string>('app.r2.secretAccessKey') ?? '';
    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName) {
      throw new InternalServerErrorException(
        'R2 document storage is not configured',
      );
    }
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    return this.client;
  }

  async generateUploadUrl(params: {
    key: string;
    contentType: string;
    expiresIn: number;
  }) {
    return getSignedUrl(
      this.getClient(),
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: params.key,
        ContentType: params.contentType,
      }),
      { expiresIn: params.expiresIn },
    );
  }

  async generateDownloadUrl(params: {
    key: string;
    fileName?: string;
    expiresIn: number;
  }) {
    return getSignedUrl(
      this.getClient(),
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: params.key,
        ResponseContentDisposition: params.fileName
          ? `inline; filename="${params.fileName.replace(/"/g, '')}"`
          : undefined,
      }),
      { expiresIn: params.expiresIn },
    );
  }

  async headObject(key: string): Promise<R2ObjectMetadata> {
    try {
      const result = await this.getClient().send(
        new HeadObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType ?? null,
        etag: result.ETag?.replaceAll('"', '') ?? null,
        lastModified: result.LastModified ?? null,
      };
    } catch {
      throw new NotFoundException(
        'Uploaded object was not found in document storage',
      );
    }
  }

  async deleteObject(key: string) {
    await this.getClient().send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
    );
  }
}
