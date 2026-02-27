import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { registerCustomElements } from '@tmp-dac/custom-elements';

bootstrapApplication(App, appConfig).then(appRef => {
    const injector = appRef.injector;
    registerCustomElements(injector);
}).catch((err) => console.error(err));
