import { Record } from './record';

export interface TokenPriceRecord extends Record {
    tokenId: number;
    price: number;
}
