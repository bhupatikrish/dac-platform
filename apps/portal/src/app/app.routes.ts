import { Route } from '@angular/router';
import { Landing } from './landing';
import { Document } from './document';

export const appRoutes: Route[] = [
    { path: '', component: Landing },
    { path: 'docs/:domain/:system/:product', component: Document },
    { path: 'docs/:domain/:system/:product/:page', component: Document },
    { path: '**', redirectTo: '' }
];
