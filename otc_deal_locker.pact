(module otc-deal-locker GOV

  (use free.util-math)
  (use free.util-time)

  (defconst FROZEN-MODULE true)

  (defcap GOV:bool ()
    (enforce (not FROZEN-MODULE) "Governance locked")
    (enforce-keyset "NS.admin"))

  (defschema global-sch
    virtual-start-time:time ; It's called virtual because adjusted according to initial unlock
    beta:decimal ; Unlock ratio-rate /second
  )

  (defschema account-sch
    total:decimal ; Total locked
    unlocked:decimal ; Previously already unlocked
  )

  (deftable global-table:{global-sch})

  (deftable account-table:{account-sch})
  ; IMPORTANT NOTE , as a convention, empty account (ie "") represents sums of Data (for stats)
  (defconst EMPTY "")

  ; Locked accounts
  (defcap LOCKED-ACCOUNT-CAP (account:string)
    true)

  (defun locked-account-guard:guard (account:string)
    (create-capability-guard (LOCKED-ACCOUNT-CAP account)))

  (defun locked-account-principal:string (account:string)
    (create-principal (locked-account-guard account)))

  ;Some events to be emitted
  (defcap LOCK (account:string amount:decimal)
    @event
    true)

  (defcap UNLOCK (account:string amount:decimal)
    @event
    true)

  (defun account-exists:bool (account:string)
    @doc "Does a coin account exist ?"
    (!= -1.0 (try -1.0 (coin.get-balance account))))

  (defun with-cap:decimal (x:decimal)
    @doc "Cap an amount to 1.0"
    (min 1.0 x))

  ; This is where we define our linear model
  ; -----------------------------------------------
  ; Unlock-ratio = (t - T0) * Beta,  capped to 100%
  ; ------------------------------------------------
  ;
  ; T0 being the virtual start time
  ;
  ; Note: The trick here is to have the virtual-start-time shifted in the past to allow
  ;       immediate unlock.
  (defun unlock-ratio:decimal ()
    @doc "Return the current global unlock ratio"
    (with-read global-table "" {'virtual-start-time:=start-time, 'beta:=beta}
      (with-cap (* beta (diff-time (now) start-time)))))

  (defun unlockable-amount:decimal (total:decimal)
    @doc "Absolute unlockable amount based on a total amount"
    (floor (* total (unlock-ratio))
           (coin.precision)))

  (defun account-available:decimal (account:string)
    @doc "Amount available for an account: (ie Unlockable but not already withdrawn)"
    (with-read account-table account {'total:=total, 'unlocked:=unlocked}
      (- (unlockable-amount total) unlocked)))

  (defun account-state:object (account:string)
    @doc "Return state for an account (for Frontend)"
    (+ {'available: (account-available account)}
       (read account-table account)))

  (defun global-state:object ()
    @doc "Return global state (for Frontend)"
    (account-state EMPTY))

  (defun enforce-no-empty-account:bool (account:string)
    @doc "Pure form sanity check, since coin refuses empty account anyway"
    (enforce (!= EMPTY account) "Empty account is reserved"))


  (defun unlock:bool (account:string)
    @doc "Main function to withdraw available unlocked amount for an account"

    (enforce-no-empty-account account)

    (let ((amount (account-available account)))
      (install-capability (coin.TRANSFER (locked-account-principal account) account amount))
      ; Assume account already exists at this point
      (with-capability (LOCKED-ACCOUNT-CAP account)
        (coin.transfer (locked-account-principal account) account amount))

      ; Increase user already unlocked amount
      (with-read account-table account {'unlocked:=unlocked}
        (update  account-table account {'unlocked:(+ amount unlocked)}))

      ; Increase global already unlocked amount
      (with-read account-table EMPTY {'unlocked:=unlocked}
        (update  account-table EMPTY {'unlocked:(+ amount unlocked)}))
      (emit-event (UNLOCK account amount)))
  )


  (defun create-lock:bool (from:string account:string amount:decimal)
    @doc "Admin function to create a lock and transfer money for an account"
    ; Should this function be restricted ?
    ;   - Theoritically, no
    ;   - But practically, it would avoid morons playing with this for fun

    (enforce-no-empty-account account)

    ; Check first that target account exist; before creating a lock
    ; because it's assumed in the unlock function
    (enforce (account-exists account) (format "{} doesn't exist" [account]))

    ; We assume that the caller already set-up the managed cap
    (coin.transfer-create from (locked-account-principal account) (locked-account-guard account) amount)

    ; Wa assume that no previous lock already exists for this account => No multiple locks per account
    (insert account-table account {'total:amount, 'unlocked:0.0})

    ; Increase global (total) amount
    (with-read account-table EMPTY {'total:=total}
      (update  account-table EMPTY {'total:(+ amount total)}))

    (emit-event (LOCK account amount))
  )


  ; Let's call initial-delivery-ratio R
  ; T0 being the virtual-start-time
  ; Delta_t the total deal duration
  ;
  ; Linear formula: see above
  ;    Unlock-ratio = y(t) = (t - T0) * Beta,  capped to 100%
  ;
  ; We have:
  ;  - y(NOW + Delta_t) = (NOW + Delta_t - T0) * Beta = 1.0 (end of deal condition)
  ;  - y(NOW) = (NOW - To ) * Beta = R  (initial deal conditions)
  ;
  ; With some basic linear math, this leads to:
  ; Beta  =  (1 - R) / Delta_t
  ; T0 = NOW - (R / Beta)
  (defun init:string (R:decimal delta-T-days:decimal)
    (with-capability (GOV)
      (let ((beta (/ (- 1.0 R)
                     (days delta-T-days)))

            (t0 (from-now (/ (- R)
                             beta))))

        ; Init the settings table
        (insert global-table "" {'virtual-start-time:t0,
                                 'beta:(round beta 18)}))
      ; Init the EMPTY (global) account
      (insert account-table EMPTY {'total:0.0, 'unlocked:0.0}))
  )


)