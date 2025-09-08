import { Routes } from "@angular/router";
import { AssetsPageComponent } from "./assets-page.component";
import { UpdateAssetDrawerComponent } from "./update-asset-drawer/update-asset-drawer.component";
import { CreateAssetDrawerComponent } from "./create-asset-drawer/create-asset-drawer.component";

export default [
    {
        path: '', component: AssetsPageComponent,
        children: [
            {
                path: 'new',
                component: CreateAssetDrawerComponent
            },
            {
                path: ':pubkey',
                component: UpdateAssetDrawerComponent
            }]
        }
] as Routes;