import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EnvironmentService } from '@tmp-dac/portal-ui';
import { DocumentNode } from '@tmp-dac/shared-types';
import { SearchComponent } from '@tmp-dac/search-ui';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, SearchComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private envService = inject(EnvironmentService);

  readonly catalogTree = signal<DocumentNode[]>([]);
  readonly selectedDomain = signal<DocumentNode | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.envService.getCatalogTree().subscribe({
      next: (tree) => {
        this.catalogTree.set(tree || []);
        if (this.catalogTree().length > 0) {
          this.selectedDomain.set(this.catalogTree()[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(`Unable to load enterprise catalog. Backend may be offline. Details: ${err.message || 'Unknown Error'}`);
        this.loading.set(false);
      }
    });
  }

  selectDomain(domainNode: DocumentNode) {
    this.selectedDomain.set(domainNode);
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
