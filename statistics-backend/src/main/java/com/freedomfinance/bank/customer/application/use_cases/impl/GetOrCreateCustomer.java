package com.freedomfinance.bank.customer.application.use_cases.impl;

import com.freedomfinance.bank.customer.application.exceptions.CustomerNotFoundException;
import com.freedomfinance.bank.customer.application.use_cases.IGetOrCreateCustomer;
import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.customer.domain.services.ICustomerCrudService;
import com.freedomfinance.bank.customer.infrastructure.repository.entity.Customer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GetOrCreateCustomer implements IGetOrCreateCustomer {

    private final ICustomerCrudService customerCrudService;

    @Autowired
    public GetOrCreateCustomer(ICustomerCrudService customerCrudService) {
        this.customerCrudService = customerCrudService;
    }

    @Override
    public ICustomer execute(String userPublicKey) {
        try {
            return customerCrudService.get(userPublicKey);
        } catch (CustomerNotFoundException e) {
            return customerCrudService.save(new Customer(userPublicKey));
        }
    }

}
