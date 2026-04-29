import axios from 'axios';
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { BANK_PUBKEY, HERMES_URL, LIQUIDATOR_WALLET, PROGRAM } from "./config";
import { BN } from '@coral-xyz/anchor';
import { fetchAllBorrows } from './services/borrow_service';
import { fetchAsset } from './services/asset_service';
import { fetchDeposit } from './services/deposit_service';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { fetchBank } from './services/bank_service';

const DECIMALS = new BN('1000000000000000000');

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const fromTokenAmount = (amount: BN, decimals: number) => {
  const scale = new BN(10).pow(new BN(18 - decimals));
  return amount.mul(scale);
}

const fromPercent = (percent: number) => {
  const scale = new BN(10).pow(new BN(18 - 3));
  return new BN(percent).mul(scale);
}

const fromPrice = (price: number, expo: number) => {
  const scale = new BN(10).pow(new BN(18 + expo));
  return new BN(price).mul(scale);
}

const reduceScale = (number: BN, decimals: number) => {
  const scale = new BN(10).pow(new BN(18 - decimals));
  return number.div(scale);
}

async function fetchPrice(oracleId: PublicKey): Promise<BN> {
  try {
      const priceFeedId = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
      const response = await axios.get(`${HERMES_URL}/latest_price_feeds`,
        {
          params: {
            'ids[]': priceFeedId,
          },
        }
      );
      if (response.data.length === 0) {
          throw new Error('No price data found for the given oracle ID');
      }
      const priceData = response.data[0];
      return fromPrice(priceData.price.price, priceData.price.expo);
    } catch (error) {
      console.error('Failed to fetch price from Hermes:', error);
    }
}

(async () => {
  while(true) {
    const borrows = await fetchAllBorrows();
    for (const borrow of borrows) {
      const bank = await fetchBank(BANK_PUBKEY);
      const borrowAsset = await fetchAsset(borrow.asset);
      const deposit = await fetchDeposit(borrow.deposit);
      const depositAsset = await fetchAsset(deposit.asset);

      const borrowPrice = await fetchPrice(borrowAsset.config.oracleId);
      const depositPrice = await fetchPrice(depositAsset.config.oracleId);

      const borrowAmount = fromTokenAmount(borrow.amount, borrowAsset.mintDecimals);
      const collateralAmount = fromTokenAmount(borrow.collateralAmount, depositAsset.mintDecimals);

      const maxCloseLtv = fromPercent(borrowAsset.config.maxCloseLtv);
      const borrowWeight = fromPercent(depositAsset.config.borrowWeight);

      const borrowValue = borrowAmount.mul(borrowPrice).div(DECIMALS);
      const collateralValue = collateralAmount
      .mul(depositPrice)
      .mul(borrowWeight)
      .div(DECIMALS)
      .div(DECIMALS);

      const ltv = borrowValue.mul(DECIMALS).div(collateralValue);

      if (ltv.gte(maxCloseLtv)) {
        let signature = undefined;
        if (borrowAsset.mintPubkey.equals(depositAsset.mintPubkey)) {
          const reserveVault = await borrowAsset.reserveVaultFactory();
          const collateralVault = await borrowAsset.collateralVaultFactory();
          if (borrowAsset.native) {
            signature = await PROGRAM.methods
            .liquidateSolAuto(
              reduceScale(borrowPrice, 2)
            )
            .accountsPartial({
                liquidatorWallet: LIQUIDATOR_WALLET.publicKey,
                representativeMint: depositAsset.representativeMintPubkey,
                bank: BANK_PUBKEY,
                asset: borrowAsset.publicKey,
                borrow: borrow.publicKey,
                deposit: deposit.publicKey,
                reserveVault: reserveVault.publicKey,
                collateralVault: collateralVault.publicKey,
                feeVault: bank.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            })
            .signers([LIQUIDATOR_WALLET])
            .rpc();
          } else {
            signature = await PROGRAM.methods
            .liquidateTokenAuto(
              reduceScale(borrowPrice, 2)
            )
            .accountsPartial({
                liquidatorWallet: LIQUIDATOR_WALLET.publicKey,
                representativeMint: depositAsset.representativeMintPubkey,
                bank: BANK_PUBKEY,
                asset: borrowAsset.publicKey,
                borrow: borrow.publicKey,
                deposit: deposit.publicKey,
                reserveVault: reserveVault.publicKey,
                collateralVault: collateralVault.publicKey,
                feeVault: bank.publicKey,
                feeTokenReserveVault: (await borrowAsset.feeVaultFactory(bank.feeVault)).publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            })
            .signers([LIQUIDATOR_WALLET])
            .rpc();
          }
        } else {
          signature = await PROGRAM.methods
          .markToLiquidate(
            reduceScale(borrowPrice, 2),
            reduceScale(depositPrice, 2)
          )
          .accountsPartial({
              liquidatorWallet: LIQUIDATOR_WALLET.publicKey,
              bank: BANK_PUBKEY,
              borrowAsset: borrowAsset.publicKey,
              depositAsset: depositAsset.publicKey,
              borrow: borrow.publicKey,
              deposit: deposit.publicKey,
              systemProgram: SystemProgram.programId
          })
          .signers([LIQUIDATOR_WALLET])
          .rpc();
        }
      }
    }
    await delay(600000);
  }
})();
