import { inject } from "@angular/core";
import { CanActivateChildFn, CanActivateFn, Router, Routes } from "@angular/router";
import { tap } from "rxjs";
import { DepositsPageComponent } from "./deposits-page.component";
import { DepositDrawerComponent } from "./drawer/deposit-drawer.component";
import { DataService } from "../../services/data.service";


export const DepositsGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router = inject(Router);
    return inject(DataService).deposited$.pipe(
        tap(deposited => {
            if (!deposited) {
                router.navigate(['assets']);
            }
        })
    );
};

export const routes: Routes = [
    {
        path: '',
        component: DepositsPageComponent,
        canActivate: [DepositsGuard],
        canActivateChild: [DepositsGuard],
        children: [
            {
                path: ':publicKey',
                component: DepositDrawerComponent
            }
        ]
    }
];