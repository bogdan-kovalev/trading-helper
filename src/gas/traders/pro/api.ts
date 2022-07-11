import { IStore } from "../../../lib/index"
import { TradeActions } from "../../TradeActions"

export const PriceChannelDataKey = `ChannelData`

export interface TraderPlugin {
  trade(context: TradingContext): void
}

export interface TradingContext {
  store: IStore
  tradeActions: TradeActions
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TradingResult {}