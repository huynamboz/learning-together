export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3010),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 30)
  },
  appOrigin: process.env.APP_ORIGIN ?? 'http://localhost:3011',
  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 'local',
    bucket: process.env.STORAGE_BUCKET ?? 'toeic-web',
    localRoot: process.env.STORAGE_LOCAL_ROOT ?? './storage',
    endpoint: process.env.STORAGE_S3_ENDPOINT,
    region: process.env.STORAGE_S3_REGION ?? 'auto',
    accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
    r2AccountId: process.env.STORAGE_R2_ACCOUNT_ID,
    r2Endpoint: process.env.STORAGE_R2_ENDPOINT,
    r2AccessKeyId: process.env.STORAGE_R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.STORAGE_R2_SECRET_ACCESS_KEY
  }
});
