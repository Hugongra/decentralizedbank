import { BANK_PUBKEY, PROGRAM } from "../config";
import { Borrow } from "../models/borrow";

export async function fetchAllBorrows() {
    const borrows = await PROGRAM.account.borrow.all();
    const filteredBorrows: Borrow[] = [];
    for (const borrow of borrows) {
        if  (borrow.account.liquidating) {
            continue;
        }
        const asset = await PROGRAM.account.asset.fetch(borrow.account.asset);
        if (!asset.bank.equals(BANK_PUBKEY)) {
            continue;
        }
        filteredBorrows.push(new Borrow(borrow.publicKey, borrow.account));
    }
    return filteredBorrows;
}