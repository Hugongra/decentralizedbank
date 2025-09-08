import { Routes } from "@angular/router";
import { AssetsPageComponent } from "./assets-page.component";
import { AssetDrawerComponent } from "./drawer/asset-drawer.component";

export const routes: Routes = [
    {   
        path: '', 
        component: AssetsPageComponent,
        children: [
            {
                path: ':publicKey',
                component: AssetDrawerComponent
            }
        ]
    },
];