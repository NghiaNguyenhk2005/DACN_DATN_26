import { Module } from "@nestjs/common";
import { CoreModule } from "../../core/core.module";
import { storageProvider } from "../../core/storage";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { MediaRepository } from "./media.repository";
import { InMemoryMediaRepository } from "./in-memory-media.repository";
import { PrismaMediaRepository } from "./prisma-media.repository";

@Module({
  imports: [CoreModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    storageProvider(MediaRepository, InMemoryMediaRepository, PrismaMediaRepository),
  ],
  exports: [MediaService, MediaRepository],
})
export class MediaModule {}
