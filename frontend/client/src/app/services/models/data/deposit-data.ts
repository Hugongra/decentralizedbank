import { PublicKey } from "@solana/web3.js";
import { DepositState } from "../../../../smart-contract/states/deposit-state";
import { TokenAccount } from "../../../../smart-contract/models/vault-account";
import { AssetState } from "../../../../smart-contract/states/asset-state";
import { Asset } from "../api/asset";
import Decimal from "decimal.js";

export class DepositData {

  readonly publicKey: PublicKey;
  readonly user: PublicKey;

  readonly depositAsset: {
    publicKey: PublicKey;
    symbol: string;
    logoUrl: string;
    mintDecimals: number;
    depositGlobalRate: bigint;
    price: number;
  }

  readonly depositVaultPublicKey: PublicKey;

  readonly depositedAmount: number;
  readonly depositedValue: number;
  
  readonly earnedAmount: number;
  readonly earnedValue: number;

  readonly availableAmount: number;
  readonly availableValue: number;

  readonly collateredAmount: number;
  readonly collateredValue: number;

  constructor(depositState: DepositState, assetState: AssetState, asset: Asset, tokenPrice: number, depositVault: TokenAccount) {
    this.publicKey = depositState.pubKey;
    this.user = depositState.user;
    this.depositAsset = {
      publicKey: assetState.pubKey,
      symbol: asset.symbol,
      logoUrl: asset.logoUrl,
      mintDecimals: assetState.mintDecimals,
      depositGlobalRate: assetState.depositGlobalRate,
      price: tokenPrice
    }
    this.depositVaultPublicKey = depositVault.pubKey;
    const depositGlobalRate = new Decimal(assetState.depositGlobalRate.toString()).div(new Decimal(10).pow(15));
    const depositRateIndex = new Decimal(depositState.depositRateIndex.toString()).div(new Decimal(10).pow(15));
    const depositRate = new Decimal(1).add(depositGlobalRate).sub(depositRateIndex);
    const price = new Decimal(tokenPrice);
    const depositedAmount = new Decimal(depositState.amount.toString()).div(new Decimal(10).pow(assetState.mintDecimals));
    const earnedAmount = depositedAmount.mul(depositRate);
    const availableAmount = new Decimal(depositVault.amount.toString()).div(new Decimal(10).pow(assetState.mintDecimals));
    const collateredAmount = depositedAmount.sub(availableAmount);
    this.depositedValue = parseFloat(depositedAmount.mul(price).toFixed(2));
    this.earnedValue = parseFloat(earnedAmount.mul(price).toFixed(2));
    this.availableValue = parseFloat(availableAmount.mul(price).toFixed(2));
    this.collateredValue = parseFloat(collateredAmount.mul(price).toFixed(2));
    this.depositedAmount = parseFloat(depositedAmount.toFixed(assetState.mintDecimals));
    this.earnedAmount = parseFloat(earnedAmount.toFixed(assetState.mintDecimals));
    this.availableAmount = parseFloat(availableAmount.toFixed(assetState.mintDecimals));
    this.collateredAmount = parseFloat(collateredAmount.toFixed(assetState.mintDecimals));
  }

}
