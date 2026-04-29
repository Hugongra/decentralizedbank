package com.freedomfinance.bank.log.infrastructure.repository.jpa;

import com.freedomfinance.bank.log.infrastructure.repository.entity.BackendLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IBackendLogRepository extends JpaRepository<BackendLog, Long> {

}
