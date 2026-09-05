import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { ContentAdminController } from './content.controller';
import { ContentAdminService } from './content.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({ imports: [AuthModule], controllers: [ContentAdminController, ImportController, OperationsController], providers: [ContentAdminService, ImportService, OperationsService] })
export class AdminModule {}
