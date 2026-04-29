package com.freedomfinance.bank.bank.domain.models;

import com.freedomfinance.bank.common.models.entities.IAccount;
import com.freedomfinance.bank.common.models.entities.IEntity;

import java.util.List;

public interface IBank extends IEntity, IAccount {
    List<IAsset> getAssets();

}
