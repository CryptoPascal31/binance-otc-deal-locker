(module gas-station GOV

  (implements gas-payer-v1)
  (use coin)
  (use free.util-chain-data)

  (defconst GAS_LIMIT 850)
  (defconst GAS_PRICE 0.00000001)

  (defconst CODE:[string] ["(NS.otc-deal-locker.unlock (read-string 'account))"])

  (defconst GAS_ACCOUNT:string (create-principal (create-gas-payer-guard)))

  (defcap GOV:bool ()
    (enforce-keyset "NS.admin"))

  (defun try-available:decimal (account:string)
    (try 0.0 (NS.otc-deal-locker.account-available account)))

  (defun is-participant:bool (user:string)
    (!= 0.0 (try-available user)))

  (defun env-account:string ()
    (at'account (read-msg 'exec-user-data)))

  (defcap GAS_PAYER:bool (user:string limit:integer price:decimal)
    ; Check gas conditions
    (enforce (and? (= (gas-limit)) (>= GAS_LIMIT) limit)  "Invalid gas limit")

    (enforce (and? (= (gas-price)) (>= GAS_PRICE) price)  "Invalid gas price")

    ; Check code
    (enforce (= "exec" (read-msg 'tx-type)) "Wrong transaction type")
    (enforce (= CODE (read-msg 'exec-code)) "Wrong code")

    (enforce (and? (= (env-account)) (!= NS.otc-deal-locker.EMPTY) user) "Invalid Account")
    (enforce (is-participant user) "Account not in deal")

    (compose-capability (ALLOW_GAS))
  )

  (defcap ALLOW_GAS () true)

  (defun create-gas-payer-guard:guard ()
    (create-user-guard (payer))
  )

  (defun payer ()
    (require-capability (GAS))
    (require-capability (ALLOW_GAS))
  )

  (defun init ()
    (create-account GAS_ACCOUNT (create-gas-payer-guard)))
)
