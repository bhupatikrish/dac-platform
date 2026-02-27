import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EnvironmentService } from '@tmp-dac/portal-ui';
import { DocumentNode } from '@tmp-dac/shared-types';
import { SearchComponent } from './search/search.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private envService = inject(EnvironmentService);
  private cdr = inject(ChangeDetectorRef);

  public catalogTree: DocumentNode[] = [];
  public selectedDomain: DocumentNode | null = null;
  public loading = true;
  public error = '';

  ngOnInit() {
    console.log('[LandingComponent] Component Instantiated.');
    this.envService.getCatalogTree().subscribe({
      next: (tree) => {
        console.log('[LandingComponent] ✅ XHR Success. Tree received:', tree);
        try {
          this.catalogTree = tree || [];
          if (this.catalogTree.length > 0) {
            this.selectedDomain = this.catalogTree[0]; // expand first domain by default
          }
          this.loading = false;
          this.cdr.detectChanges(); // Trigger DOM explicitly
          console.log('[LandingComponent] ✅ Variables assigned and CDR triggered.');
        } catch (e) {
          console.error('[LandingComponent] ❌ JavaScript execution error inside next block:', e);
        }
      },
      error: (err) => {
        console.error('Failed to load catalog tree natively:', err);
        this.error = `Unable to load enterprise catalog. Backend may be offline. Details: ${err.message || 'Unknown Error'}`;
        this.loading = false;
      }
    });
  }

  selectDomain(domainNode: DocumentNode) {
    this.selectedDomain = domainNode;
  }

  scrollToSystem(systemId: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const element = document.getElementById(systemId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }
}
