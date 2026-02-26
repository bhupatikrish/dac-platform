import { Injectable, isDevMode, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentNode } from '@tmp-dac/shared-types'; // Pure interface

@Injectable({
    providedIn: 'root'
})
export class EnvironmentService {
    private http = inject(HttpClient);

    /**
     * Retrieves the full Markdown documentation taxonomy tree.
     * In Local Mode (ng serve): Reaches out to the static sample-docs/ tree.
     * In Prod Mode (ng build): Polls the NestJS Backend API.
     */
    getCatalogTree(): Observable<DocumentNode[]> {
        console.log(`[EnvironmentService] Fetching Catalog Tree... DevMode=${isDevMode()}`);
        if (isDevMode()) {
            console.log(`[EnvironmentService] Requesting Localhost API: http://localhost:3000/api/catalog/tree`);
            return this.http.get<DocumentNode[]>('http://localhost:3000/api/catalog/tree');
        } else {
            // Production Mode
            return this.http.get<DocumentNode[]>('/api/catalog/tree');
        }
    }

    /**
     * Retrieves raw markdown content.
     */
    getDocumentContent(path: string): Observable<string> {
        if (isDevMode()) {
            return this.http.get(`http://localhost:3000/api/catalog/document/${path}`, { responseType: 'text' });
        } else {
            return this.http.get(`/api/catalog/document/${path}`, { responseType: 'text' });
        }
    }
}
