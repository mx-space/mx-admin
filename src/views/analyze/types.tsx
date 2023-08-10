export interface IPAggregate {
  today: Today[]
  weeks: Week[]
  months: Month[]
  paths: Path[]
  total: Total
  todayIps: string[]
}
export interface Month {
  date: string
  key: Key
  value: number
}
export interface Path {
  count: number
  path: string
}
export interface Today {
  hour: string
  key: Key
  value: number
}
export interface Total {
  callTime: number
  uv: number
}
export interface Week {
  day: string
  key: Key
  value: number
}

export enum Key {
  IP = 'ip',
  PV = 'pv',
}
