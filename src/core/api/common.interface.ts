export interface IAccessToken {
  accessToken: string
}

export type JsonObject<TValue = any> = Record<string, TValue>

export interface EsAggValue<TValue = any> {
  value: TValue
}
