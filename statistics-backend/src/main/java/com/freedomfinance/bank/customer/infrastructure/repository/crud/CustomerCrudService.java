package com.freedomfinance.bank.customer.infrastructure.repository.crud;

import com.freedomfinance.bank.customer.application.exceptions.CustomerNotFoundException;
import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.customer.domain.services.ICustomerCrudService;
import com.freedomfinance.bank.customer.infrastructure.repository.entity.Customer;
import com.freedomfinance.bank.customer.infrastructure.repository.jpa.ICustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CustomerCrudService implements ICustomerCrudService {

    private final ICustomerRepository repository;

    @Autowired
    public CustomerCrudService(ICustomerRepository repository) {
        this.repository = repository;
    }

    @Override
    public ICustomer get(String userPublicKey) throws CustomerNotFoundException {
        ICustomer customer = repository.findByPublicKey(userPublicKey);
        if (customer == null) {
            throw new CustomerNotFoundException(userPublicKey);
        }
        return customer;
    }

    @Override
    public ICustomer save(ICustomer customer) {
        return repository.save((Customer) customer);
    }

}
