package com.freedomfinance.bank.borrow.domain.services;

import com.freedomfinance.bank.borrow.application.exceptions.BorrowAlreadyExistsException;
import com.freedomfinance.bank.borrow.application.exceptions.BorrowNotFoundException;
import com.freedomfinance.bank.borrow.domain.models.IBorrow;

import java.util.List;

public interface IBorrowCrudService {

    IBorrow get(Long id) throws BorrowNotFoundException;

    IBorrow get(String publicKey) throws BorrowNotFoundException;

    List<IBorrow> getAll(String bankPublicKey, String userPublicKey);

    IBorrow save(IBorrow borrow);

    default void checkBorrowExistence(String publicKey) throws BorrowAlreadyExistsException {
        try {
            get(publicKey);
            throw new BorrowAlreadyExistsException(publicKey);
        } catch (BorrowNotFoundException ignored) {}
    }

}
