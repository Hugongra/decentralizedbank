package com.freedomfinance.bank.transaction.infrastructure.repository.jpa;

import com.freedomfinance.bank.transaction.infrastructure.repository.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ITransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
}
