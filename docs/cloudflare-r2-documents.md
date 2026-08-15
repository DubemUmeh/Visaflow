# Cloudflare R2 document storage

VisaFlow stores visa application document files in a private Cloudflare R2 bucket. PostgreSQL only stores metadata in `uploaded_documents`.

Required API environment variables:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

Create a private R2 bucket and a bucket-scoped API token that can read, write, head, and delete objects for that bucket. Do not expose these values to the Next.js app.

Because browsers upload directly to presigned R2 URLs, configure R2 CORS for the deployed frontend origins and local development. Example policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://app.visaflow.example"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace the production origin with the actual VisaFlow frontend origin. Do not use `*` in production.
