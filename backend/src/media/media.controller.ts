import { Body, Controller, Delete, Param, Post, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '@/access/roles.guard';
import { CreateUploadSessionDto } from './media.dto';
import { MediaService } from './media.service';

const tempUploadDirectory = join(process.cwd(), '.tmp', 'uploads');
mkdirSync(tempUploadDirectory, { recursive: true });

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-sessions')
  createSession(@Req() request: AuthenticatedRequest, @Body() dto: CreateUploadSessionDto) {
    return this.mediaService.createUploadSession(request.user!.id, dto);
  }

  @Post('upload-sessions/:id/complete')
  complete(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.mediaService.complete(request.user!.id, id); }

  @Post('upload-sessions/:id/file')
  @UseInterceptors(FileInterceptor('file', { storage: diskStorage({ destination: tempUploadDirectory, filename: (_req, file, callback) => callback(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`) }), limits: { fileSize: 524288000 } }))
  uploadLocal(@Req() request: AuthenticatedRequest, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.mediaService.uploadServerFile(request.user!.id, id, file.path, file.mimetype, file.size);
  }

  @Delete('upload-sessions/:id')
  abort(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.mediaService.abort(request.user!.id, id); }
}
