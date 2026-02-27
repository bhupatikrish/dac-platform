import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { Subscription, filter } from 'rxjs';
import { EnvironmentService } from '@tmp-dac/portal-ui';
import { DocumentNode } from '@tmp-dac/shared-types';
import mermaid from 'mermaid';
import { SearchComponent } from './search/search.component';
import { TelemetryService } from '@tmp-dac/telemetry';

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchComponent],
  templateUrl: './document.html',
  styleUrl: './document.css',
})
export class Document implements OnInit, OnDestroy {
  private router = inject(Router);
  private envService = inject(EnvironmentService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private telemetry = inject(TelemetryService);
  private titleService = inject(Title);
  private subscriptions = new Subscription();

  public htmlContent: SafeHtml = '';
  public toc: any[] = [];
  public catalogTree: DocumentNode[] = [];
  public localNavTree: DocumentNode[] = [];

  public domainName = '';
  public systemName = '';
  public productName = '';
  public pageName = '';

  public domainTitle = '';
  public systemTitle = '';
  public productTitle = '';

  public loading = true;
  public error = '';
  public feedbackSubmitted = false;

  ngOnInit() {
    // Load catalog tree once
    this.subscriptions.add(
      this.envService.getCatalogTree().subscribe(tree => {
        this.catalogTree = tree;
        // If we already have route info, refresh nav
        if (this.domainName) this.updateLocalNav();
      })
    );

    // Parse the current URL atomically on every NavigationEnd event.
    // This eliminates the race condition where combineLatest(parentRoute.paramMap, childRoute.url)
    // could fire with new parent params but stale child URL segments during cross-product navigation.
    this.subscriptions.add(
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe(event => {
        this.loadFromUrl(event.urlAfterRedirects || event.url);
      })
    );

    // Also load for the initial navigation (NavigationEnd already fired before subscribe)
    this.loadFromUrl(this.router.url);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Atomically parse domain/system/product/page from the full router URL,
   * then fetch the corresponding document content.
   */
  private loadFromUrl(url: string) {
    // Expected URL pattern: /docs/:domain/:system/:product[/:page1/:page2/...]
    const segments = url.split('/').filter(s => s.length > 0);
    // segments[0] = 'docs', [1] = domain, [2] = system, [3] = product, [4+] = page path
    if (segments.length < 4 || segments[0] !== 'docs') return;

    this.domainName = segments[1];
    this.systemName = segments[2];
    this.productName = segments[3];

    this.updateLocalNav();

    // Everything after domain/system/product is the page path
    const pageParts = segments.slice(4);
    if (pageParts.length > 0) {
      this.pageName = pageParts.join('/');
    } else {
      // Intelligent Fallback: find the first valid page from the nav tree
      const hasExplicitIndex = this.findNodeByName(this.localNavTree, 'index') || this.findNodeByName(this.localNavTree, 'index.md');
      if (hasExplicitIndex) {
        this.pageName = 'index';
      } else {
        const firstLeaf = this.findFirstLeafNode(this.localNavTree);
        this.pageName = firstLeaf ? firstLeaf : 'index';
      }
    }

    const docPath = `${this.domainName}/${this.systemName}/${this.productName}/${this.pageName}.md`;

    this.loading = true;
    this.error = '';
    this.feedbackSubmitted = false;
    this.cdr.detectChanges();

    this.envService.getDocumentContent(docPath).subscribe({
      next: (responseStr) => {
        const parsed = JSON.parse(responseStr);
        this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(parsed.html);
        this.toc = parsed.toc;

        const pageTitle = this.toc && this.toc.length > 0 ? this.toc[0].text : this.pageName;
        this.titleService.setTitle(`${pageTitle} | ${this.productName}`);

        this.loading = false;
        this.cdr.detectChanges();

        // Initialize mermaid explicitly on client after the DOM repaint is completely finalized.
        mermaid.initialize({ startOnLoad: false });
        setTimeout(() => {
          try {
            const elements = document.querySelectorAll('.mermaid');
            if (elements.length > 0) {
              console.log(`Found ${elements.length} mermaid diagrams, rendering...`);
              mermaid.run({ querySelector: '.mermaid' }).catch(err => console.error('Mermaid render error', err));
            }
          } catch (e) {
            console.warn('Mermaid failed to render', e);
          }
        }, 50);
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to load markdown content or file does not exist.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private updateLocalNav() {
    if (!this.catalogTree.length || !this.domainName || !this.systemName || !this.productName) return;

    const domainNode = this.catalogTree.find(d => d.name === this.domainName);
    const systemNode = domainNode?.children?.find(s => s.name === this.systemName);
    const productNode = systemNode?.children?.find(p => p.name === this.productName);

    this.domainTitle = domainNode?.title || this.domainName;
    this.systemTitle = systemNode?.title || this.systemName;
    this.productTitle = productNode?.title || this.productName;

    // Provide the valid pages (minus extensions for clean UI output)
    this.localNavTree = productNode?.children || [];
    this.cdr.detectChanges();
  }

  private findFirstLeafNode(nodes: DocumentNode[] | undefined): string | null {
    if (!nodes || nodes.length === 0) return null;

    for (const node of nodes) {
      if (node.type === 'file') {
        // Strip `.md` from the fallback so it cleanly injects into `docPath` later as `${pageName}.md` 
        return (node.path || node.name).replace(/\.md$/, '');
      } else if (node.type === 'directory' && node.children) {
        const childLeaf = this.findFirstLeafNode(node.children);
        if (childLeaf) return childLeaf;
      }
    }
    return null;
  }

  private findNodeByName(nodes: DocumentNode[] | undefined, targetName: string): boolean {
    if (!nodes) return false;
    for (const node of nodes) {
      if (node.type === 'file' && (node.name === targetName || node.path === targetName)) return true;
      if (node.type === 'directory' && this.findNodeByName(node.children, targetName)) return true;
    }
    return false;
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }

  scrollTo(id: string, event: Event) {
    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Account for the sticky header height
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }

  submitFeedback(isHelpful: boolean) {
    if (this.feedbackSubmitted) return;
    const currentUrl = `/${this.domainName}/${this.systemName}/${this.productName}/${this.pageName}`;
    this.telemetry.trackFeedback(currentUrl, isHelpful);
    this.feedbackSubmitted = true;
  }
}
