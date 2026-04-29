package com.freedomfinance.bank.token.infrastructure.repository.jpa;

import com.freedomfinance.bank.token.infrastructure.repository.entity.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ITokenRepository extends JpaRepository<Token, Long> {

    @Query("SELECT token FROM Token token WHERE token.mint = :mint")
    Token findByMint(String mint);

    @Query("SELECT token FROM Token token WHERE token.symbol = :symbol")
    Token findBySymbol(String symbol);

}
