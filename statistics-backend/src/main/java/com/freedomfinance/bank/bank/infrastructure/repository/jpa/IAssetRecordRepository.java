package com.freedomfinance.bank.bank.infrastructure.repository.jpa;

import com.freedomfinance.bank.bank.infrastructure.repository.entity.AssetRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Repository
public interface IAssetRecordRepository extends JpaRepository<AssetRecord, Long> {

    @Query("SELECT record FROM AssetRecord record WHERE record.asset.publicKey = :assetPublicKey AND record.timestamp >= :timestamp ORDER BY record.timestamp")
    List<AssetRecord> findByTimestamp(String assetPublicKey, Date timestamp);

    @Query("SELECT record FROM AssetRecord record WHERE record.asset.publicKey = :assetPublicKey ORDER BY record.timestamp DESC LIMIT 1")
    AssetRecord findLast(String assetPublicKey);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM asset_record r
         JOIN asset p ON r.asset_id = p.id
         WHERE p.public_key = :assetPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 year'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM asset_record r
         JOIN asset p ON r.asset_id = p.id
         JOIN selected_records s ON p.public_key = :assetPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '3 day'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<AssetRecord> findLastYear(String assetPublicKey);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM asset_record r
         JOIN asset p ON r.asset_id = p.id
         WHERE p.public_key = :assetPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 month'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM asset_record r
         JOIN asset p ON r.asset_id = p.id
         JOIN selected_records s ON p.public_key = :assetPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '6 hour'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<AssetRecord> findLastMonth(String assetPublicKey);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM asset_record r
         JOIN asset p ON r.asset_id = p.id
         WHERE p.public_key = :assetPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 day'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM asset_record r
         JOIN asset p ON r.asset_id = p.id
         JOIN selected_records s ON p.public_key = :assetPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '12 minute'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<AssetRecord> findLastDay(String assetPublicKey);

    default List<AssetRecord> findByDate(String assetPublicKey, ChronoUnit unit) {
        if (this.count() < 120) {
            return findByTimestamp(assetPublicKey, new Date(System.currentTimeMillis() - unit.getDuration().toMillis()));
        }
        if (unit.equals(ChronoUnit.YEARS)) {
            return findLastYear(assetPublicKey);
        } else if (unit.equals(ChronoUnit.MONTHS)) {
            return findLastMonth(assetPublicKey);
        } else if (unit.equals(ChronoUnit.DAYS)) {
            return findLastDay(assetPublicKey);
        }
        return List.of();
    }

}
