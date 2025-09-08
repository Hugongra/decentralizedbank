import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { PublicKey, Transaction } from '@solana/web3.js';
import { CONNECTION } from '../../../smart-contract';
import { dev } from '../../../environments/env';
import { WalletType } from '../../layout/components/wallet-button/wallet-types';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  #provider: any;
  #publicKey$ = new BehaviorSubject<PublicKey | null>(null);

  get publicKey$(): Observable<PublicKey | null> {
    return this.#publicKey$.asObservable();
  }

  get connected$(): Observable<boolean> {
    return this.#publicKey$.pipe(map((publicKey) => !!publicKey));
  }

  get publicKey(): PublicKey {
    return this.#publicKey$.getValue();
  }

  get walletType(): WalletType {
    return WalletType.factory(localStorage.getItem('wallet') || '');
  }

  constructor() {
    const wallet = localStorage.getItem('wallet');
    if (wallet) {
      this.connectWallet(WalletType.factory(wallet));
    }
  }

  async connectWallet(walletType: WalletType): Promise<PublicKey | null> {
    try {
      const provider = WalletType.provider(walletType);
      if (provider) {
        this.#provider = provider;
      } else {
        window.open(WalletType.url(walletType), '_blank');
        throw new Error('Wallet provider not found!');
      }
      const response = await this.#provider.connect();
      const publicKey = new PublicKey(response.publicKey);
      this.#publicKey$.next(publicKey);
      localStorage.setItem('wallet', walletType);
      if (dev) console.log('Connected to wallet:', publicKey.toBase58());
      return publicKey;
    } catch (err) {
      if (dev) console.error(`Failed to connect to ${walletType} wallet:`, err);
      throw err;
    }
  }

  disconnectWallet(): void {
    if (this.#provider) {
      this.#provider.disconnect();
      this.#publicKey$.next(null);
      localStorage.removeItem('wallet');
    }
  }

  async signTransaction(transaction: Transaction) {
    if (!this.#provider) {
      throw new Error('Wallet not connected!');
    }
    const { blockhash } = await CONNECTION.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.#publicKey$.getValue() as PublicKey;
    try {
      const signedTransaction = await this.#provider.signTransaction(transaction);
      const txId = await CONNECTION.sendRawTransaction(signedTransaction.serialize());
      await CONNECTION.confirmTransaction(txId, 'confirmed');
      if (dev) console.log('Transaction confirmed:', txId);
      return txId;
    } catch (error) {
      if (dev) console.error('Failed to sign transaction:', error);
      throw error;
    }
  }

}
