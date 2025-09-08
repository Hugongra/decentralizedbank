import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ADMIN_WALLET, PROGRAM, SOL_REPRESENTATIVE_MINT_PUBKEY } from "../config";
import { Asset, AssetConfig } from "../models/asset";

export async function createSolAsset(bank: PublicKey, assetConfig: AssetConfig) {
    let asset = await Asset.factory(bank);
    const reserveVault = await Asset.reserveVaultPublicKey(PublicKey.default, bank);
    const collateralVault = await getAssociatedTokenAddress(SOL_REPRESENTATIVE_MINT_PUBKEY, bank, true);
    try {
        if (!asset.init) {
            const signature = await PROGRAM.methods.createSolAsset(assetConfig)
            .accountsPartial({
                adminWallet: ADMIN_WALLET.publicKey,
                representativeMint: SOL_REPRESENTATIVE_MINT_PUBKEY,
                bank: bank,
                asset: asset.publicKey,
                reserveVault: reserveVault,
                collateralVault: collateralVault,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            })
            .signers([ADMIN_WALLET])
            .rpc();
            asset = await Asset.factory(bank);
            console.log(`Sol Asset Account Created: ${signature}`);
        }
        console.log(`Sol Asset PublicKey: ${asset.publicKey} \n`);
        return asset;
    }
    catch (error) {
        console.log(`Error Creating Sol Asset Account: ${error}`);
        throw error;
    }
}

export async function createTokenAsset(bank: PublicKey, mint: PublicKey, representativeMint: PublicKey, assetConfig: AssetConfig) {
    let asset = await Asset.factory(bank, mint);
    const reserveVault = await Asset.reserveVaultPublicKey(mint, bank);
    const collateralVault = await getAssociatedTokenAddress(representativeMint, bank, true);
    try {
        if (!asset.init) {
            await PROGRAM.methods.createTokenAssetVaults()
            .accountsPartial({
                adminWallet: ADMIN_WALLET.publicKey,
                mint: mint,
                representativeMint: representativeMint,
                bank: bank,
                reserveVault: reserveVault,
                collateralVault: collateralVault,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
            })
            .signers([ADMIN_WALLET])
            .rpc();
            const signature = await PROGRAM.methods.createTokenAsset(assetConfig)
            .accountsPartial({
                adminWallet: ADMIN_WALLET.publicKey,
                mint,
                representativeMint,
                bank,
                asset: asset.publicKey,
                reserveVault,
                collateralVault,
                systemProgram: SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            })
            .signers([ADMIN_WALLET])
            .rpc();
            asset = await Asset.factory(bank, mint);
            console.log(`Token Asset Account Created: ${signature}`);
        }
        console.log(`Token Asset PublicKey: ${asset.publicKey}`);
        return asset;
    }
    catch (error) {
        console.log(`Error Creating Token Asset Account: ${error}`);
        throw error;
    }
}

export async function fetchAsset(assetPubKey: PublicKey) {
    const assets = await PROGRAM.account.asset.all();
    const asset = assets.find(asset => asset.publicKey.equals(assetPubKey));
    return new Asset(assetPubKey, asset.account);
}