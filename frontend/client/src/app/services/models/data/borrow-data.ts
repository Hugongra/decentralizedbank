import { PublicKey } from "@solana/web3.js";
import { BorrowState } from "../../../../smart-contract/states/borrow-state";
import { AssetState } from "../../../../smart-contract/states/asset-state";
import { Asset } from "../api/asset";
import Decimal from "decimal.js";

export class BorrowData {

    readonly publicKey: PublicKey;
    readonly amount: bigint;
    readonly borrowRateIndex: bigint;
    readonly collateralAmount: bigint;
    readonly depositPublicKey: PublicKey;

    readonly borrowAsset: {
        publicKey: PublicKey;
        symbol: string;
        logoUrl: string;
        mintDecimals: number;
        borrowGlobalRate: bigint;
        price: number;
    }
    readonly collateralAsset: {
        publicKey: PublicKey;
        symbol: string;
        logoUrl: string;
        mintDecimals: number;
        price: number;
    }

    readonly borrowedAmount: number;
    readonly borrowedValue: number;

    readonly owedAmount: number;
    readonly owedValue: number;

    readonly collateredAmount: number;
    readonly collateredValue: number

    constructor(
        borrowState: BorrowState, borrowAssetState: AssetState, collateralAssetState: AssetState,
        borrowAsset: Asset, collateralAsset: Asset,
        borrowTokenPrice: number, collateralTokenPrice: number
    ) {
        this.publicKey = borrowState.pubKey;
        this.amount = borrowState.amount;
        this.borrowRateIndex = borrowState.borrowRateIndex;
        this.collateralAmount = borrowState.collateralAmount;
        this.depositPublicKey = borrowState.deposit;
        this.borrowAsset = {
            publicKey: borrowAssetState.pubKey,
            symbol: borrowAsset.symbol,
            logoUrl: borrowAsset.logoUrl,
            mintDecimals: borrowAssetState.mintDecimals,
            borrowGlobalRate: borrowAssetState.borrowGlobalRate,
            price: borrowTokenPrice
        }
        this.collateralAsset = {
            publicKey: collateralAssetState.pubKey,
            symbol: collateralAsset.symbol,
            logoUrl: collateralAsset.logoUrl,
            mintDecimals: collateralAssetState.mintDecimals,
            price: collateralTokenPrice
        }
        const borrowGlobalRate = new Decimal(borrowAssetState.borrowGlobalRate.toString()).div(new Decimal(10).pow(15));
        const borrowRateIndex = new Decimal(borrowState.borrowRateIndex.toString()).div(new Decimal(10).pow(15));
        const borrowRate = new Decimal(1).add(borrowGlobalRate).sub(borrowRateIndex);
        const borrowPrice = new Decimal(borrowTokenPrice);
        const amount = new Decimal(this.amount.toString()).div(new Decimal(10).pow(borrowAssetState.mintDecimals));
        const collateralAmount = new Decimal(this.collateralAmount.toString()).div(new Decimal(10).pow(collateralAssetState.mintDecimals));
        this.borrowedAmount = parseFloat(amount.toFixed(borrowAssetState.mintDecimals));
        this.borrowedValue = parseFloat(amount.mul(borrowPrice).toFixed(2));
        this.owedAmount = parseFloat(amount.mul(borrowRate).toFixed(borrowAssetState.mintDecimals));
        this.owedValue = parseFloat(amount.mul(borrowRate).mul(borrowPrice).toFixed(2));
        this.collateredAmount = parseFloat(collateralAmount.toFixed(collateralAssetState.mintDecimals));
        this.collateredValue = parseFloat(collateralAmount.mul(collateralTokenPrice).toFixed(2));
    }

    cleanRepayAmount(amount: number): bigint {
        const borrowGloablRate = new Decimal(this.borrowAsset.borrowGlobalRate.toString()).div(new Decimal(10).pow(15));
        const borrowRateIndex = new Decimal(this.borrowRateIndex.toString()).div(new Decimal(10).pow(15));
        const borrowRate = new Decimal(1).add(borrowGloablRate).sub(borrowRateIndex);
        const maxRepayAmount = new Decimal(this.amount.toString()).div(new Decimal(10).pow(this.borrowAsset.mintDecimals)).mul(borrowRate);
        const repayAmount = new Decimal(amount);
        const minDecimal = Decimal.min(maxRepayAmount, repayAmount);
        return BigInt(minDecimal.mul(new Decimal(10).pow(this.borrowAsset.mintDecimals)).toFixed(0));
    }

}