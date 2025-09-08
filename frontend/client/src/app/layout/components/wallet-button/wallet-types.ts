export enum WalletType {
    PHANTOM = 'Phantom',
    BACKPACK = 'Backpack',
    SOLFLARE = 'Solflare',
}

export namespace WalletType {

    export const factory = (wallet: string) => {
        switch (wallet) {
            case WalletType.PHANTOM:
                return WalletType.PHANTOM;
            case WalletType.BACKPACK:
                return WalletType.BACKPACK;
            case WalletType.SOLFLARE:
                return WalletType.SOLFLARE;
            default:
                return WalletType.BACKPACK;
        }
    }

    export const url = (wallet: WalletType) => {
        switch (wallet) {
            case WalletType.PHANTOM:
                return 'https://www.phantom.app/';
            case WalletType.BACKPACK:
                return 'https://www.backpack.app/';
            case WalletType.SOLFLARE:
                return 'https://solflare.com/';
        }
    }

    export const provider = (wallet: WalletType) => {
        let provider = undefined;
        switch (wallet) {
            case WalletType.PHANTOM: {
                const solana = (window as any).solana;
                if (solana?.isPhantom) {
                    provider = solana;
                }
                break;
            }
            case WalletType.BACKPACK: {
                const solana = (window as any).backpack.solana;
                if (solana?.isBackpack) {
                    provider = solana;
                }
                break;
            }
            case WalletType.SOLFLARE: {
                const solana = (window as any).solflare.solana;
                if (solana?.isSolflare) {
                    provider = solana;
                }
                break;
            }
        }
        return provider;
    }

}