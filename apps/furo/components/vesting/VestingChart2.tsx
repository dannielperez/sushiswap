import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/solid'
import { useInterval } from '@sushiswap/hooks'
import { ZERO } from '@sushiswap/math'
import { classNames, Popover, ProgressBar, ProgressColor, Typography } from '@sushiswap/ui'
import { format } from 'date-fns'
import { PeriodType, Vesting } from 'lib'
import { FC, useState } from 'react'

import { ChartHover } from '../../types'
import { Period, Schedule } from './createScheduleRepresentation'

interface VestingChart {
  vesting?: Vesting
  schedule?: Schedule
  hover?: ChartHover
  setHover?(x: ChartHover): void
}

const Timer: FC<{ date: Date }> = ({ date }) => {
  const [remaining, setRemaining] = useState<{ days: string; hours: string; minutes: string; seconds: string }>()

  useInterval(() => {
    const now = Date.now()
    const interval = date.getTime() - now

    const days = Math.floor(interval / (1000 * 60 * 60 * 24))
    const hours = Math.floor((interval % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((interval % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((interval % (1000 * 60)) / 1000)

    setRemaining({
      days: String(Math.max(days, 0)).padStart(2, '0'),
      hours: String(Math.max(hours, 0)).padStart(2, '0'),
      minutes: String(Math.max(minutes, 0)).padStart(2, '0'),
      seconds: String(Math.max(seconds, 0)).padStart(2, '0'),
    })
  }, 1000)

  return (
    <div className="flex justify-center gap-4 text-slate-200">
      <div className="flex flex-col text-center">
        <Typography variant="sm" weight={700} className="text-slate-200">
          {remaining?.days}
        </Typography>
        <Typography variant="xs" className="text-slate-400">
          days
        </Typography>
      </div>
      <div className="flex flex-col text-center">
        <Typography variant="sm" weight={700} className="text-slate-200">
          {remaining?.hours}
        </Typography>
        <Typography variant="xs" className="text-slate-400">
          hours
        </Typography>
      </div>
      <div className="flex flex-col text-center">
        <Typography variant="sm" weight={700} className="text-slate-200">
          {remaining?.minutes}
        </Typography>
        <Typography variant="xs" className="text-slate-400">
          min
        </Typography>
      </div>
      <div className="flex flex-col text-center">
        <Typography variant="sm" weight={700} className="text-slate-200">
          {remaining?.seconds}
        </Typography>
        <Typography variant="xs" className="text-slate-400">
          sec
        </Typography>
      </div>
    </div>
  )
}

const Block: FC<{ period: Period; length: number; className: string }> = ({ period, length, className }) => {
  const unlocked = period.date.getTime() < Date.now()
  const end = period.date.getTime()
  const start = end - length
  const now = Date.now()

  const progress = Math.min(Math.max(now - start, 0) / (end - start), 1)

  return (
    <Popover
      hover
      button={
        <div
          className={classNames(
            'w-full hover:ring-2 ring-offset-2 ring-offset-slate-900 ring-slate-700 relative bg-slate-800 rounded-xl flex flex-col gap-1 items-center justify-center h-30 p-4 pt-8'
          )}
        >
          <Typography variant="xxs" weight={700} className="text-slate-500 uppercase absolute top-2 left-3">
            {[PeriodType.STEP, PeriodType.END].includes(period.type) ? 'Payout' : 'Cliff End'}
          </Typography>
          {unlocked ? <LockOpenIcon width={24} /> : <LockClosedIcon width={24} />}
          <Typography variant="sm" weight={700} className="text-center text-slate-200 w-full truncate">
            {period.amount.toSignificant(4)}{' '}
            <span className="text-sm text-slate-400">{period.amount.currency.symbol}</span>
          </Typography>
          <Typography variant="xs" className="text-slate-500">
            {format(period.date, 'dd MMM yyyy')}
          </Typography>
          <div className="w-full mt-2">
            <ProgressBar
              showLabel={false}
              progress={progress}
              color={progress === 1 ? ProgressColor.GREEN : ProgressColor.BLUE}
            />
          </div>
        </div>
      }
      panel={
        <div className="flex flex-col bg-slate-700 p-3 gap-3">
          <Typography variant="xxs" weight={700} className="text-slate-300">
            Unlocks In
          </Typography>
          <Timer date={new Date(period.date.getTime())} />
        </div>
      }
    />
  )
}

const VestingChart2: FC<VestingChart> = ({ vesting, schedule, hover = ChartHover.NONE, setHover }) => {
  const [index, setIndex] = useState(0)

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-slate-800 z-10 rounded-2xl overflow-hidden">
        <div className="flex flex-col bg-gradient-to-b from-slate-800 via-slate-800 to-blue/25 h-[228px] items-center justify-center w-full">
          {[ChartHover.STREAMED, ChartHover.NONE].includes(hover) && (
            <div className="flex flex-col gap-3">
              <Typography variant="xs" className="uppercase text-center tracking-[0.2rem]">
                Streamed
              </Typography>
              <div className="flex flex-col gap-1">
                <Typography variant="h1" weight={700} className="text-slate-50 text-center">
                  {vesting?.streamedAmount?.toSignificant(6).split('.')[0]}
                  <Typography variant="h3" weight={700} className="text-slate-300" as="span">
                    .
                    {vesting?.streamedAmount?.greaterThan(ZERO)
                      ? vesting?.streamedAmount.toFixed(6).split('.')[1]
                      : '000000'}
                  </Typography>
                </Typography>
                <Typography variant="sm" className="text-slate-500" weight={700}>
                  / {vesting?.withdrawnAmount ? vesting.amount.toExact() : '0.000'} {vesting?.token.symbol} Total
                </Typography>
              </div>
            </div>
          )}
          {hover === ChartHover.WITHDRAW && (
            <div className="flex flex-col gap-3 justify-center">
              <Typography variant="xs" className="uppercase text-center tracking-[0.2rem]">
                Withdrawn
              </Typography>
              <div className="flex flex-col gap-1">
                <Typography variant="h1" weight={700} className="text-slate-50 text-center">
                  {vesting?.withdrawnAmount?.toSignificant(6).split('.')[0]}
                  <Typography variant="h3" weight={700} className="text-slate-300" as="span">
                    .
                    {vesting?.withdrawnAmount?.greaterThan(ZERO)
                      ? vesting?.withdrawnAmount.toFixed(6).split('.')[1]
                      : '000000'}
                  </Typography>
                </Typography>
                <Typography variant="sm" className="text-slate-500" weight={700}>
                  / {vesting?.amount.toExact() || '0.000'} {vesting?.token.symbol} Total
                </Typography>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col md:flex-row relative">
        {index > 0 && (
          <div className="hidden md:flex absolute -left-12 h-full items-center">
            <button className="cursor-pointer group p-1 bg-blue hover:bg-blue-400  rounded-full">
              <ChevronLeftIcon
                className="text-slate-200 hover:text-white"
                width={24}
                onClick={() => setIndex((prevState) => prevState - 1)}
              />
            </button>
          </div>
        )}
        <div className="order-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {schedule &&
            schedule.length > 1 &&
            schedule
              .slice(index + 1, index + 4)
              .map((period, index) => (
                <Block
                  period={period}
                  key={index}
                  length={period.date.getTime() - schedule[index].date.getTime()}
                  className="translate"
                />
              ))}
        </div>
        {schedule && index + 4 < schedule.length && (
          <div className="hidden md:flex absolute -right-12 h-full items-center">
            <button className="cursor-pointer group p-1 bg-blue hover:bg-blue-400 rounded-full">
              <ChevronRightIcon
                className="text-slate-200 hover:text-white"
                width={24}
                onClick={() => setIndex((prevState) => prevState + 1)}
              />
            </button>
          </div>
        )}
        <div className="mt-5 order-2 grid grid-cols-2 md:hidden gap-10 justify-center">
          <div className="flex justify-end">
            <button className="cursor-pointer group p-2 bg-blue hover:bg-blue-400 rounded-full">
              <ChevronLeftIcon
                className="text-slate-200 group-hover:text-white"
                width={24}
                onClick={() => setIndex((prevState) => prevState - 1)}
              />
            </button>
          </div>
          <div className="flex justify-start">
            <button className="cursor-pointer group p-2 bg-blue hover:bg-blue-400 rounded-full">
              <ChevronRightIcon
                className="text-slate-200 group-hover:text-white"
                width={24}
                onClick={() => setIndex((prevState) => prevState + 1)}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VestingChart2