dnl To be runned using m4 -DINIT deploy_tx.m4 > deploy_tx.pact
dnl Then the final tx can be generated using kda gen -t deploy_tx.tkpl -d config_mainnet.yaml

changequote([[,]])dnl
define(NS, [[n_a93d47fd937a5d0899c9385763d5b1c4056842c5]])dnl
dnl caller should define init

(namespace "NS")

include([[../otc_deal_locker.pact]])

ifdef([[INIT]],
  (create-table global-table)
  (create-table account-table)
) dnl

include([[../otc_deal_locker_helper.pact]])

include([[../gas-station.pact]])

ifdef([[INIT]],
  (init)
) dnl
