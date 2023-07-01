import { DomainModule } from '@app/domain/index.js';
import { ExifEntity } from '@app/infra/entities/index.js';
import { InfraModule } from '@app/infra/index.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service.js';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor.js';

@Module({
  imports: [
    //
    DomainModule.register({ imports: [InfraModule] }),
    TypeOrmModule.forFeature([ExifEntity]),
  ],
  providers: [MetadataExtractionProcessor, AppService],
})
export class MicroservicesModule {}
