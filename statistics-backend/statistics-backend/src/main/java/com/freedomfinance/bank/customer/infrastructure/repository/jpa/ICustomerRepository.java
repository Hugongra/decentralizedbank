package com.freedomfinance.bank.customer.infrastructure.repository.jpa;

import com.freedomfinance.bank.customer.infrastructure.repository.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ICustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT customer FROM Customer customer WHERE customer.userPublicKey=:userPublicKey")
    Customer findByPublicKey(String userPublicKey);

}
