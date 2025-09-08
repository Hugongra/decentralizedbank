import { Router, Routes } from '@angular/router';
import { ClassicLayoutComponent } from './layout/layouts/classic-layout/classic-layout.component';
import { BankPageComponent } from './pages/bank/bank.component';
import { EmptyLayoutComponent } from './layout/layouts/empty-layout/empty-layout.component';
import { inject } from '@angular/core';
import { WalletService } from './services/app/wallet.service';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';

export const routes: Routes = [
    {
        path: 'auth',
        component: EmptyLayoutComponent,
        canActivateChild: [() => {
            const router = inject(Router);
            const walletService = inject(WalletService);
            return walletService.publicKey$.pipe(
                switchMap((pubKey) => {
                    if (pubKey) {
                        return of(false);
                    }
                    return from(walletService.connectWallet(walletService.walletType)).pipe(
                        map(() => false),
                        catchError(() => of(true))
                    );
                }),
                map(result => {
                    if (!result) {
                        return router.createUrlTree(['/bank']);
                    }
                    return result;
                })
            )
        }],
        children: [
            {path: '', loadChildren: () => import('./pages/auth/auth.routes')}
        ]
    },
    {
        path: '',
        component: ClassicLayoutComponent,
        canActivateChild: [() => {
            const router = inject(Router);
            const walletService = inject(WalletService);
            return walletService.publicKey$.pipe(
                switchMap((pubKey) => {
                    if (pubKey) {
                        return of(true);
                    }
                    return from(walletService.connectWallet(walletService.walletType)).pipe(
                        map(() => true),
                        catchError(() => of(false))
                    );
                }),
                map(result => {
                    if (!result) {
                        return router.createUrlTree(['/auth']);
                    }
                    return result;
                })
            )
        }],
        children: [
            {path: 'bank', component: BankPageComponent},
            {path: 'assets', loadChildren: () => import('./pages/assets/assets.routes')},
            {path: '**', pathMatch : 'full', redirectTo: 'bank'}
        ]
    },
    {path: '**', pathMatch : 'full', redirectTo: 'auth'}
];
