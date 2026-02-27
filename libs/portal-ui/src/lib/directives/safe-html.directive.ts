import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Directive: [dacSafeHtml]
 *
 * Safely injects pre-sanitized HTML into the host element.
 *
 * This exists because Angular's default [innerHTML] binding runs content through
 * its built-in DomSanitizer, which strips custom elements (<dac-copy-button>,
 * <dac-content-tabs>), inline <style> blocks (Shiki), and other legitimate HTML.
 *
 * Safety guarantee: All HTML passed to this directive has ALREADY been sanitized
 * by DOMPurify at build time in the renderer pipeline. This directive simply
 * tells Angular to trust that pre-sanitized output.
 *
 * Usage:
 *   <article [dacSafeHtml]="htmlString"></article>
 *
 * This replaces the pattern:
 *   this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(html);
 *   <article [innerHTML]="htmlContent"></article>
 */
@Directive({
    selector: '[dacSafeHtml]',
    standalone: true
})
export class SafeHtmlDirective implements OnChanges {
    @Input('dacSafeHtml') html = '';

    private el = inject(ElementRef);
    private sanitizer = inject(DomSanitizer);

    ngOnChanges() {
        // The HTML was already sanitized by DOMPurify at build time.
        // We set innerHTML directly to preserve custom elements and inline styles.
        this.el.nativeElement.innerHTML = this.html || '';
    }
}
