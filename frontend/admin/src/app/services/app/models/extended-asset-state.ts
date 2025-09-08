import { AssetState } from "../../../../smart-contract/states/asset-state";

export interface ExtendedAssetState {
    state: AssetState;
    meta: {
        tokenId: number;
        symbol: string;
        logoUrl: string;
    };
}