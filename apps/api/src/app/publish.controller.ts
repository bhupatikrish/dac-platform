import { Controller, Post, Body, BadRequestException, Logger } from '@nestjs/common';
// We re-use our schema validation libraries created in Phase 1
import { validateFrontmatter, DocsFrontmatter } from '@tmp-dac/shared-types';

export interface PublishRequestDto {
    domain: string;
    system: string;
    product: string;
    markdownContent: string;
    frontmatterBase64: string;
}

@Controller('publish')
export class PublishController {
    private readonly logger = new Logger(PublishController.name);

    @Post()
    async publishDocument(@Body() payload: PublishRequestDto) {
        if (!payload.domain || !payload.system || !payload.product || !payload.frontmatterBase64) {
            throw new BadRequestException('Missing required publishing payload fields.');
        }

        let parsedFrontmatter: DocsFrontmatter;
        try {
            const decodedYaml = Buffer.from(payload.frontmatterBase64, 'base64').toString('utf-8');
            const yaml = require('js-yaml');
            const rawJson = yaml.load(decodedYaml);
            parsedFrontmatter = validateFrontmatter(rawJson);
        } catch (e: any) {
            throw new BadRequestException(`Invalid frontmatter supplied: ${e.message}`);
        }

        this.logger.log(`Publishing v${parsedFrontmatter.version} of ${parsedFrontmatter.product} to S3...`);

        // In a real application, this is where we would:
        // 1. Write the explicit markdownContent buffer to the AWS S3 Destination bucket
        // 2. Transact the parsedFrontmatter metadata against the Postgres DB Registry for Discovery

        return {
            status: 'success',
            s3Path: `s3://dac-enterprise-docs/${payload.domain}/${payload.system}/${payload.product}/${parsedFrontmatter.version}/`,
            metadata: parsedFrontmatter
        };
    }
}
