import { Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { CopyButtonComponent } from './copy-button.component';
import { ContentTabsComponent } from './content-tabs.component';

/**
 * Registers all DAC custom elements with the browser.
 * Call this once after bootstrapping the Angular application.
 *
 * Once registered, these elements auto-bootstrap when their tags
 * appear in dynamically injected innerHTML (e.g., from the API).
 *
 * @param injector The root application injector from bootstrapApplication()
 */
export function registerCustomElements(injector: Injector): void {
    const copyBtn = createCustomElement(CopyButtonComponent, { injector });
    customElements.define('dac-copy-button', copyBtn);

    const tabs = createCustomElement(ContentTabsComponent, { injector });
    customElements.define('dac-content-tabs', tabs);
}
