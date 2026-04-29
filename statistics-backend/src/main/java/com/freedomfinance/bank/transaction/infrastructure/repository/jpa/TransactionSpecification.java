package com.freedomfinance.bank.transaction.infrastructure.repository.jpa;

import com.freedomfinance.bank.customer.infrastructure.repository.entity.Customer;
import com.freedomfinance.bank.transaction.infrastructure.repository.entity.Transaction;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.util.Date;

public class TransactionSpecification {

    public static Specification<Transaction> userPublicKey(String userPublicKey) {
        return (root, query, cb) -> {
            Join<Transaction, Customer> join = root.join("customer");
            return cb.equal(join.get("userPublicKey"), userPublicKey);
        };
    }

    public static Specification<Transaction> startDate(Long startDate) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("timestamp"), new Date(startDate));
    }

    public static Specification<Transaction> endDate(Long endDate) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("timestamp"), new Date(endDate));
    }

}
