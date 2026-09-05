import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { ContentAdminController } from './content.controller';
import { ContentAdminService } from './content.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({ imports: [AuthModule], controllers: [ContentAdminController, ImportController], providers: [ContentAdminService, ImportService] })
export class AdminModule {}
