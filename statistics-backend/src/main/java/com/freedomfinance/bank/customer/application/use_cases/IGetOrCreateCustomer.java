package com.freedomfinance.bank.customer.application.use_cases;

import com.freedomfinance.bank.customer.domain.models.ICustomer;

public interface IGetOrCreateCustomer {
    ICustomer execute(String userPublicKey);
}
