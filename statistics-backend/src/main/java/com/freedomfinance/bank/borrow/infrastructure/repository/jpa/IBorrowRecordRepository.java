package com.freedomfinance.bank.borrow.infrastructure.repository.jpa;

import com.freedomfinance.bank.borrow.infrastructure.repository.entity.BorrowRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Repository
public interface IBorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {

    @Query("SELECT record FROM BorrowRecord record WHERE record.borrow.id = :borrowId ORDER BY record.timestamp DESC LIMIT 1")
    BorrowRecord findLast(Long borrowId);

    @Query("SELECT record FROM BorrowRecord record WHERE record.borrow.publicKey = :borrowPublicKey AND record.timestamp >= :timestamp ORDER BY record.timestamp")
    List<BorrowRecord> findByTimestamp(String borrowPublicKey, Date timestamp);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM borrow_record r
         JOIN borrow p ON r.borrow_id = p.id
         WHERE p.public_key = :borrowPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 year'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM borrow_record r
         JOIN borrow p ON r.borrow_id = p.id
         JOIN selected_records s ON p.public_key = :borrowPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '3 day'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<BorrowRecord> findLastYear(String borrowPublicKey);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM borrow_record r
         JOIN borrow p ON r.borrow_id = p.id
         WHERE p.public_key = :borrowPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 month'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM borrow_record r
         JOIN borrow p ON r.borrow_id = p.id
         JOIN selected_records s ON p.public_key = :borrowPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '6 hour'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<BorrowRecord> findLastMonth(String borrowPublicKey);

    @Query(value = """
    WITH RECURSIVE selected_records AS (
        (SELECT r.*
         FROM borrow_record r
         JOIN borrow p ON r.borrow_id = p.id
         WHERE p.public_key = :borrowPublicKey\s
           AND r.r_timestamp >= NOW() - INTERVAL '1 day'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
       \s
        UNION ALL
       \s
        (SELECT r.*
         FROM borrow_record r
         JOIN borrow p ON r.borrow_id = p.id
         JOIN selected_records s ON p.public_key = :borrowPublicKey
         WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '12 minute'
         ORDER BY r.r_timestamp ASC
         LIMIT 1)
    )
    SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<BorrowRecord> findLastDay(String borrowPublicKey);

    default List<BorrowRecord> findByDate(String borrowPublicKey, ChronoUnit unit) {
        if (this.count() < 120) {
            return findByTimestamp(borrowPublicKey, new Date(System.currentTimeMillis() - unit.getDuration().toMillis()));
        }
        if (unit.equals(ChronoUnit.YEARS)) {
            return findLastYear(borrowPublicKey);
        } else if (unit.equals(ChronoUnit.MONTHS)) {
            return findLastMonth(borrowPublicKey);
        } else if (unit.equals(ChronoUnit.DAYS)) {
            return findLastDay(borrowPublicKey);
        }
        return List.of();
    }

}
