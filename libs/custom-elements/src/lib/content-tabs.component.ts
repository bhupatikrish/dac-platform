import { Component, ChangeDetectorRef, ElementRef, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';

/**
 * Angular Custom Element: <dac-content-tabs>
 *
 * Renders a tab label bar and manages active/inactive state for
 * slotted tab panel children. The panels are raw HTML divs projected
 * via the native <slot> Web Component mechanism.
 *
 * Uses ShadowDom encapsulation so <slot> projection works correctly
 * when this component is used as a Custom Element in dynamic innerHTML.
 *
 * Usage in pre-processed HTML:
 *   <dac-content-tabs labels="Python,JavaScript,Go">
 *     <div class="content-tab-panel active" data-tab-index="0">...</div>
 *     <div class="content-tab-panel" data-tab-index="1">...</div>
 *     <div class="content-tab-panel" data-tab-index="2">...</div>
 *   </dac-content-tabs>
 */
@Component({
  selector: 'dac-content-tabs',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="content-tabs">
      <div class="content-tabs-labels">
        @for (label of tabLabels; track label; let i = $index) {
          <button
            class="content-tab-label"
            [class.active]="activeIndex === i"
            (click)="activate(i)">
            {{ label }}
          </button>
        }
      </div>
      <slot></slot>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin: 1.5rem 0;
    }
    .content-tabs-labels {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--color-border-primary, #e5e7eb);
      margin-bottom: 0;
      overflow-x: auto;
    }
    .content-tab-label {
      padding: 0.5rem 1rem;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--color-text-tertiary, #6b7280);
      font-family: var(--font-family-base, sans-serif);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1),
                  border-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
                  background 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .content-tab-label:hover {
      color: var(--color-text-primary, #1f2937);
      background: rgba(128, 128, 128, 0.06);
    }
    .content-tab-label.active {
      color: var(--color-text-primary, #1f2937);
      font-weight: 600;
      border-bottom-color: var(--color-brand-primary, #4f6bed);
    }
    /* Panel styles must be in the shadow DOM to affect slotted content */
    ::slotted(.content-tab-panel) {
      display: none;
    }
    ::slotted(.content-tab-panel.active) {
      display: block;
      padding-top: 0.75rem;
    }
  `]
})
export class ContentTabsComponent implements OnInit {
  private el = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  /** Comma-separated tab labels passed as an HTML attribute */
  @Input() labels = '';

  tabLabels: string[] = [];
  activeIndex = 0;

  ngOnInit() {
    // Parse labels synchronously during init to avoid NG0100
    this.tabLabels = this.labels
      ? this.labels.split(',').map(l => l.trim())
      : [];

    // Explicitly trigger change detection to settle the view
    this.cdr.detectChanges();

    // Set initial panel visibility after a microtask to ensure DOM is ready
    Promise.resolve().then(() => this.updatePanels());
  }

  activate(index: number) {
    this.activeIndex = index;
    this.updatePanels();
  }

  private updatePanels() {
    // Access light DOM children (slotted content) via the host element
    const host: HTMLElement = this.el.nativeElement;
    const panels = host.querySelectorAll('.content-tab-panel');

    panels.forEach((panel: Element) => {
      const panelIndex = panel.getAttribute('data-tab-index');
      if (panelIndex === String(this.activeIndex)) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  }
}
