package com.freedomfinance.bank.sandbox;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.time.temporal.ChronoUnit;

@Service
public class ExampleService implements CommandLineRunner {

    private final IExampleRepository exampleRepository;
    private final IExampleRecordRepository recordRepository;
    private List<RecordDto> records = new ArrayList<>();

    @Autowired
    public ExampleService(
            IExampleRepository exampleRepository,
            IExampleRecordRepository recordRepository) {
        this.exampleRepository = exampleRepository;
        this.recordRepository = recordRepository;
    }

    @Override
    public void run(String... args) {
        //initExample("96zTLVtbZgXdUZz79UGAshMZJ3oNSVoQ83cqGKeLmWGJ", (short) 9);
        //initExample("2WfQEuYYzbF3k68o9BVq8qUhSXfGK4696pRop1HbKHHd", (short) 6);
        //fetch("96zTLVtbZgXdUZz79UGAshMZJ3oNSVoQ83cqGKeLmWGJ");
    }

    private void initExample(String pubKey, Short decimals) {
        Example example = new Example(pubKey, decimals);
        exampleRepository.save(example);
        long timestamp = System.currentTimeMillis() - ChronoUnit.YEARS.getDuration().toMillis();
        for(int i=0; i < 8760; i++) {
            long delay = (long) i * ChronoUnit.HOURS.getDuration().toMillis();
            Date date = new Date(timestamp + delay);
            recordRepository.save(new ExampleRecord(example, date));
        }
    }

    private void fetch(String publicKey) {
        Date now = Date.from(Instant.now());
        Date startDate = new Date(now.getTime() - ChronoUnit.YEARS.getDuration().toMillis());
        List<ExampleRecord> records = recordRepository.findLastYear(publicKey);
        for (ExampleRecord record : records) {
            System.out.println(record.getTimestamp());
        }
    }

}

class RecordDto {
    private Long id;
    private Double value;
    private Long timestamp;

}
