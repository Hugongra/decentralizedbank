import { inject } from "@angular/core";
import { CanActivateChildFn, CanActivateFn, Router, Routes } from "@angular/router";
import { tap } from "rxjs";
import { BorrowsPageComponent } from "./borrows-page.component";
import { BorrowDrawerComponent } from "./drawer/borrow-drawer.component";
import { DataService } from "../../services/data.service";


export const guard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router = inject(Router);;
    return inject(DataService).borrowed$.pipe(
        tap(borrowed => {
            if (!borrowed) {
                router.navigate(['assets']);
            }
        })
    );
};

export const routes: Routes = [
    {
        path: '',
        component: BorrowsPageComponent,
        canActivate: [guard],
        canActivateChild: [guard],
        children: [
            {
                path: ':publicKey',
                component: BorrowDrawerComponent
            }
        ]
    },
];
