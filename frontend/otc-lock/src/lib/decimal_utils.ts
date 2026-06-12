import Decimal from "decimal.js"

const MILLION = Decimal(1000000)
const THOUSAND = Decimal(1000)
const ONE = Decimal(1)

export function formatCompactKda(x:Decimal) : string {

  const suffix = x.gte(MILLION)  ? "M"
               : x.gte(THOUSAND) ? "k"
               : ""

  const divider = x.gte(MILLION)  ? MILLION
                : x.gte(THOUSAND) ? THOUSAND
                : ONE

  return x.toSignificantDigits(4).div(divider).toString()+suffix
}
