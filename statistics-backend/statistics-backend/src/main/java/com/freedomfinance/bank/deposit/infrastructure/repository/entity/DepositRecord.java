package com.freedomfinance.bank.deposit.infrastructure.repository.entity;

import com.freedomfinance.bank.deposit.domain.models.IDeposit;
import com.freedomfinance.bank.deposit.domain.models.IDepositRecord;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Date;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "deposit_record", schema = "public", indexes = {
        @Index(name = "deposit_record_timestamp_index", columnList ="r_timestamp")
})
public class DepositRecord implements IDepositRecord {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_id", nullable = false)
    private Deposit deposit;

    @Column(name="amount", nullable = false)
    private Double depositAmount;

    @Column(name="value", nullable = false)
    private Double depositValue;

    @Column(name="deposit_rate_index", nullable = false)
    private Double depositRateIndex;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    public DepositRecord(
            IDeposit deposit,
            Double depositAmount,
            Double depositValue,
            Double depositRateIndex) {
        this.deposit = (Deposit) deposit;
        this.depositAmount = depositAmount;
        this.depositValue = depositValue;
        this.depositRateIndex = depositRateIndex;
        this.timestamp = Date.from(Instant.now());
    }

}
