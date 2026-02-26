import { Controller, Get, Param, NotFoundException, Req } from '@nestjs/common';
import { StorageProvider, DocumentNode } from '@tmp-dac/backend';

@Controller('catalog')
export class CatalogController {

    // StorageProvider is dynamically injected (will be Local Disk or AWS S3 based on Environment)
    constructor(private readonly storageService: StorageProvider) { }

    @Get('tree')
    async getFullCatalogTree(): Promise<DocumentNode[]> {
        try {
            return await this.storageService.getCatalogTree();
        } catch (e: any) {
            throw new NotFoundException(`Failed to construct catalog tree: ${e.message}`);
        }
    }

    @Get('search-index')
    async getSearchIndex(): Promise<any> {
        return await this.storageService.getSearchIndex();
    }

    @Get('document/*')
    async getDocument(@Req() req: any): Promise<string | any> {
        const basePath = '/api/catalog/document/';
        const url = req.originalUrl || req.url;
        const pathParams = url.includes(basePath) ? url.substring(url.indexOf(basePath) + basePath.length) : '';
        if (!pathParams) {
            throw new NotFoundException('Document path must be provided');
        }

        try {
            // Return raw markdown content string to the Angular client
            return await this.storageService.getDocumentContent(pathParams);
        } catch (e: any) {
            throw new NotFoundException(`Document not found: ${pathParams}`);
        }
    }
}
