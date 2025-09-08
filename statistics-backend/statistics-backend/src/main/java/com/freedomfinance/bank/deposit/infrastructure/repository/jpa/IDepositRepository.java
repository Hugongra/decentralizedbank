package com.freedomfinance.bank.deposit.infrastructure.repository.jpa;

import com.freedomfinance.bank.deposit.infrastructure.repository.entity.Deposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IDepositRepository extends JpaRepository<Deposit, Long> {

    @Query("SELECT deposit FROM Deposit deposit WHERE deposit.publicKey=:publicKey")
    Deposit findByPublicKey(String publicKey);

    @Query("SELECT deposit FROM Deposit deposit WHERE deposit.asset.bank.publicKey=:bankPublicKey AND deposit.customer.userPublicKey=:userPublicKey")
    List<Deposit> findByUserPublicKey(String bankPublicKey, String userPublicKey);

}
