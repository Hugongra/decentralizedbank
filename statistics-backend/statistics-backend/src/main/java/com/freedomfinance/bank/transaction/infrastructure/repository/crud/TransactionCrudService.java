package com.freedomfinance.bank.transaction.infrastructure.repository.crud;

import com.freedomfinance.bank.transaction.domain.models.ITransaction;
import com.freedomfinance.bank.transaction.domain.services.ITransactionCrudService;
import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.request.TransactionFilterDto;
import com.freedomfinance.bank.transaction.infrastructure.repository.entity.Transaction;
import com.freedomfinance.bank.transaction.infrastructure.repository.jpa.ITransactionRepository;
import com.freedomfinance.bank.transaction.infrastructure.repository.jpa.TransactionSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class TransactionCrudService implements ITransactionCrudService {

    private final ITransactionRepository repository;

    @Autowired
    public TransactionCrudService(ITransactionRepository repository) {
        this.repository = repository;
    }

    @Override
    public Page<ITransaction> find(TransactionFilterDto filter) {
        Specification<Transaction> spec = Specification.where(TransactionSpecification.userPublicKey(filter.getUserPublicKey()));
        if (filter.getStartDate() != null) {
            spec = spec.and(TransactionSpecification.startDate(filter.getStartDate()));
        }
        if (filter.getEndDate() != null) {
            spec = spec.and(TransactionSpecification.endDate(filter.getStartDate()));
        }
        return repository.findAll(spec, filter.getPageable()).map(x -> x);
    }

    @Override
    public ITransaction save(ITransaction transaction) {
        return repository.save((Transaction) transaction);
    }

}
