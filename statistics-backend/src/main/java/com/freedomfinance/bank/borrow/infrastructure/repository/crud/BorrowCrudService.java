package com.freedomfinance.bank.borrow.infrastructure.repository.crud;

import com.freedomfinance.bank.borrow.application.exceptions.BorrowNotFoundException;
import com.freedomfinance.bank.borrow.domain.models.IBorrow;
import com.freedomfinance.bank.borrow.domain.services.IBorrowCrudService;
import com.freedomfinance.bank.borrow.infrastructure.repository.entity.Borrow;
import com.freedomfinance.bank.borrow.infrastructure.repository.jpa.IBorrowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BorrowCrudService implements IBorrowCrudService {

    private final IBorrowRepository repository;

    @Autowired
    public BorrowCrudService(IBorrowRepository repository) {
        this.repository = repository;
    }

    @Override
    public IBorrow get(Long id) throws BorrowNotFoundException {
        Borrow borrow = repository.findById(id).orElse(null);
        if (borrow == null) {
            throw new BorrowNotFoundException(id);
        }
        return borrow;
    }

    @Override
    public IBorrow get(String publicKey) throws BorrowNotFoundException {
        Borrow borrow = repository.findByPublicKey(publicKey);
        if (borrow == null) {
            throw new BorrowNotFoundException(publicKey);
        }
        return borrow;
    }

    @Override
    public List<IBorrow> getAll(String bankPublicKey, String userPublicKey) {
        return repository.findByUserPublicKey(bankPublicKey, userPublicKey).stream()
                .map(borrow -> (IBorrow) borrow)
                .toList();
    }

    @Override
    public IBorrow save(IBorrow borrow) {
        return repository.save((Borrow) borrow);
    }

}
