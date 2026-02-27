import { Route } from '@angular/router';
import { Landing } from '@tmp-dac/landing';
import { Document } from '@tmp-dac/doc-viewer';

export const appRoutes: Route[] = [
    { path: '', component: Landing },
    {
        path: 'docs/:domain/:system/:product',
        children: [
            { path: '**', component: Document }
        ]
    },
    { path: '**', redirectTo: '' }
];
