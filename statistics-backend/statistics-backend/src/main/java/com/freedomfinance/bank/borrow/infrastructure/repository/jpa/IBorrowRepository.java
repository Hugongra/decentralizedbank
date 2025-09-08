package com.freedomfinance.bank.borrow.infrastructure.repository.jpa;

import com.freedomfinance.bank.borrow.infrastructure.repository.entity.Borrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IBorrowRepository extends JpaRepository<Borrow, Long> {

    @Query("SELECT borrow FROM Borrow borrow WHERE borrow.publicKey=:publicKey")
    Borrow findByPublicKey(String publicKey);

    @Query("SELECT borrow FROM Borrow borrow WHERE borrow.borrowAsset.bank.publicKey=:bankPublicKey AND borrow.customer.userPublicKey=:userPublicKey")
    List<Borrow> findByUserPublicKey(String bankPublicKey, String userPublicKey);

}
