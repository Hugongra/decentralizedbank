package com.freedomfinance.bank.deposit.domain.services;

import com.freedomfinance.bank.deposit.application.exceptions.DepositAlreadyExistsException;
import com.freedomfinance.bank.deposit.application.exceptions.DepositNotFoundException;
import com.freedomfinance.bank.deposit.domain.models.IDeposit;

import java.util.List;

public interface IDepositCrudService {

    IDeposit get(Long id) throws DepositNotFoundException;

    IDeposit get(String publicKey) throws DepositNotFoundException;

    List<IDeposit> getAll(String bankPublicKey, String userPublicKey);

    void save(IDeposit deposit);

    default void checkDepositExistence(String publicKey) throws DepositAlreadyExistsException {
        try {
            get(publicKey);
            throw new DepositAlreadyExistsException(publicKey);
        } catch (DepositNotFoundException ignored) {}
    }

}
