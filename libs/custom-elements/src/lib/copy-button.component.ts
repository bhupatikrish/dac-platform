import { Component, ElementRef, ViewEncapsulation, inject } from '@angular/core';

/**
 * Angular Custom Element: <dac-copy-button>
 *
 * Renders a copy-to-clipboard button with SVG icon.
 * When clicked, reads the text content from the sibling <pre> element
 * and copies it to the clipboard with visual feedback.
 *
 * Uses ShadowDom encapsulation since this is a Web Component (Custom Element)
 * rendered inside dynamically injected innerHTML.
 */
@Component({
  selector: 'dac-copy-button',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    @if (copied) {
      <button class="copy-button visible" aria-label="Copied!">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
    } @else {
      <button class="copy-button" aria-label="Copy code" (click)="copyCode()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
    .copy-button {
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      border-radius: 0.375rem;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--color-text-tertiary, #6b7280);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1),
                  color 150ms cubic-bezier(0.4, 0, 0.2, 1),
                  background 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host(:hover) .copy-button,
    .copy-button.visible {
      opacity: 1;
    }
    .copy-button:hover {
      color: var(--color-text-primary, #1f2937);
      background: rgba(128, 128, 128, 0.1);
    }
  `]
})
export class CopyButtonComponent {
  private el = inject(ElementRef);
  copied = false;

  copyCode() {
    // Traverse up from the shadow host to the .code-block-wrapper, then find the sibling <pre>
    const host: HTMLElement = this.el.nativeElement;
    const wrapper = host.closest('.code-block-wrapper');
    const preElement = wrapper?.querySelector('pre');

    if (preElement) {
      const codeText = preElement.innerText || preElement.textContent || '';
      navigator.clipboard.writeText(codeText).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      }).catch(err => console.error('Failed to write to clipboard', err));
    }
  }
}
