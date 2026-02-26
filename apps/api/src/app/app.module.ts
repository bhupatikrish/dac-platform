import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogController } from './catalog.controller';
import { PublishController } from './publish.controller';
import { BackendModule } from '@tmp-dac/backend';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot(
      {
        rootPath: process.env['SERVE_PREBUILT_HTML'] === 'true'
          ? join(process.cwd(), 'dist', 'sample-docs')
          : join(process.cwd(), 'sample-docs'),
        serveRoot: '/api/assets',
        serveStaticOptions: { index: false }
      },
      {
        rootPath: process.env['SERVE_PREBUILT_HTML'] === 'true'
          ? join(process.cwd(), 'dist', 'docs')
          : join(process.cwd(), 'docs'),
        serveRoot: '/api/assets',
        serveStaticOptions: { index: false }
      }
    ),
    BackendModule
  ],
  controllers: [AppController, CatalogController, PublishController],
  providers: [AppService],
})
export class AppModule { }
