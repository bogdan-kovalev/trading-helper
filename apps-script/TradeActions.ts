import {DefaultStore} from "./Store";
import {TradeMemo, TradeState} from "./TradeMemo";
import {ExchangeSymbol} from "./TradeResult";

export class TradeActions {

  static buy(coinName: string): void {
    DefaultStore.changeTrade(coinName, trade => {
      const symbol = new ExchangeSymbol(coinName, DefaultStore.getConfig().StableCoin);
      trade.setState(TradeState.BUY);
      trade.tradeResult.symbol = symbol;
      return trade;
    })
  }

  static sell(coinName: string): void {
    DefaultStore.changeTrade(coinName, trade => {
      trade.setState(TradeState.SELL);
      return trade;
    });
  }

  static setHold(coinName: string, value: boolean): void {
    DefaultStore.changeTrade(coinName, trade => {
      trade.hodl = !!value;
      return trade;
    });
  }

  static drop(coinName: string): void {
    DefaultStore.changeTrade(coinName, trade => {
      if (trade.stateIs(TradeState.SOLD) || trade.stateIs(TradeState.BUY)) {
        trade.deleted = true;
        return trade;
      }
      Log.error(new Error(`Cannot drop ${coinName} as it is not sold`));
    });
  }

  static cancel(coinName: string): void {
    DefaultStore.changeTrade(coinName, trade => {
      trade.resetState();
      return trade;
    });
  }

  static replace(coinName: string, newTrade: TradeMemo): void {
    DefaultStore.changeTrade(coinName, trade => {
      if (trade.getCoinName() != newTrade.getCoinName()) {
        // if symbol changed, delete the old one
        // and reset prices in the new one
        newTrade.prices = [0, 0, 0];
        newTrade.stopLimitPrice = 0;
        DefaultStore.changeTrade(trade.getCoinName(), trade => {
          trade.deleted = true;
          return trade;
        });
      }
      return newTrade;
    });
  }
}