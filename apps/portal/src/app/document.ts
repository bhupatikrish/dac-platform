import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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

  public htmlContent: SafeHtml = '';
  public toc: any[] = [];
  public catalogTree: DocumentNode[] = [];
  public localNavTree: DocumentNode[] = [];

  public domainName = '';
  public systemName = '';
  public productName = '';
  public pageName = '';

  public loading = true;
  public error = '';
  public feedbackSubmitted = false;

  ngOnInit() {
    this.envService.getCatalogTree().subscribe({
      next: (tree) => {
        this.catalogTree = tree;
        this.updateLocalNav();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching baseline side-nav tree', err)
    });

    this.route.paramMap.subscribe(params => {
      this.domainName = params.get('domain') || '';
      this.systemName = params.get('system') || '';
      this.productName = params.get('product') || '';
      this.pageName = params.get('page') || 'index';

      const docPath = `${this.domainName}/${this.systemName}/${this.productName}/${this.pageName}.md`;

      this.updateLocalNav();

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
    });
  }

  private updateLocalNav() {
    if (!this.catalogTree.length || !this.domainName || !this.systemName || !this.productName) return;

    const domainNode = this.catalogTree.find(d => d.name === this.domainName);
    const systemNode = domainNode?.children?.find(s => s.name === this.systemName);
    const productNode = systemNode?.children?.find(p => p.name === this.productName);

    // Provide the valid pages (minus extensions for clean UI output)
    this.localNavTree = productNode?.children || [];
    this.cdr.detectChanges();
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
