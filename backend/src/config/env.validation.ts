import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: Joi.number().integer().min(1).max(365).default(30),
  APP_ORIGIN: Joi.string().uri().required(),
  STORAGE_PROVIDER: Joi.string().valid('s3', 'r2', 'local').default('local'),
  STORAGE_BUCKET: Joi.string().min(1).default('toeic-web'),
  STORAGE_LOCAL_ROOT: Joi.string().default('./storage'),
  STORAGE_S3_ENDPOINT: Joi.string().uri().allow('').optional(),
  STORAGE_S3_REGION: Joi.string().default('auto'),
  STORAGE_S3_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  STORAGE_R2_ACCOUNT_ID: Joi.string().allow('').optional(),
  STORAGE_R2_ENDPOINT: Joi.string().uri().allow('').optional(),
  STORAGE_R2_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  STORAGE_R2_SECRET_ACCESS_KEY: Joi.string().allow('').optional()
}).custom((value, helpers) => {
  if (value.STORAGE_PROVIDER === 'local') return value;
  const isR2 = value.STORAGE_PROVIDER === 'r2';
  const required = isR2
    ? ['STORAGE_R2_ENDPOINT', 'STORAGE_R2_ACCESS_KEY_ID', 'STORAGE_R2_SECRET_ACCESS_KEY']
    : ['STORAGE_S3_ACCESS_KEY_ID', 'STORAGE_S3_SECRET_ACCESS_KEY'];
  const missing = required.filter((key) => !value[key]);
  return missing.length ? helpers.error('any.custom', { message: `Missing storage configuration: ${missing.join(', ')}` }) : value;
});
