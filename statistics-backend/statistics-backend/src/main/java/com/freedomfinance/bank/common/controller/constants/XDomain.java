package com.freedomfinance.bank.common.controller.constants;

public class XDomain {

    public static class role {
        public final static String
                ADMIN = "/admin",
                PUBLIC = "/public",
                PRIVATE = "/private";
    }

    public static class pathParam {
        public final static String

                LOG_ID = "/{logId}",
                BANK_PUBLIC_KEY = "/{bankPublicKey}",
                ASSET_PUBLIC_KEY = "/{assetPublicKey}",
                USER_PUBLIC_KEY = "/{userPublicKey}",
                BORROW_PUBLIC_KEY = "/{borrowPublicKey}",
                DEPOSIT_PUBLIC_KEY = "/{depositPublicKey}",
                LIST = "/list",
                FIND = "/find",
                LAST = "/last",
                RECORD ="/record";
    }

}
