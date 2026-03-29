import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env";

// Replace these placeholders before using a real DigitalOcean Space.
const SPACES_REGION = "nyc3";
const SPACES_BUCKET = "cmd-market-assets";
const SPACES_PUBLIC_BASE_URL = "https://cmd-market-assets.nyc3.cdn.digitaloceanspaces.com";
const UPLOAD_URL_TTL_SECONDS = 60 * 15;

let spacesClient: S3Client | null = null;

export async function createPresignedUploadRequest({
  assetKey,
  contentType
}: CreatePresignedUploadRequestInput): Promise<PresignedUploadRequest> {
  const expiresAt = new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000);
  const command = new PutObjectCommand({
    Bucket: SPACES_BUCKET,
    ContentType: contentType,
    Key: assetKey
  });
  const url = await getSignedUrl(getSpacesClient(), command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS
  });

  return {
    expiresAt,
    headers: {
      "content-type": contentType
    },
    method: "PUT",
    url
  };
}

export function buildDraftAssetKey({
  filename,
  listingId,
  uploadId
}: BuildDraftAssetKeyInput) {
  return `listings/drafts/${listingId}/${uploadId}-${sanitizeFilename(filename)}`;
}

export function getPublicAssetUrl(assetKey: string) {
  return new URL(assetKey, `${SPACES_PUBLIC_BASE_URL}/`).toString();
}

function getSpacesClient() {
  if (spacesClient) {
    return spacesClient;
  }

  spacesClient = new S3Client({
    credentials: {
      accessKeyId: env.doSpacesAccessKeyId,
      secretAccessKey: env.doSpacesSecretAccessKey
    },
    endpoint: `https://${SPACES_REGION}.digitaloceanspaces.com`,
    region: SPACES_REGION
  });

  return spacesClient;
}

function sanitizeFilename(filename: string) {
  return filename
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "upload";
}

type BuildDraftAssetKeyInput = {
  filename: string;
  listingId: string;
  uploadId: string;
};

type CreatePresignedUploadRequestInput = {
  assetKey: string;
  contentType: string;
};

type PresignedUploadRequest = {
  expiresAt: Date;
  headers: Record<string, string>;
  method: "PUT";
  url: string;
};
