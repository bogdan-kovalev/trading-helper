import {CoinStats} from "./CoinStats";
import {Binance, IExchange} from "./Binance";
import {Config} from "./Store";
import {ExchangeSymbol, PriceProvider, TradeResult} from "./TradeResult";
import {CacheProxy} from "./CacheProxy";

export class Exchange implements IExchange {
  private readonly exchange: Binance;
  private priceProvider: CoinStats;

  constructor(config: Config) {
    this.exchange = new Binance(config);

    switch (config.PriceProvider) {
      case PriceProvider.Binance:
        this.priceProvider = this.exchange;
        break;
      case PriceProvider.CoinStats:
        this.priceProvider = new CoinStats();
        break;
      default:
        Log.error(new Error(`Unknown price provider: ${config.PriceProvider}. Using Binance as price provider.`));
        this.priceProvider = this.exchange;
    }

  }

  getFreeAsset(assetName: string): number {
    return this.exchange.getFreeAsset(assetName);
  }

  getPrice(symbol: ExchangeSymbol): number {
    return this.priceProvider.getPrice(symbol);
  }

  getPrices(): { [p: string]: number } {
    const pricesJson = CacheProxy.get("Prices");
    let prices = pricesJson ? JSON.parse(pricesJson) : null;
    if (!prices) {
      prices = this.priceProvider.getPrices();
      CacheProxy.put("Prices", JSON.stringify(prices), 45); // cache for 45 seconds
    }
    return prices;
  }

  marketBuy(symbol: ExchangeSymbol, cost: number): TradeResult {
    return this.exchange.marketBuy(symbol, cost);
  }

  marketSell(symbol: ExchangeSymbol, quantity: number): TradeResult {
    return this.exchange.marketSell(symbol, quantity);
  }
}
