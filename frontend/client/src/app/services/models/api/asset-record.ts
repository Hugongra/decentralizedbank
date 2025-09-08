import { Record } from './record';

export interface AssetRateRecords {

    depositGlobalRates: Record[];

    borrowGlobalRates: Record[];

}

export interface AssetAprRecords {

    depositAprs: Record[];

    borrowAprs: Record[];

}