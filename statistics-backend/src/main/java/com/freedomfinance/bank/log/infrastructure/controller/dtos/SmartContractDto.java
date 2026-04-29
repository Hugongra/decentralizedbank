package com.freedomfinance.bank.log.infrastructure.controller.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SmartContractDto {

    private Long id;

    @NotBlank
    private String signature;

    @NotNull
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean error;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean processed;

    public SmartContractDto() {
    }

    public SmartContractDto(Long id, String signature, Boolean error, Boolean processed) {
        this.id = id;
        this.signature = signature;
        this.error = error;
        this.processed = processed;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public Boolean getError() {
        return error;
    }

    public void setError(Boolean error) {
        this.error = error;
    }

    public Boolean getProcessed() {
        return processed;
    }

    public void setProcessed(Boolean processed) {
        this.processed = processed;
    }
}
