package com.freedomfinance.bank.sandbox;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Getter
@NoArgsConstructor
public class ExampleRecord {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "example_id", nullable = false)
    private Example example;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    @Column(name="value", nullable = false)
    private Long value;

    public ExampleRecord(Example example, Date timestamp) {
        this.example = example;
        this.timestamp = timestamp;
        this.value = (long) (Math.random() * 184467440737095516L);
    }

}
