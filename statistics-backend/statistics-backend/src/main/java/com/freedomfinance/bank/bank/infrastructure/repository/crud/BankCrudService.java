package com.freedomfinance.bank.bank.infrastructure.repository.crud;

import com.freedomfinance.bank.bank.application.exceptions.BankNotFoundException;
import com.freedomfinance.bank.bank.domain.models.IBank;
import com.freedomfinance.bank.bank.domain.services.IBankCrudService;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.Bank;
import com.freedomfinance.bank.bank.infrastructure.repository.jpa.IBankRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BankCrudService implements IBankCrudService {

    private final IBankRepository repository;

    @Autowired
    public BankCrudService(IBankRepository repository) {
        this.repository = repository;
    }

    @Override
    public IBank get(Long id) throws BankNotFoundException {
        IBank bank = repository.findById(id).orElse(null);
        if (bank == null) {
            throw new BankNotFoundException(id);
        }
        return bank;
    }
    @Override
    public IBank get(String publicKey) throws BankNotFoundException {
        IBank bank = repository.findByPublicKey(publicKey);
        if (bank == null) {
            throw new BankNotFoundException(publicKey);
        }
        return bank;
    }


    @Override
    public void save(IBank bank) {
        repository.save((Bank) bank);
    }
}
