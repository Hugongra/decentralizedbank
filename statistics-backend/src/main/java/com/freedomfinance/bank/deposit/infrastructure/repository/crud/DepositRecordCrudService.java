package com.freedomfinance.bank.deposit.infrastructure.repository.crud;

import com.freedomfinance.bank.deposit.domain.models.IDepositRecord;
import com.freedomfinance.bank.deposit.domain.services.IDepositRecordCrudService;
import com.freedomfinance.bank.deposit.infrastructure.repository.entity.DepositRecord;
import com.freedomfinance.bank.deposit.infrastructure.repository.jpa.IDepositRecordRepository;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DepositRecordCrudService implements IDepositRecordCrudService {

    private final IDepositRecordRepository repository;

    public DepositRecordCrudService(IDepositRecordRepository repository) {
        this.repository = repository;
    }

    @Override
    public IDepositRecord getLast(Long depositId) {
        return repository.findLast(depositId);
    }

    @Override
    public IDepositRecord save(IDepositRecord depositRecord) {
        return repository.save((DepositRecord) depositRecord);
    }

    @Override
    public List<IDepositRecord> findByDate(String depositPublicKey, ChronoUnit timeUnit) {
        return repository.findByDate(depositPublicKey, timeUnit).stream()
                .map(record -> (IDepositRecord) record)
                .toList();
    }

}
