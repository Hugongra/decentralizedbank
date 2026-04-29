package com.freedomfinance.bank.borrow.domain.models;

import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.common.models.entities.IRecord;

public interface IBorrowRecord extends IEntity, IRecord {

    IBorrow getBorrow();

    Double getBorrowAmount();

    Double getBorrowValue();

    Double getCollateralAmount();

    Double getCollateralValue();

    Double getBorrowRateIndex();

}
