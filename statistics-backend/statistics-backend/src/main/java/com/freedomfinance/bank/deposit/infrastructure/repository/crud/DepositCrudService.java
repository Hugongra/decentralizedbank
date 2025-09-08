package com.freedomfinance.bank.deposit.infrastructure.repository.crud;

import com.freedomfinance.bank.deposit.application.exceptions.DepositNotFoundException;
import com.freedomfinance.bank.deposit.domain.models.IDeposit;
import com.freedomfinance.bank.deposit.domain.services.IDepositCrudService;
import com.freedomfinance.bank.deposit.infrastructure.repository.entity.Deposit;
import com.freedomfinance.bank.deposit.infrastructure.repository.jpa.IDepositRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepositCrudService implements IDepositCrudService {

    private final IDepositRepository repository;

    @Autowired
    public DepositCrudService(IDepositRepository repository) {
        this.repository = repository;
    }

    @Override
    public IDeposit get(Long id) throws DepositNotFoundException {
        IDeposit deposit = repository.findById(id).orElse(null);
        if (deposit == null) {
            throw new DepositNotFoundException(id);
        }
        return deposit;
    }

    @Override
    public IDeposit get(String publicKey) throws DepositNotFoundException {
        IDeposit deposit = repository.findByPublicKey(publicKey);
        if (deposit == null) {
            throw new DepositNotFoundException(publicKey);
        }
        return deposit;
    }

    @Override
    public List<IDeposit> getAll(String bankPublicKey, String userPublicKey) {
        return repository.findByUserPublicKey(bankPublicKey, userPublicKey).stream()
                .map(i -> (IDeposit) i)
                .toList();
    }
    @Override
    public void save(IDeposit deposit) {
        repository.save((Deposit) deposit);
    }

}
