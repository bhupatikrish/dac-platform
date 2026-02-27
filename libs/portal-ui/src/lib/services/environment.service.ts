import { Injectable, isDevMode, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentNode } from '@tmp-dac/shared-types';

@Injectable({
    providedIn: 'root'
})
export class EnvironmentService {
    private http = inject(HttpClient);

    /**
     * Retrieves the full Markdown documentation taxonomy tree.
     * Uses the localhost API in dev mode, and relative paths in production.
     */
    getCatalogTree(): Observable<DocumentNode[]> {
        if (isDevMode()) {
            return this.http.get<DocumentNode[]>('http://localhost:3000/api/catalog/tree');
        }
        return this.http.get<DocumentNode[]>('/api/catalog/tree');
    }

    /**
     * Retrieves pre-rendered document content by path.
     */
    getDocumentContent(path: string): Observable<string> {
        if (isDevMode()) {
            return this.http.get(`http://localhost:3000/api/catalog/document/${path}`, { responseType: 'text' });
        }
        return this.http.get(`/api/catalog/document/${path}`, { responseType: 'text' });
    }
}
