import { Routes } from '@angular/router';
import { ClassicLayoutComponent } from './layout/layouts/classic-layout/classic-layout.component';

export const routes: Routes = [
    {
        path: '',
        component: ClassicLayoutComponent,
        children: [
            {path: 'assets', loadChildren: () => import('./pages/assets/assets.routes').then(m => m.routes)},
            {path: 'deposits', loadChildren: () => import('./pages/deposits/deposits.routes').then(m => m.routes)},
            {path: 'borrows', loadChildren: () => import('./pages/borrows/borrows.routes').then(m => m.routes)},
            {path: 'transactions', loadChildren: () => import('./pages/transactions/transactions.routes').then(m => m.routes)},
            {path: '**', pathMatch : 'full', redirectTo: 'assets'}
        ]
    }
];
