package com.freedomfinance.bank.sandbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface IExampleRecordRepository extends JpaRepository<ExampleRecord, Long> {

    @Query(value = """
    SELECT DISTINCT ON (DATE_TRUNC('month', record.timestamp)) record.*
        FROM example_record record
        JOIN example example ON record.example_id = example.id
        WHERE record.timestamp >= :startDate AND example.public_key = :publicKey
        ORDER BY DATE_TRUNC('month', record.timestamp), record.timestamp DESC
    """, nativeQuery = true)
    List<ExampleRecord> findRecordTruncateByMonth(String publicKey, Date startDate);

    @Query(value = """
    SELECT DISTINCT ON (DATE_TRUNC('day', record.timestamp)) record.*
        FROM example_record record
        JOIN example example ON record.example_id = example.id
        WHERE record.timestamp >= :startDate AND example.public_key = :publicKey
        ORDER BY DATE_TRUNC('day', record.timestamp), record.timestamp DESC
    """, nativeQuery = true)
    List<ExampleRecord> findRecordTruncateByDay(String publicKey, Date startDate);


    @Query(value = """

            WITH RECURSIVE selected_records AS (
    -- Pick the first record
    (SELECT record.*
     FROM example_record record
     JOIN example example ON record.example_id = example.id
     WHERE example.public_key = :publicKey\s
       AND record.r_timestamp >= NOW() - INTERVAL '1 year'
     ORDER BY record.r_timestamp ASC
     LIMIT 1)
   \s
    UNION ALL
   \s
    -- Pick the next record that is at least 5 hours later
    (SELECT r.*
     FROM example_record r
     JOIN example e ON r.example_id = e.id
     JOIN selected_records s ON e.public_key = :publicKey
     WHERE r.r_timestamp >= s.r_timestamp + INTERVAL '3 day'
     ORDER BY r.r_timestamp ASC
     LIMIT 1)
)
SELECT * FROM selected_records;
    """, nativeQuery = true)
    List<ExampleRecord> findLastYear(String publicKey);



}
