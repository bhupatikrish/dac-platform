export interface MarkdownMetadata {
    title: string;
    description: string;
    owner: string;
    version: string;
    domain: string;
    system: string;
    product: string;
}

export interface DocumentNode {
    path: string;
    name: string;
    type: 'file' | 'directory';
    children?: DocumentNode[];
    metadata?: MarkdownMetadata;
}
