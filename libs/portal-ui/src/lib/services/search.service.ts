import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
//@ts-ignore
import { Document } from 'flexsearch';
//@ts-ignore
import { Document } from 'flexsearch';

export interface SearchRecord {
    id: string;
    title: string;
    content: string;
    route: string;
}

export interface SearchResult {
    id: string;
    title: string;
    route: string;
    snippet?: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
    private http = inject(HttpClient);
    private index!: any; // FlexSearch Document Instance
    private recordMap = new Map<string, SearchRecord>();
    public isReady = new BehaviorSubject<boolean>(false);

    constructor() {
        this.initSearchIndex();
    }

    private initSearchIndex() {
        // 1. Setup FlexSearch Index
        this.index = new Document({
            document: {
                id: 'id',
                index: ['title', 'content'],
                store: true
            },
            tokenize: 'forward'
        });

        // 2. Fetch the pre-built JSON payload from Backend API
        const url = isDevMode()
            ? 'http://localhost:3000/api/catalog/search-index'
            : '/api/catalog/search-index';

        console.log(`[SearchService] Fetching static search index from ${url}`);
        this.http.get<SearchRecord[]>(url).subscribe({
            next: (records) => {
                if (!records || records.length === 0) {
                    console.warn('[SearchService] Search index payload was empty.');
                    return;
                }

                // 3. Mount Records In-Memory
                records.forEach(record => {
                    this.recordMap.set(record.id, record);
                    this.index.add(record);
                });

                console.log(`[SearchService] Index initialized with ${records.length} documents.`);
                this.isReady.next(true);
            },
            error: (err) => {
                console.error('[SearchService] Failed to load search index:', err);
            }
        });
    }

    /**
     * Executes a text search against the in-memory static index.
     */
    public search(query: string): SearchResult[] {
        if (!query || !this.isReady.value) return [];

        // Search against both Title and Content fields
        const results = this.index.search(query, { limit: 10, enrich: true });

        // FlexSearch groups results by the field matched. We consolidate them into a flat Set of raw IDs.
        const matchedIds = new Set<string>();
        for (const fieldMatch of results) {
            for (const res of fieldMatch.result) {
                matchedIds.add(res.id || typeof res === 'string' ? (res.id || res) : (res as any).doc?.id);
            }
        }

        // Resolve the internal Map entries back to standard UI models
        const finalResults: SearchResult[] = [];
        matchedIds.forEach(id => {
            const record = this.recordMap.get(id);
            if (record) {
                // Naive snippet generation
                const queryLower = query.toLowerCase();
                const contentLower = record.content.toLowerCase();
                const idx = contentLower.indexOf(queryLower);

                let snippet = '';
                if (idx !== -1) {
                    const start = Math.max(0, idx - 40);
                    const end = Math.min(record.content.length, idx + query.length + 40);
                    snippet = (start > 0 ? '...' : '') + record.content.substring(start, end) + '...';
                } else {
                    snippet = record.content.substring(0, 80) + '...';
                }

                finalResults.push({
                    id: record.id,
                    title: record.title,
                    route: record.route,
                    snippet
                });
            }
        });

        return finalResults;
    }
}
