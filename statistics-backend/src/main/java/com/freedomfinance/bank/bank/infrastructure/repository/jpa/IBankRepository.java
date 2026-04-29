package com.freedomfinance.bank.bank.infrastructure.repository.jpa;

import com.freedomfinance.bank.bank.infrastructure.repository.entity.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IBankRepository extends JpaRepository<Bank, Long> {
    @Query("SELECT bank FROM Bank bank WHERE bank.publicKey = :publicKey")
    Bank findByPublicKey(String publicKey);
}
