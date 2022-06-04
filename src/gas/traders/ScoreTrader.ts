import { IStore } from "../Store"
import { TradeActions } from "../TradeActions"
import { CoinScore, TradeMemo, TradeState } from "trading-helper-lib"
import { IScores } from "../Scores"

export class ScoreTrader {
  private readonly store: IStore
  private readonly scores: IScores

  constructor(store: IStore, scores: IScores) {
    this.store = store
    this.scores = scores
  }

  /**
   * If {@link AutoTradeBestScores} is enabled, get recommended coins from scores and
   * if they are not already in the portfolio, buy them.
   * Coins that are sold and not in the recommended list are removed from the portfolio.
   */
  trade(): void {
    const tradeBestScores = this.store.getConfig().AutoTradeBestScores
    if (tradeBestScores) {
      const scoresData = this.scores.get()
      if (!scoresData.realData) return

      const recommended = scoresData.recommended.slice(0, tradeBestScores)

      // buy new coins from recommended list
      const tradeActions = TradeActions.default()
      recommended
        .filter((cs) => !this.store.hasTrade(cs.coinName))
        .forEach((cs) => tradeActions.buy(cs.coinName))

      // remove sold coins that are not in the recommended list
      this.store
        .getTradesList(TradeState.SOLD)
        .filter((tm) => !this.isRecommended(recommended, tm))
        .forEach((tm) => tradeActions.drop(tm.getCoinName()))

      // cancel buying coins that are no longer in the recommended list
      this.store
        .getTradesList(TradeState.BUY)
        .filter((tm) => !this.isRecommended(recommended, tm))
        .forEach((tm) => tradeActions.cancel(tm.getCoinName()))
    }
  }

  private isRecommended(recommended: CoinScore[], tm: TradeMemo) {
    return recommended.find((cs) => cs.coinName === tm.getCoinName())
  }
}