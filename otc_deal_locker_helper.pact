(module otc-deal-locker-helper GOV
  @doc "A frontend to create multiple lock accounts"
  (use free.util-math)

  (defcap GOV:bool ()
    (enforce-keyset "NS.admin"))

  (defschema lock-info-sch
    account:string
    amount:decimal
  )

  ; Locked accounts
  (defcap HELPER-ACCOUNT-CAP ()
    true)

  (defconst HELPER-ACCOUNT-GUARD (create-capability-guard (HELPER-ACCOUNT-CAP)))

  (defconst HELPER-ACCOUNT (create-principal HELPER-ACCOUNT-GUARD))

  (defun create-locks-batch:bool (from:string locks:[object{lock-info-sch}])
    @doc "Helper to create multiple locks at aonce"

    ; Transfer the total to the helper account
    (coin.transfer-create from HELPER-ACCOUNT HELPER-ACCOUNT-GUARD (sum (map (at'amount) locks)))

    ; Then transfer all locks
    (map (lambda (lock) (bind lock {'account:=acct, 'amount:=am}
                          (install-capability (coin.TRANSFER HELPER-ACCOUNT (otc-deal-locker.locked-account-principal acct) am))
                          (with-capability (HELPER-ACCOUNT-CAP)
                            (otc-deal-locker.create-lock HELPER-ACCOUNT acct am))))
          locks)
    true
  )

)