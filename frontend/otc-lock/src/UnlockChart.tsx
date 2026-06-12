import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./components/ui/chart"
import { Label, Pie, PieChart } from "recharts"
import { useAccountState, useGlobalState, type LockState } from "./hooks/locker"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./components/ui/table"
import type Decimal from "decimal.js"


function UnlockChart({data}: {data:LockState}) {
  const {available, total, unlocked } = data
  const locked = total.minus(unlocked).minus(available)
  const chartData = [
    { name: "locked", value: locked.toNumber(), fill: "var(--color-locked)" },
    { name: "available", value: available.toNumber(), fill: "var(--color-available)" },
    { name: "unlocked", value: unlocked.toNumber(), fill: "var(--color-unlocked)" },
  ]

  const chartConfig = {
    locked: {
      label: "Locked/",
      color: "var(--chart-2)",
    },

    available: {
      label: "Availab/",
      color: "var(--color-green-500)",
    },

    unlocked: {
      label: "Unlocked/",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  return <ChartContainer config={chartConfig} className="mx-0 aspect-square max-h-[160px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData}
                 dataKey="value"
                 nameKey="name"
                 innerRadius={60}
                 outerRadius={80}
                 strokeWidth={0}
                 startAngle={90}
                 endAngle={-270}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 12}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {unlocked.toFixed(1)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 12}
                          className="fill-muted-foreground text-xs"
                        >
                          {unlocked.mul(100).div(total).toFixed(1)}% of {total.toFixed(1)}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
}

function UnlockTable({data}: {data:LockState}) {
  const {available, total, unlocked } = data
  const locked = total.minus(unlocked).minus(available)

  const Row = ({name, amount}: {name:string, amount:Decimal}) =>
    <TableRow>
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell className="text-right">{amount.toFixed(4)}</TableCell>
    </TableRow>

  return <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead className="text-right">KDA</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <Row name="Unlocked" amount={unlocked} />
            <Row name="Available" amount={available} />
            <Row name="Locked" amount={locked} />
          </TableBody>

          <TableFooter>
            <Row name="Total" amount={total} />
          </TableFooter>
        </Table>

}
function UnlockCharts({data}: {data:LockState}) {
  return <div className="flex w-full h-45 ">
            <div className="flex flex-col h-full grow-1">
              <UnlockChart data={data} />
              <div className="text-center">Amounts in KDA </div>
            </div>

            <div className="flex flex-col h-full grow-2 hidden md:block">
              <UnlockTable data={data} />
            </div>
        </div>
}

export function GlobalUnlockCharts() {
  const data = useGlobalState()

  return data ? <UnlockCharts data={data} /> : null
}

export function AccountUnlockCharts({account} : {account: string | undefined}) {
  const data = useAccountState(account)

  return data ? <UnlockCharts data={data} /> : null
}