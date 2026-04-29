package com.freedomfinance.bank.sandbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IExampleRepository extends JpaRepository<Example, Long> {
}
