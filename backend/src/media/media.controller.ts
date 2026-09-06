import { Body, Controller, Delete, Get, Param, Post, Req, Res, StreamableFile, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '@/access/roles.guard';
import { CreateUploadSessionDto } from './media.dto';
import { MediaService } from './media.service';

const tempUploadDirectory = join(process.cwd(), '.tmp', 'uploads');
mkdirSync(tempUploadDirectory, { recursive: true });

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':id/file')
  async file(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const asset = await this.mediaService.openPublicAsset(id);
    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${asset.originalName.replaceAll('"', '')}"`);
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (asset.size !== undefined) response.setHeader('Content-Length', String(asset.size));
    return new StreamableFile(asset.stream);
  }

  @Post('upload-sessions')
  @UseGuards(JwtAuthGuard)
  createSession(@Req() request: AuthenticatedRequest, @Body() dto: CreateUploadSessionDto) {
    return this.mediaService.createUploadSession(request.user!.id, dto);
  }

  @Post('upload-sessions/:id/complete')
  @UseGuards(JwtAuthGuard)
  complete(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.mediaService.complete(request.user!.id, id); }

  @Post('upload-sessions/:id/file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: diskStorage({ destination: tempUploadDirectory, filename: (_req, file, callback) => callback(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`) }), limits: { fileSize: 524288000 } }))
  uploadLocal(@Req() request: AuthenticatedRequest, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.mediaService.uploadServerFile(request.user!.id, id, file.path, file.mimetype, file.size);
  }

  @Delete('upload-sessions/:id')
  @UseGuards(JwtAuthGuard)
  abort(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.mediaService.abort(request.user!.id, id); }
}
