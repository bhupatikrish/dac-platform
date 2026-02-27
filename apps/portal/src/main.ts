import { bootstrapApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { CopyButtonComponent } from './app/elements/copy-button.component';
import { ContentTabsComponent } from './app/elements/content-tabs.component';

bootstrapApplication(App, appConfig).then(appRef => {
    const injector = appRef.injector;

    // Register Angular Custom Elements for dynamic innerHTML content.
    // Once defined, the browser auto-bootstraps these components when
    // their tags appear in dynamically injected HTML (e.g., from the API).
    const copyBtn = createCustomElement(CopyButtonComponent, { injector });
    customElements.define('dac-copy-button', copyBtn);

    const tabs = createCustomElement(ContentTabsComponent, { injector });
    customElements.define('dac-content-tabs', tabs);
}).catch((err) => console.error(err));
