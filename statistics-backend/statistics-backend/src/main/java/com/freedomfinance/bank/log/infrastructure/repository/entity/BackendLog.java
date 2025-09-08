package com.freedomfinance.bank.log.infrastructure.repository.entity;

import com.freedomfinance.bank.log.domain.models.IBackendLog;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Date;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "backend_log", schema = "public", indexes = {
        @Index(name = "backend_log_timestamp_index", columnList ="r_timestamp")
})
public class BackendLog implements IBackendLog {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name="domain", nullable = false)
    private String domain;

    @Column(name="message", nullable = false)
    private String message;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    public BackendLog(String domain, String message) {
        this.domain = domain;
        this.message = message;
        this.timestamp = Date.from(Instant.now());
    }

}
