package com.freedomfinance.bank.bank.infrastructure.repository.jpa;

import com.freedomfinance.bank.bank.infrastructure.repository.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IAssetRepository extends JpaRepository<Asset, Long> {

    @Query("SELECT asset FROM Asset asset WHERE asset.publicKey = :publicKey")
    Asset findByPublicKey(String publicKey);

}
