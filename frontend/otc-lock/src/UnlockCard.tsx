import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAccountState, useGlobalState, useUnlockTxBuilder } from "./hooks/locker"
import useLocalStorage from "use-local-storage";
import { useState } from "react"
import { VIRTUAL_SIGNER } from "./lib/virtual_signer"
import { statusChecked, submit } from "./hooks/local-pact"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./components/ui/alert"
import { Spinner } from "./components/ui/spinner"
import { AlertCircleIcon, ExternalLink, X } from "lucide-react"
import { AccountUnlockCharts, GlobalUnlockCharts } from "./UnlockChart"
import { Separator } from "./components/ui/separator"
// @ts-ignore
import {useTimeout} from 'react-use-timeout';
import { EXPLORER } from "./lib/constants"
import { is_blacklisted } from "./lib/blacklist"


const ExplorerLink= ({txHash} : {txHash:string | null}) => txHash ? <a target="_blank" href={`${EXPLORER}/tx/${txHash}`}> <ExternalLink /></a> : null


type TransactionState = null | "SUBMITTED" | "CONFIRMED" | "ERROR"

function DoUnlockButton({account}: {account:string | null})
{
  const {data:lockState, mutate} = useAccountState(account)
  const {mutate:globalMutate} = useGlobalState()
  const txBuilder = useUnlockTxBuilder()
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txState, setTxState] = useState<TransactionState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cleanTx = () => {setTxHash(null); setTxState(null); setError(null);}
  const clearTimeout = useTimeout(cleanTx, 300_000)

  console.log(EXPLORER)

  const msg = lockState ? `Unlock ${lockState.available.toFixed(6)} KDA` : "Invalid account"

  const doSubmit = () => {cleanTx(); clearTimeout.stop();
                          VIRTUAL_SIGNER(txBuilder!(account!))
                          .then(submit)
                          .then((x) => {setTxHash(x.requestKey); setTxState("SUBMITTED"); return x})
                          .then(statusChecked)
                          .then(() => {setTxState("CONFIRMED"); mutate(); globalMutate()})
                          .catch((e) => {setTxState("ERROR"); setError(e.toString())})
                          .then(() => clearTimeout.start())}

  const ClearButton = () => <Button size="xs" variant="default" onClick={cleanTx}>
                              <X />
                            </Button>

  return <div className="flex flex-col gap-y-2 items-center">
            <Button className="w-xs md:w-sm shadow-sm" variant="default" type="button"
                    disabled={!!txState || !lockState || lockState.available.isZero() || !txBuilder} onClick={doSubmit}>
              {msg}
            </Button>

            {txState == "SUBMITTED" &&  <Alert>
                                          <Spinner /> <AlertTitle>Transaction submitted</AlertTitle>
                                          <AlertDescription> Waiting for confirmation </AlertDescription>
                                        </Alert>}

            {txState == "CONFIRMED" &&  <Alert className="bg-green-50">
                                            <AlertTitle>Transaction confimed</AlertTitle>
                                            <AlertDescription>
                                                <div className="flex gap-x-2">
                                                  <span> {txHash}</span> <ExplorerLink txHash={txHash}/>
                                                </div>
                                            </AlertDescription>
                                            <AlertAction>
                                              <ClearButton />
                                            </AlertAction>
                                        </Alert>}

            {txState == "ERROR" &&      <Alert variant="destructive" >
                                            <AlertCircleIcon /> <AlertTitle>Error</AlertTitle>
                                            <AlertDescription> {error} </AlertDescription>
                                            <AlertAction>
                                              <ClearButton />
                                            </AlertAction>
                                        </Alert>}

          </div>


}


const DisabledAlert = () =>
  <Alert variant="destructive" >
    <AlertCircleIcon /> <AlertTitle>Frontend disabled</AlertTitle>
    <AlertDescription> Frotend has been temporarily disabled </AlertDescription>
  </Alert>


export function UnlockCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [account, setAccount] = useLocalStorage<string>("account", "");

  return (
    <div className={cn("flex flex-col gap-6 min-w-sm md:min-w-2xl", className)} {...props}>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Kadena Binance OTC Deal</CardTitle>
          <CardDescription>
            Unlock contract
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-5">
        <GlobalUnlockCharts />
        <Separator orientation="horizontal" />
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="account">Enter your Kadena account below to unlock your tokens:</FieldLabel>
                <Input id="account" placeholder="k:xxxxxxxxxxxxx" value={account} required onChange={ev => setAccount(ev.target.value)} />
              </Field>
            </FieldGroup>
          </form>
          <AccountUnlockCharts account={account} />
          {is_blacklisted(account) ? <DisabledAlert /> :  <DoUnlockButton account={account} />}
        </CardContent>
      </Card>
    </div>
  )
}
