package com.freedomfinance.bank.customer.domain.services;

import com.freedomfinance.bank.customer.application.exceptions.CustomerNotFoundException;
import com.freedomfinance.bank.customer.domain.models.ICustomer;

public interface ICustomerCrudService {
    ICustomer get(String userPublicKey) throws CustomerNotFoundException;
    ICustomer save(ICustomer customer);

}
