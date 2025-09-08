import { inject } from "@angular/core";
import { CanActivateChildFn, CanActivateFn, ResolveFn, Router, Routes } from "@angular/router";
import { map, tap } from "rxjs";
import { WalletService } from "../../services/wallet.service";
import { TransactionsPageComponent } from "./transactions-page.component";

const guard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router = inject(Router);
    return inject(WalletService).connected$.pipe(
        tap(connected => {
            if (!connected) {
                router.navigate(['assets']);
            }
        })
    );
};

const resolver: ResolveFn<string>= () => {
    return inject(WalletService).publicKey$.pipe(map(publicKey => publicKey.toBase58()));
};

export const routes: Routes = [
    {
        path: '',
        component: TransactionsPageComponent,
        canActivate: [guard],
        resolve: {userPublicKey: resolver}
    },
];
