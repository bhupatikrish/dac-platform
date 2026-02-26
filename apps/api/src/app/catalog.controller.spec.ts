import { Test, TestingModule } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { StorageProvider, DocumentNode } from '@tmp-dac/backend';
import { NotFoundException } from '@nestjs/common';

describe('CatalogController', () => {
    let app: CatalogController;
    let mockStorageService: jest.Mocked<StorageProvider>;

    const mockTree: DocumentNode[] = [
        {
            path: 'infrastructure/compute/eks',
            name: 'eks',
            type: 'directory',
            metadata: { title: 'Test EKS', description: '', owner: '', version: '', domain: '', system: '', product: '' }
        }
    ];

    beforeAll(async () => {
        mockStorageService = {
            getCatalogTree: jest.fn().mockResolvedValue(mockTree),
            getDocumentContent: jest.fn().mockResolvedValue('# Hello World'),
        } as any;

        const appModule: TestingModule = await Test.createTestingModule({
            controllers: [CatalogController],
            providers: [
                {
                    provide: StorageProvider,
                    useValue: mockStorageService,
                },
            ],
        }).compile();

        app = appModule.get<CatalogController>(CatalogController);
    });

    describe('getFullCatalogTree', () => {
        it('should return successfully when storage service succeeds', async () => {
            const tree = await app.getFullCatalogTree();
            expect(tree).toEqual(mockTree);
            expect(mockStorageService.getCatalogTree).toHaveBeenCalled();
        });

        it('should map exceptions to 404 Not Found', async () => {
            mockStorageService.getCatalogTree.mockRejectedValueOnce(new Error('DB missing'));
            await expect(app.getFullCatalogTree()).rejects.toThrow(NotFoundException);
        });
    });

    describe('getDocument', () => {
        it('should return raw markdown for valid paths', async () => {
            const result = await app.getDocument('infrastructure/file.md');
            expect(result).toBe('# Hello World');
            expect(mockStorageService.getDocumentContent).toHaveBeenCalledWith('infrastructure/file.md');
        });

        it('should map exception to 404 Not Found', async () => {
            mockStorageService.getDocumentContent.mockRejectedValueOnce(new Error('File Missing'));
            await expect(app.getDocument('bad.md')).rejects.toThrow(NotFoundException);
        });
    });
});
