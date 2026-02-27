import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';
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
export class Document implements OnInit {
  private route = inject(ActivatedRoute);
  private envService = inject(EnvironmentService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private telemetry = inject(TelemetryService);
  private titleService = inject(Title);

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
    combineLatest([
      this.envService.getCatalogTree(),
      this.route.paramMap,
      this.route.url
    ]).subscribe({
      next: ([tree, params, urlSegments]) => {
        this.catalogTree = tree;

        this.domainName = params.get('domain') || '';
        this.systemName = params.get('system') || '';
        this.productName = params.get('product') || '';

        this.updateLocalNav();

        const currentPath = urlSegments.map(segment => segment.path).join('/');

        // Intelligent Fallback Logic:
        // Try to explicitly grab the first valid route from the dynamically generated Tree
        // rather than blindly assuming `index.md` exists across all products.
        if (currentPath) {
          this.pageName = currentPath;
        } else {
          const hasExplicitIndex = this.findNodeByName(this.localNavTree, 'index') || this.findNodeByName(this.localNavTree, 'index.md');
          if (hasExplicitIndex) {
            this.pageName = 'index';
          } else {
            const firstLeaf = this.findFirstLeafNode(this.localNavTree);
            this.pageName = firstLeaf ? firstLeaf : 'index'; // Ultimate safety fallback
          }
        }

        const docPath = `${this.domainName}/${this.systemName}/${this.productName}/${this.pageName}.md`;

        this.loading = true;
        this.error = '';
        this.feedbackSubmitted = false; // Reset footprint on page change
        this.cdr.detectChanges();

        this.envService.getDocumentContent(docPath).subscribe({
          next: (responseStr) => {
            // The backend now ALWAYs returns the compiled RenderedDocument JSON
            const parsed = JSON.parse(responseStr);
            this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(parsed.html);
            this.toc = parsed.toc;

            // Dynamically set Browser Tab Title
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
            }, 50); // slight delay to guarantee Angular DOM flush
          },
          error: err => {
            console.error(err);
            this.error = 'Failed to load markdown content or file does not exist.';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => console.error('Error combining routing streams', err)
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

  @HostListener('click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Check if the click was directly on the copy-button, or heavily nested inside its SVG elements
    const copyButton = target.closest('.copy-button');

    if (copyButton) {
      // Traverse up to the wrapper, then grab the sibling pre element where syntax is held
      const wrapper = copyButton.closest('.code-block-wrapper');
      const preElement = wrapper?.querySelector('pre');

      if (preElement) {
        const codeText = preElement.innerText || preElement.textContent || '';
        navigator.clipboard.writeText(codeText).then(() => {
          // Provide tiny micro-feedback visually
          const originalHTML = copyButton.innerHTML;
          copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          setTimeout(() => {
            copyButton.innerHTML = originalHTML;
          }, 2000);
        }).catch(err => console.error('Failed to write to clipboard', err));
      }
    }
  }
}
