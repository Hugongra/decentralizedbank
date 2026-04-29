package com.freedomfinance.bank.log.infrastructure.repository.jpa;

import com.freedomfinance.bank.log.infrastructure.repository.entity.SmartContractLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface ISmartContractLogRepository extends JpaRepository<SmartContractLog, Long> {

    @Query("SELECT log FROM SmartContractLog log WHERE log.signature=:signature")
    SmartContractLog findBySignature(String signature);
    @Query("SELECT record FROM SmartContractLog record ORDER BY record.timestamp DESC LIMIT 1")
    SmartContractLog findLast();

    @Query("SELECT log FROM SmartContractLog log WHERE log.processed=false AND log.error=false")
    List<SmartContractLog> findUnprocessed();

}
