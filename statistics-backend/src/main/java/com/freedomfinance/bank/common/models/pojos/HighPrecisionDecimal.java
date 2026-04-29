package com.freedomfinance.bank.common.models.pojos;

import lombok.Getter;

import java.math.BigDecimal;
import java.math.RoundingMode;
@Getter
public class HighPrecisionDecimal {

    public static final Short SCALED_DECIMALS = 18;
    public static final Short PERCENT_DECIMALS = 4;
    public static final Short RATE_DECIMALS = 15;
    public static final Short PRICE_DECIMALS = 6;

    private BigDecimal amount;

    private final Short decimals;

    public HighPrecisionDecimal(BigDecimal amount, Short decimals) {
        this.amount = amount;
        this.decimals = decimals;
    }

    public HighPrecisionDecimal(Double value, Short decimals) {
        this.decimals = decimals;
        this.amount = new BigDecimal(String.valueOf(value));
    }

    public static HighPrecisionDecimal fromPrice(Double price) {
        BigDecimal amount = new BigDecimal(String.valueOf(price));
        return new HighPrecisionDecimal(amount, PRICE_DECIMALS);
    }

    public static HighPrecisionDecimal fromToken(String lamport, Short mintDecimals) {
        BigDecimal amount = new BigDecimal(lamport);
        BigDecimal divisor = BigDecimal.TEN.pow(mintDecimals);
        return new HighPrecisionDecimal(amount.divide(divisor, SCALED_DECIMALS, RoundingMode.HALF_UP), mintDecimals);
    }

    public static HighPrecisionDecimal fromPercent(Short percent) {
        BigDecimal amount = new BigDecimal(percent);
        BigDecimal divisor = BigDecimal.TEN.pow(PERCENT_DECIMALS);
        return new HighPrecisionDecimal(amount.divide(divisor, SCALED_DECIMALS, RoundingMode.HALF_UP), PERCENT_DECIMALS);
    }

    public static HighPrecisionDecimal fromRate(String rate) {
        BigDecimal amount = new BigDecimal(rate);
        BigDecimal divisor = BigDecimal.TEN.pow(RATE_DECIMALS);
        return new HighPrecisionDecimal(amount.divide(divisor, SCALED_DECIMALS, RoundingMode.HALF_UP), RATE_DECIMALS);
    }

    public HighPrecisionDecimal multiply(HighPrecisionDecimal multiplier) {
        this.amount = this.amount.multiply(multiplier.getAmount());
        return this;
    }

    public static HighPrecisionDecimal multiply(HighPrecisionDecimal multiplicand, HighPrecisionDecimal multiplier) {
        HighPrecisionDecimal result = new HighPrecisionDecimal(multiplicand.getAmount(), multiplicand.getDecimals());
        return result.multiply(multiplier);
    }

    public HighPrecisionDecimal subtract(HighPrecisionDecimal subtrahend) {
        this.amount = this.amount.subtract(subtrahend.getAmount());
        return this;
    }

    public Double normalized() {
        return this.amount
                .setScale(decimals, RoundingMode.DOWN)
                .doubleValue();
    }

    public boolean isNegative() {
        return this.amount.compareTo(BigDecimal.ZERO) < 0;
    }

}
