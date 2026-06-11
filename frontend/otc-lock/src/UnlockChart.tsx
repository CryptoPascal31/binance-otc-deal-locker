import type Decimal from "decimal.js"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./components/ui/chart"
import { Label, Pie, PieChart } from "recharts"
import { useAccountState, useGlobalState, type LockState } from "./hooks/locker"


export function UnlockChart({amount, total} : {amount:Decimal, total:Decimal}) {
  const chartData = [
    { name: "locked", value: total.minus(amount).toNumber(), fill: "var(--color-locked)" },
    { name: "unlocked", value: amount.toNumber(), fill: "var(--color-unlocked)" },
  ]

  const chartConfig = {
    locked: {
      label: "Locked",
      color: "var(--chart-2)",
    },
    unlocked: {
      label: "Unlock",
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
                          {amount.toFixed(1)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 12}
                          className="fill-muted-foreground text-xs"
                        >
                          {amount.mul(100).div(total).toFixed(1)}% of {total.toFixed(1)}
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


export function UnlockCharts({data}: {data:LockState}) {
  const {available, total, unlocked} = data
  return <div className="flex w-full ">
          <div className="flex flex-col h-full grow-1">
            <UnlockChart amount={unlocked} total={total} />
            <div className="text-center">Unlocked KDA </div>
          </div>
          <div className="flex flex-col h-full grow-1">
              <UnlockChart amount={available.plus(unlocked)} total={total} />
              <div className="text-center">Unlockable KDA </div>
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