import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, Router } from '@angular/router';
import { fromEvent, filter } from 'rxjs';
import { SearchService, SearchResult } from '@tmp-dac/portal-ui';
import { TelemetryService } from '@tmp-dac/telemetry';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './search.component.html',
    styleUrl: './search.component.css'
})
export class SearchComponent {
    private searchService = inject(SearchService);
    private telemetry = inject(TelemetryService);
    private router = inject(Router);

    @ViewChild('modalInput') modalInput!: ElementRef<HTMLInputElement>;
    @ViewChild('searchDialog') searchDialog!: ElementRef<HTMLDialogElement>;

    // --- Reactive State (Signals) ---
    readonly searchQuery = signal('');
    readonly results = signal<SearchResult[]>([]);
    readonly selectedIndex = signal(-1);

    /** Convert the service's BehaviorSubject to a signal for template use */
    readonly isReady = toSignal(this.searchService.isReady, { initialValue: false });

    /** Derived state: group results by domain category */
    readonly groupedResults = computed(() => {
        const results = this.results();
        if (results.length === 0) return [];

        const groups = new Map<string, SearchResult[]>();
        for (const result of results) {
            const parts = result.route.split('/').filter(p => p.length > 0);
            const categoryRaw = parts.length > 1 ? parts[1] : 'General';
            const category = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1);

            if (!groups.has(category)) {
                groups.set(category, []);
            }
            groups.get(category)!.push(result);
        }

        return Array.from(groups.entries()).map(([category, items]) => ({
            category,
            items
        }));
    });

    constructor() {
        // ⌘K / Ctrl+K shortcut — replaces @HostListener
        fromEvent<KeyboardEvent>(document, 'keydown').pipe(
            filter(e => (e.metaKey || e.ctrlKey) && e.key === 'k'),
            takeUntilDestroyed()
        ).subscribe(e => {
            e.preventDefault();
            this.openModal();
        });
    }

    openModal() {
        if (!this.isReady()) return;
        this.results.set([]);
        this.searchQuery.set('');
        this.selectedIndex.set(-1);

        if (this.searchDialog) {
            this.searchDialog.nativeElement.showModal();
        }

        setTimeout(() => {
            if (this.modalInput) {
                this.modalInput.nativeElement.focus();
            }
        }, 50);
    }

    closeModal() {
        if (this.searchDialog) {
            this.searchDialog.nativeElement.close();
        }
        this.searchQuery.set('');
        this.results.set([]);
    }

    onDialogClick(event: MouseEvent) {
        if (event.target === this.searchDialog.nativeElement) {
            this.closeModal();
        }
    }

    onSearch(event: Event) {
        const query = (event.target as HTMLInputElement).value;
        this.searchQuery.set(query);
        this.selectedIndex.set(0);

        if (query.trim().length >= 2) {
            this.results.set(this.searchService.search(query.trim()));
            this.telemetry.trackSearch(query.trim(), this.results().length);
        } else {
            this.results.set([]);
        }
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.closeModal();
            return;
        }

        const count = this.results().length;
        if (count === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.selectedIndex.update(i => (i + 1) % count);
            this.scrollToSelected();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.selectedIndex.update(i => (i - 1 + count) % count);
            this.scrollToSelected();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const selected = this.results()[this.selectedIndex()];
            if (selected) {
                this.router.navigateByUrl(selected.route);
                this.closeModal();
            }
        }
    }

    scrollToSelected() {
        setTimeout(() => {
            const selectedElement = document.querySelector('.result-item.selected');
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, 0);
    }

    navigateTo(route: string, event?: Event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.router.navigateByUrl(route);
        this.closeModal();
    }

    clearSearch(inputTag: HTMLInputElement) {
        this.searchQuery.set('');
        this.results.set([]);
        inputTag.value = '';
        inputTag.focus();
    }
}
