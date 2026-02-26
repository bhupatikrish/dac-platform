import { Component, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SearchService, SearchResult } from '@tmp-dac/portal-ui';
import { TelemetryService } from '@tmp-dac/telemetry';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './search.component.html',
    styleUrl: './search.component.css'
})
export class SearchComponent {
    public searchService = inject(SearchService);
    private telemetry = inject(TelemetryService);
    private router = inject(Router);

    @ViewChild('modalInput') modalInput!: ElementRef<HTMLInputElement>;
    @ViewChild('searchDialog') searchDialog!: ElementRef<HTMLDialogElement>;

    public results: SearchResult[] = [];
    public groupedResults: { category: string, items: SearchResult[] }[] = [];
    public searchQuery = '';
    public selectedIndex = -1;

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            this.openModal();
        }
    }

    openModal() {
        if (!this.searchService.isReady.value) return;
        this.results = [];
        this.searchQuery = '';
        this.selectedIndex = -1;

        if (this.searchDialog) {
            this.searchDialog.nativeElement.showModal();
        }

        // Focus input after modal is in DOM
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
        this.searchQuery = '';
        this.results = [];
    }

    onDialogClick(event: MouseEvent) {
        // Close if click is outside the dialog content (on the ::backdrop)
        if (event.target === this.searchDialog.nativeElement) {
            this.closeModal();
        }
    }

    onSearch(event: Event) {
        this.searchQuery = (event.target as HTMLInputElement).value;
        const query = this.searchQuery.trim();
        this.selectedIndex = 0; // reset selection

        if (query.length >= 2) {
            this.results = this.searchService.search(query);
            this.groupResults();
            this.telemetry.trackSearch(query, this.results.length);
        } else {
            this.results = [];
            this.groupedResults = [];
        }
    }

    private groupResults() {
        // Group by the first segment of the route (which acts as our category)
        const groups = new Map<string, SearchResult[]>();
        this.results.forEach(result => {
            // Example route: /docs/infrastructure/compute/eks/architecture
            // Let's use the 3rd segment (e.g., 'infrastructure') or a title casing of it as the category
            const parts = result.route.split('/').filter(p => p.length > 0);
            const categoryRaw = parts.length > 1 ? parts[1] : 'General';
            // Simple Capitalize
            const category = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1);

            if (!groups.has(category)) {
                groups.set(category, []);
            }
            groups.get(category)!.push(result);
        });

        this.groupedResults = Array.from(groups.entries()).map(([cat, items]) => ({
            category: cat,
            items: items
        }));
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.closeModal();
            return;
        }

        if (this.results.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
            this.scrollToSelected();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
            this.scrollToSelected();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const selected = this.results[this.selectedIndex];
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
        this.searchQuery = '';
        this.results = [];
        this.groupedResults = [];
        inputTag.value = '';
        inputTag.focus();
    }
}
