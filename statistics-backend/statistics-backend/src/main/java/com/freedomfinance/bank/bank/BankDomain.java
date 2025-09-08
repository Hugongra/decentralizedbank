package com.freedomfinance.bank.bank;

import com.freedomfinance.bank.common.controller.constants.XDomain;

public class BankDomain extends XDomain {

    public static final String name = "BANK";

    public static final String path = "/bank";


    public static class endpoint {
        public final static String
                TOKEN = "/token",
                ASSET = "/asset";
    }

}
