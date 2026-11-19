import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IfoodAuthController } from './ifood-auth.controller';
import { IfoodAuthService } from './ifood-auth.service';
import { IfoodCatalogService } from './ifood-catalog.service';
import { IfoodConfigService } from './ifood-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [IfoodAuthController],
  providers: [
    IfoodAuthService,
    IfoodCatalogService,
    IfoodConfigService,
  ],
  exports: [
    IfoodAuthService,
    IfoodCatalogService,
    IfoodConfigService,
  ],
})
export class IfoodModule {}