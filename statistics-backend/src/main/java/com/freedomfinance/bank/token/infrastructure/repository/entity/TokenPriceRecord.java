package com.freedomfinance.bank.token.infrastructure.repository.entity;

import com.freedomfinance.bank.token.domain.models.IToken;
import com.freedomfinance.bank.token.domain.models.ITokenPriceRecord;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Date;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "token_price_record", schema = "public")
public class TokenPriceRecord implements ITokenPriceRecord {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "token_id", nullable = false)
    private Token token;

    @Column(name="price", nullable = false)
    private Double price;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    public TokenPriceRecord(
            IToken token,
            Double price) {
        this.token = (Token) token;
        this.price = price;
        this.timestamp = Date.from(Instant.now());
    }

}
