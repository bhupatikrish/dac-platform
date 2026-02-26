import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// @ts-ignore
import { renderMarkdown, RenderedDocument } from '@tmp-dac/renderer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-container">
      <header class="header">
        <h1>DAC Local Preview Shell</h1>
        <div class="controls">
          <input type="text" #pathInput [value]="currentPath" (keyup.enter)="loadDocument(pathInput.value)" placeholder="e.g. infrastructure/compute/eks/index.md" />
          <button (click)="loadDocument(pathInput.value)">Load</button>
        </div>
      </header>
      
      <main class="content-wrapper">
        <article class="markdown-body" *ngIf="contentHtml" [innerHTML]="contentHtml"></article>
        
        <aside class="right-sidebar" *ngIf="toc && toc.length > 0">
          <h3>On this page</h3>
          <ul>
            <li *ngFor="let item of toc" [style.padding-left.px]="(item.level - 1) * 10">
              <a [href]="'#' + item.id">{{ item.text }}</a>
            </li>
          </ul>
        </aside>
      </main>
      
      <div *ngIf="error" class="error-banner">{{ error }}</div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: system-ui, sans-serif; }
    .preview-container { display: flex; flex-direction: column; min-height: 100vh; }
    .header { padding: 1rem; background: #1a1a1a; color: white; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 1.25rem; }
    .controls { display: flex; gap: 0.5rem; }
    .controls input { width: 300px; padding: 0.5rem; }
    .controls button { padding: 0.5rem 1rem; cursor: pointer; }
    
    .content-wrapper { display: flex; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 2rem; gap: 2rem; }
    .markdown-body { flex: 1; max-width: 800px; line-height: 1.6; }
    .right-sidebar { width: 250px; position: sticky; top: 2rem; align-self: flex-start; }
    .right-sidebar ul { list-style: none; padding: 0; }
    .right-sidebar a { text-decoration: none; color: #0366d6; }
    .right-sidebar a:hover { text-decoration: underline; }
    .error-banner { background: #fee; color: #c00; padding: 1rem; text-align: center; }
  `]
})
export class App implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  currentPath = 'infrastructure/compute/eks/setup.md';
  contentHtml: SafeHtml | null = null;
  toc: any[] = [];
  error: string | null = null;

  ngOnInit() {
    this.loadDocument(this.currentPath);
  }

  loadDocument(path: string) {
    this.error = null;
    this.currentPath = path;

    // Fetch raw markdown from the static assets
    this.http.get('/docs/' + path, { responseType: 'text' }).subscribe({
      next: async (markdown) => {
        try {
          // Send raw markdown to our renderer library
          const result: RenderedDocument = await renderMarkdown(markdown);

          // Trust the HTML (Internal tool structure only)
          this.contentHtml = this.sanitizer.bypassSecurityTrustHtml(result.html);
          this.toc = result.toc;

          // Trigger mermaid explicit init if needed (normally lazy loaded in DOM)
          // In a real app, a directive would handle this on the innerHTML elements
          setTimeout(() => {
            if ((window as any).mermaid) {
              (window as any).mermaid.init(undefined, document.querySelectorAll('.mermaid'));
            }
          }, 100);
        } catch (e: any) {
          this.error = 'Render error: ' + e.message;
        }
      },
      error: (e) => {
        this.error = 'Failed to load ' + path + '. Status: ' + e.statusText;
      }
    });
  }
}
