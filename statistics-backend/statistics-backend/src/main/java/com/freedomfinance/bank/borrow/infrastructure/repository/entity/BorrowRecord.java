package com.freedomfinance.bank.borrow.infrastructure.repository.entity;

import com.freedomfinance.bank.borrow.domain.models.IBorrow;
import com.freedomfinance.bank.borrow.domain.models.IBorrowRecord;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Date;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "borrow_record", schema = "public", indexes = {
        @Index(name = "borrow_record_timestamp_index", columnList ="r_timestamp")
})
public class BorrowRecord implements IBorrowRecord {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "borrow_id", nullable = false)
    private Borrow borrow;

    @Column(name="borrow_amount", nullable = false)
    private Double borrowAmount;

    @Column(name="borrow_value", nullable = false)
    private Double borrowValue;

    @Column(name="collateral_amount", nullable = false)
    private Double collateralAmount;

    @Column(name="collateral_value", nullable = false)
    private Double collateralValue;

    @Column(name="borrow_rate_index", nullable = false)
    private Double borrowRateIndex;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    public BorrowRecord(
            IBorrow borrow,
            Double borrowAmount,
            Double borrowValue,
            Double collateralAmount,
            Double collateralValue,
            Double borrowRateIndex) {
        this.borrow = (Borrow) borrow;
        this.borrowAmount = borrowAmount;
        this.borrowValue = borrowValue;
        this.collateralAmount = collateralAmount;
        this.collateralValue = collateralValue;
        this.borrowRateIndex = borrowRateIndex;
        this.timestamp = Date.from(Instant.now());
    }

}
