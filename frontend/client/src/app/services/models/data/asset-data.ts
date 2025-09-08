import { PublicKey } from "@solana/web3.js";
import { AssetConfig, AssetState } from "../../../../smart-contract/states/asset-state";
import { Asset } from "../api/asset";
import { TokenAccount, VaultAccount } from "../../../../smart-contract/models/vault-account";
import Decimal from "decimal.js";
import { bpsToPercent } from "../../../../smart-contract";

export class AssetData {

    readonly publicKey: PublicKey;
    readonly user: PublicKey;
    readonly bank: PublicKey;
    readonly mintPubkey: PublicKey;
    readonly representativeMintPubkey: PublicKey;
    readonly mintDecimals: number;
    readonly depositAmount: bigint;
    readonly borrowAmount: bigint;
    readonly depositGlobalRate: bigint;
    readonly borrowGlobalRate: bigint;
    readonly depositApr: number;
    readonly borrowApr: number;
    readonly config: AssetConfig = {
        optimalUtilizationRate: 0,
        depositLimit: 0,
        maxDepositApr: 0,
        minDepositApr: 0,
        borrowLimit: 0,
        maxBorrowApr: 0,
        minBorrowApr: 0,
        rSlope1: 0,
        rSlope2: 0,
        borrowWeight: 0,
        borrowFee: 0,
        openLtv: 0,
        closeLtv: 0,
        maxCloseLtv: 0,
        liquidationFee: 0,
        oracleId: PublicKey.default
    };

    readonly symbol: string;
    readonly logoUrl: string;
    readonly price: number;

    readonly reserveVaultPublicKey: PublicKey;
    readonly collateralVaultPublicKey: PublicKey;
  
    readonly depositedAmount: number;
    readonly depositedValue: number;
    
    readonly borrowedAmount: number;
    readonly borrowedValue: number;
  
    readonly availableAmount: number;
    readonly availableValue: number;
  
    readonly collateredAmount: number;
    readonly collateredValue: number;

    readonly ltvBw: number;
  
    constructor(assetState: AssetState, asset: Asset, tokenPrice: number, reserveVault: VaultAccount, collateralVault: TokenAccount) {
        this.publicKey = assetState.pubKey;
        this.bank = assetState.bank;
        this.mintPubkey = assetState.mintPubkey;
        this.representativeMintPubkey = assetState.representativeMintPubkey;
        this.mintDecimals = assetState.mintDecimals;
        this.depositAmount = assetState.depositAmount;
        this.borrowAmount = assetState.borrowAmount;
        this.depositGlobalRate = assetState.depositGlobalRate;
        this.borrowGlobalRate = assetState.borrowGlobalRate;
        this.depositApr = assetState.depositApr;
        this.borrowApr = assetState.borrowApr;
        this.symbol = asset.symbol;
        this.logoUrl = asset.logoUrl;
        this.price = tokenPrice;
        this.reserveVaultPublicKey = reserveVault.pubKey;
        this.collateralVaultPublicKey = collateralVault.pubKey;
        const depositAmount = new Decimal(assetState.depositAmount.toString()).div(new Decimal(10).pow(assetState.mintDecimals));
        const borrowAmount = new Decimal(assetState.borrowAmount.toString()).div(new Decimal(10).pow(assetState.mintDecimals));
        const reserveAmount = new Decimal(reserveVault.amount.toString()).div(new Decimal(10).pow(assetState.mintDecimals));
        const collateralAmount = new Decimal(collateralVault.amount.toString()).div(new Decimal(10).pow(assetState.mintDecimals));
        const price = new Decimal(tokenPrice);
        this.depositedAmount = parseFloat(depositAmount.toFixed(assetState.mintDecimals));
        this.depositedValue = parseFloat(depositAmount.mul(price).toFixed(2));
        this.borrowedAmount = parseFloat(borrowAmount.toFixed(assetState.mintDecimals));
        this.borrowedValue = parseFloat(borrowAmount.mul(price).toFixed(2));
        this.availableAmount = parseFloat(reserveAmount.toFixed(assetState.mintDecimals));
        this.availableValue = parseFloat(reserveAmount.mul(price).toFixed(2));
        this.collateredAmount = parseFloat(collateralAmount.toFixed(assetState.mintDecimals));
        this.collateredValue = parseFloat(collateralAmount.mul(price).toFixed(2));
        this.config.optimalUtilizationRate = bpsToPercent(assetState.config.optimalUtilizationRate);
        this.config.depositLimit = bpsToPercent(assetState.config.depositLimit);
        this.config.maxDepositApr = bpsToPercent(assetState.config.maxDepositApr);
        this.config.minDepositApr = bpsToPercent(assetState.config.minDepositApr);
        this.config.borrowLimit = bpsToPercent(assetState.config.borrowLimit);
        this.config.maxBorrowApr = bpsToPercent(assetState.config.maxBorrowApr);
        this.config.minBorrowApr = bpsToPercent(assetState.config.minBorrowApr);
        this.config.rSlope1 = bpsToPercent(assetState.config.rSlope1);
        this.config.rSlope2 = bpsToPercent(assetState.config.rSlope2);
        this.config.borrowWeight = bpsToPercent(assetState.config.borrowWeight);
        this.config.borrowFee = bpsToPercent(assetState.config.borrowFee);
        this.config.openLtv = bpsToPercent(assetState.config.openLtv);
        this.config.closeLtv = bpsToPercent(assetState.config.closeLtv);
        this.config.maxCloseLtv = bpsToPercent(assetState.config.maxCloseLtv);
        this.config.liquidationFee = bpsToPercent(assetState.config.liquidationFee);
        this.config.oracleId = assetState.config.oracleId;
        this.ltvBw = this.config.openLtv / this.config.borrowWeight;
    }

}