package com.freedomfinance.bank.bank.infrastructure.repository.entity;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.domain.models.IAssetRecord;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "asset_record", schema = "public", indexes = {
        @Index(name = "asset_record_timestamp_index", columnList ="r_timestamp")
})
public class AssetRecord implements IAssetRecord {

    private static final Long RECORD_LIMIT_INTERVAL = ChronoUnit.MINUTES.getDuration().toMillis() * 5;

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(name="deposit_apr", nullable = false)
    private Short depositApr;

    @Column(name="borrow_apr", nullable = false)
    private Short borrowApr;

    @Column(name="deposit_amount", nullable = false)
    private Double depositAmount;

    @Column(name="deposit_value", nullable = false)
    private Double depositValue;

    @Column(name="borrow_amount", nullable = false)
    private Double borrowAmount;

    @Column(name="borrow_value", nullable = false)
    private Double borrowValue;

    @Column(name="deposit_global_rate", nullable = false)
    private Double depositGlobalRate;

    @Column(name="borrow_global_rate", nullable = false)
    private Double borrowGlobalRate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    public AssetRecord(
            IAsset asset,
            Short depositApr,
            Short borrowApr,
            Double depositAmount,
            Double depositValue,
            Double borrowAmount,
            Double borrowValue,
            Double depositGlobalRate,
            Double borrowGlobalRate) {
        this.asset = (Asset) asset;
        this.depositApr = depositApr;
        this.borrowApr = borrowApr;
        this.depositAmount = depositAmount;
        this.depositValue = depositValue;
        this.borrowAmount = borrowAmount;
        this.borrowValue = borrowValue;
        this.depositGlobalRate = depositGlobalRate;
        this.borrowGlobalRate = borrowGlobalRate;
        this.timestamp = Date.from(Instant.now());
    }

    @Override
    public void update(Short depositApr, Short borrowApr, Double depositAmount, Double depositValue, Double borrowAmount,
                       Double borrowValue, Double depositGlobalRate, Double borrowGlobalRate) {
        this.depositApr = depositApr;
        this.borrowApr = borrowApr;
        this.depositAmount = depositAmount;
        this.depositValue = depositValue;
        this.borrowAmount = borrowAmount;
        this.borrowValue = borrowValue;
        this.depositGlobalRate = depositGlobalRate;
        this.borrowGlobalRate = borrowGlobalRate;
        this.timestamp = Date.from(Instant.now());
    }

    @Override
    public boolean isSlate() {
        return timestamp.getTime() + RECORD_LIMIT_INTERVAL < Date.from(Instant.now()).getTime();
    }

}
