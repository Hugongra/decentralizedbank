package com.freedomfinance.bank.bank.domain.services;

import com.freedomfinance.bank.bank.application.exceptions.BankAlreadyExistsException;
import com.freedomfinance.bank.bank.application.exceptions.BankNotFoundException;
import com.freedomfinance.bank.bank.domain.models.IBank;

public interface IBankCrudService {

    IBank get(Long id) throws BankNotFoundException;

    IBank get(String publicKey) throws BankNotFoundException;

    void save(IBank bank);

    default void checkBankExistence(String bankPublicKey) throws BankAlreadyExistsException {
        try {
            get(bankPublicKey);
            throw new BankAlreadyExistsException(bankPublicKey);
        } catch (BankNotFoundException ignored) {}
    }

}
