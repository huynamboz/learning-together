# Storage abstraction và upload đa provider

## 1. Mục tiêu

Một API upload duy nhất, chạy được với:

1. AWS S3;
2. Cloudflare R2 qua S3-compatible API;
3. local filesystem trên server.

Business code chỉ phụ thuộc interface, không import SDK AWS/R2 trực tiếp ngoài adapter. Provider được chọn bằng config server-side, có thể đổi theo môi trường hoặc theo loại asset.

## 2. Interface

```ts
export type StorageProviderName = 's3' | 'r2' | 'local';

export interface ObjectStorage {
  readonly name: StorageProviderName;
  createUpload(input: CreateUploadInput): Promise<UploadInstructions>;
  completeUpload(input: CompleteUploadInput): Promise<StoredObject>;
  abortUpload(input: AbortUploadInput): Promise<void>;
  headObject(ref: ObjectRef): Promise<ObjectMetadata | null>;
  getReadUrl(ref: ObjectRef, options?: ReadUrlOptions): Promise<string>;
  deleteObject(ref: ObjectRef): Promise<void>;
  copyObject(input: CopyObjectInput): Promise<StoredObject>;
}
```

`ObjectStorageFactory` resolve provider từ `StorageRouter`; `MediaService` chịu authorization/quota/metadata, adapter chỉ chịu object operations.

## 3. Provider behavior

| Provider | Upload | Read | Use case |
| --- | --- | --- | --- |
| AWS S3 | presigned PUT/multipart | signed URL/CDN | production AWS |
| Cloudflare R2 | presigned PUT/multipart S3 API | signed URL/custom domain | production hiện tại |
| local | streaming multipart vào `STORAGE_LOCAL_ROOT` | protected download/NGINX internal | dev, self-hosted, fallback |

R2 endpoint, account id, access key và secret chỉ đọc từ secret env; không hardcode bucket credentials. Bucket hiện tại dùng config name `toeic-web`, không ghi credential vào repo.

## 4. Object key convention

```text
{environment}/{tenant}/media/{kind}/{yyyy}/{mm}/{uuid}-{safe-slug}.{ext}
```

Original filename lưu DB để hiển thị; object key không lấy nguyên input của user. `kind`: `image`, `audio`, `video`, `document`, `avatar`, `feedback`, `community`.

## 5. Upload flow cloud

1. Client gửi filename, MIME, size, checksum, purpose.
2. API auth + entitlement + quota + allowlist.
3. API tạo `UploadSession` pending và presigned instruction TTL ngắn.
4. Client upload trực tiếp provider, hiển thị progress/retry/cancel.
5. Client gọi complete kèm ETag/parts/checksum.
6. API head object, verify size/checksum/content type, chuyển asset `READY`.
7. Job xử lý thumbnail/duration/waveform/virus scan nếu cần.

Không expose access key cho browser. Không coi client MIME là bằng chứng cuối; backend phải verify metadata/magic bytes với worker.

## 6. Upload flow local

1. Client POST multipart vào API.
2. API stream thẳng xuống file tạm trong cùng filesystem/volume; giới hạn bytes.
3. Tính checksum trong stream, atomic rename sang object key sau khi complete.
4. Tạo `MediaAsset`, chạy processing job.

Không dùng `memoryStorage` cho file lớn. File tạm tự dọn bằng TTL job. Local path không được đưa trực tiếp cho client; download qua authorization endpoint hoặc internal redirect.

## 7. Admin upload tối ưu

- kéo thả nhiều file và folder;
- tự map filename → question/lesson bằng convention hoặc CSV;
- hiển thị queue từng file: waiting/uploading/processing/ready/failed;
- retry một file hoặc retry failed;
- deduplicate theo checksum;
- xem preview image/audio/video và metadata tự trích xuất;
- bulk edit topic/level/part/status;
- import CSV/JSON/ZIP có dry-run trước khi ghi;
- lỗi theo dòng/cột, downloadable error report;
- draft batch, review diff, publish toàn batch hoặc từng item;
- rollback batch về version trước nếu chưa có learner attempt mới;
- keyboard shortcuts và autosave editor.

## 8. Security/quota

- allowlist MIME + extension + magic bytes;
- per-user/per-role size and count quota;
- admin-only content bucket/prefix;
- signed URL TTL ngắn, private by default;
- antivirus/quarantine cho file user-uploaded;
- EXIF strip ảnh public, sanitize SVG hoặc cấm SVG;
- rate limit upload session/complete;
- audit create/complete/delete/publish;
- orphan scanner tìm object không có DB reference và asset không có object.

## 9. Test matrix storage

Contract test chạy cùng bộ case cho cả `S3StorageAdapter`, `R2StorageAdapter`, `LocalStorageAdapter` bằng fake server/test bucket. Test lỗi timeout, 403, checksum mismatch, duplicate complete, abort, expired URL, object missing, traversal path, quota exceeded và retry.
