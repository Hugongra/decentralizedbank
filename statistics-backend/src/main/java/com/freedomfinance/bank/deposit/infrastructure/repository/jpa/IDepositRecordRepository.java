package com.freedomfinance.bank.deposit.infrastructure.repository.jpa;

import com.freedomfinance.bank.deposit.infrastructure.repository.entity.DepositRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Repository
public interface IDepositRecordRepository extends JpaRepository<DepositRecord, Long> {

    @Query("SELECT record FROM DepositRecord record WHERE record.deposit.id = :depositId ORDER BY record.timestamp DESC LIMIT 1")
    DepositRecord findLast(Long depositId);

    @Query("SELECT record FROM DepositRecord record WHERE record.deposit.publicKey = :depositPublicKey AND record.timestamp >= :timestamp ORDER BY record.timestamp")
    List<DepositRecord> findByTimestamp(String depositPublicKey, Date timestamp);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM deposit_record r
         JOIN deposit p ON r.deposit_id = p.id
         WHERE p.public_key = :depositPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 year'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM deposit_record r
         JOIN deposit p ON r.deposit_id = p.id
         JOIN selected_records s ON p.public_key = :depositPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '3 day'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<DepositRecord> findLastYear(String depositPublicKey);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM deposit_record r
         JOIN deposit p ON r.deposit_id = p.id
         WHERE p.public_key = :depositPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 month'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM deposit_record r
         JOIN deposit p ON r.deposit_id = p.id
         JOIN selected_records s ON p.public_key = :depositPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '6 hour'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<DepositRecord> findLastMonth(String depositPublicKey);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM deposit_record r
         JOIN deposit p ON r.deposit_id = p.id
         WHERE p.public_key = :depositPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 day'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM deposit_record r
         JOIN deposit p ON r.deposit_id = p.id
         JOIN selected_records s ON p.public_key = :depositPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '12 minute'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<DepositRecord> findLastDay(String depositPublicKey);


    default List<DepositRecord> findByDate(String depositPublicKey, ChronoUnit unit) {
        if (this.count() < 120) {
            return findByTimestamp(depositPublicKey, new Date(System.currentTimeMillis() - unit.getDuration().toMillis()));
        }
        if (unit.equals(ChronoUnit.YEARS)) {
            return findLastYear(depositPublicKey);
        } else if (unit.equals(ChronoUnit.MONTHS)) {
            return findLastMonth(depositPublicKey);
        } else if (unit.equals(ChronoUnit.DAYS)) {
            return findLastDay(depositPublicKey);
        }
        return List.of();
    }

}
