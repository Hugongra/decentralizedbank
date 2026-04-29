package com.freedomfinance.bank.log.infrastructure.repository.entity;

import com.freedomfinance.bank.log.domain.models.ISmartContractLog;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Date;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "smart_contract_log", schema = "public", indexes = {
        @Index(name = "smart_contract_log_timestamp_index", columnList ="r_timestamp")
})
public class SmartContractLog implements ISmartContractLog {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name="signature", nullable = false)
    private String signature;

    @Column(name="error", nullable = false)
    private Boolean error;

    @Column(name="processed", nullable = false)
    private Boolean processed;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    public SmartContractLog(String signature, Boolean error) {
        this.id = null;
        this.signature = signature;
        this.error = error;
        this.processed = false;
        this.timestamp = Date.from(Instant.now());
    }

    @Override
    public void processed() {
        this.processed = true;
    }
}
