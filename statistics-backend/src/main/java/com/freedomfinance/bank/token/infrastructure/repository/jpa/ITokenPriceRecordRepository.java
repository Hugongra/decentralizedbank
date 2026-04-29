package com.freedomfinance.bank.token.infrastructure.repository.jpa;

import com.freedomfinance.bank.token.infrastructure.repository.entity.TokenPriceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ITokenPriceRecordRepository extends JpaRepository<TokenPriceRecord, Long> {

    @Query("SELECT record FROM TokenPriceRecord record WHERE record.token.id = :tokenId ORDER BY record.timestamp DESC LIMIT 1")
    TokenPriceRecord findLast(Long tokenId);

    @Query("SELECT record FROM TokenPriceRecord record WHERE record.token.id = :tokenId AND record.timestamp>=timestamp ORDER BY record.timestamp ASC LIMIT 1")
    TokenPriceRecord findByTimestamp(Long tokenId, Long timestamp);

}
