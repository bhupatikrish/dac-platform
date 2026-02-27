import { Component, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { EnvironmentService, SafeHtmlDirective } from '@tmp-dac/portal-ui';
import { DocumentNode } from '@tmp-dac/shared-types';
import mermaid from 'mermaid';
import { SearchComponent } from '@tmp-dac/search-ui';
import { TelemetryService } from '@tmp-dac/telemetry';

@Component({
  selector: 'app-document',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgTemplateOutlet, RouterModule, SearchComponent, SafeHtmlDirective],
  templateUrl: './document.html',
  styleUrl: './document.css',
})
export class Document {
  private router = inject(Router);
  private envService = inject(EnvironmentService);
  private telemetry = inject(TelemetryService);
  private titleService = inject(Title);

  // --- Reactive State (Signals) ---
  readonly htmlContent = signal('');
  readonly toc = signal<any[]>([]);
  readonly catalogTree = signal<DocumentNode[]>([]);
  readonly localNavTree = signal<DocumentNode[]>([]);

  readonly domainName = signal('');
  readonly systemName = signal('');
  readonly productName = signal('');
  readonly pageName = signal('');

  readonly loading = signal(true);
  readonly error = signal('');
  readonly feedbackSubmitted = signal(false);

  // --- Derived State (Computed) ---
  readonly domainTitle = computed(() => {
    const tree = this.catalogTree();
    const domain = tree.find(d => d.name === this.domainName());
    return domain?.title || this.domainName();
  });

  readonly systemTitle = computed(() => {
    const domain = this.catalogTree().find(d => d.name === this.domainName());
    const system = domain?.children?.find(s => s.name === this.systemName());
    return system?.title || this.systemName();
  });

  readonly productTitle = computed(() => {
    const domain = this.catalogTree().find(d => d.name === this.domainName());
    const system = domain?.children?.find(s => s.name === this.systemName());
    const product = system?.children?.find(p => p.name === this.productName());
    return product?.title || this.productName();
  });

  constructor() {
    // Load catalog tree once
    this.envService.getCatalogTree().pipe(
      takeUntilDestroyed()
    ).subscribe(tree => {
      this.catalogTree.set(tree);
      if (this.domainName()) this.updateLocalNav();
    });

    // Parse URL atomically on every NavigationEnd event
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(event => {
      this.loadFromUrl(event.urlAfterRedirects || event.url);
    });

    // Also load for the initial navigation
    this.loadFromUrl(this.router.url);
  }

  private loadFromUrl(url: string) {
    const segments = url.split('/').filter(s => s.length > 0);
    if (segments.length < 4 || segments[0] !== 'docs') return;

    this.domainName.set(segments[1]);
    this.systemName.set(segments[2]);
    this.productName.set(segments[3]);

    this.updateLocalNav();

    const pageParts = segments.slice(4);
    if (pageParts.length > 0) {
      this.pageName.set(pageParts.join('/'));
    } else {
      // Default to the first page defined in docs.yaml nav
      const nav = this.localNavTree();
      const firstLeaf = this.findFirstLeafNode(nav);
      this.pageName.set(firstLeaf || 'index');
    }

    const docPath = `${this.domainName()}/${this.systemName()}/${this.productName()}/${this.pageName()}.md`;

    this.loading.set(true);
    this.error.set('');
    this.feedbackSubmitted.set(false);

    this.envService.getDocumentContent(docPath).subscribe({
      next: (responseStr) => {
        const parsed = JSON.parse(responseStr);
        this.htmlContent.set(parsed.html);
        this.toc.set(parsed.toc);

        const pageTitle = this.toc().length > 0 ? this.toc()[0].text : this.pageName();
        this.titleService.setTitle(`${pageTitle} | ${this.productName()}`);

        this.loading.set(false);

        mermaid.initialize({ startOnLoad: false });
        setTimeout(() => {
          try {
            const elements = document.querySelectorAll('.mermaid');
            if (elements.length > 0) {
              mermaid.run({ querySelector: '.mermaid' }).catch(() => { });
            }
          } catch { /* mermaid render is best-effort */ }
        }, 50);
      },
      error: () => {
        this.error.set('Failed to load markdown content or file does not exist.');
        this.loading.set(false);
      }
    });
  }

  private updateLocalNav() {
    if (!this.catalogTree().length || !this.domainName() || !this.systemName() || !this.productName()) return;

    const domainNode = this.catalogTree().find(d => d.name === this.domainName());
    const systemNode = domainNode?.children?.find(s => s.name === this.systemName());
    const productNode = systemNode?.children?.find(p => p.name === this.productName());

    this.localNavTree.set(productNode?.children || []);
  }

  private findFirstLeafNode(nodes: DocumentNode[] | undefined): string | null {
    if (!nodes || nodes.length === 0) return null;

    for (const node of nodes) {
      if (node.type === 'file') {
        return (node.path || node.name).replace(/\.md$/, '');
      } else if (node.type === 'directory' && node.children) {
        const childLeaf = this.findFirstLeafNode(node.children);
        if (childLeaf) return childLeaf;
      }
    }
    return null;
  }


  toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }

  scrollTo(id: string, event: Event) {
    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }

  submitFeedback(isHelpful: boolean) {
    if (this.feedbackSubmitted()) return;
    const currentUrl = `/${this.domainName()}/${this.systemName()}/${this.productName()}/${this.pageName()}`;
    this.telemetry.trackFeedback(currentUrl, isHelpful);
    this.feedbackSubmitted.set(true);
  }
}
