import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TelemetryService {
    /**
     * Fires whenever a user completes navigation to a new Portal route.
     */
    public trackPageView(path: string): void {
        console.log(`[Telemetry] PageView: ${path}`);
    }

    /**
     * Fires whenever the user executes a search query via the global Header.
     */
    public trackSearch(query: string, resultsCount: number): void {
        console.log(`[Telemetry] Search: "${query}" returned ${resultsCount} results.`);
    }

    /**
     * Fires whenever a user clicks the helpfulness rating footprint in a Document.
     */
    public trackFeedback(path: string, isHelpful: boolean): void {
        console.log(`[Telemetry] Feedback on ${path}: Helpful=${isHelpful}`);
    }
}
