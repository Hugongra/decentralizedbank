package com.freedomfinance.bank.common.application.exceptions;

import java.text.SimpleDateFormat;
import java.util.Date;
import lombok.Getter;
import org.springframework.http.HttpStatus;

public abstract class XException extends Exception {

    @Getter
    private final String domain;

    @Getter
    private final HttpStatus httpStatus;

    private final Long timestamp = System.currentTimeMillis();

    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    protected XException(String message, String domain, HttpStatus httpStatus) {
        super(message);
        this.domain = domain;
        this.httpStatus = httpStatus;
    }

    public String getLog() {
        return String.format("%s %s %s: %s",
                sdf.format(new Date(timestamp)),
                httpStatus.value(),
                domain,
                getMessage());
    }

}
