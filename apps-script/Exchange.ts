import {CoinStats} from "./CoinStats";
import {Binance} from "./Binance";
import {Config} from "./Store";
import {ExchangeSymbol, PriceProvider, TradeResult} from "./TradeResult";
import {CacheProxy} from "./CacheProxy";
import {StableUSDCoin} from "./shared-lib/types";

export interface IExchange {
  getFreeAsset(assetName: string): number

  marketBuy(symbol: ExchangeSymbol, cost: number): TradeResult

  marketSell(symbol: ExchangeSymbol, quantity: number): TradeResult

  getPrices(): { [p: string]: number }

  getPrice(symbol: ExchangeSymbol): number
}

export interface IPriceProvider {
  getPrices(): { [p: string]: number }
}

export class Exchange implements IExchange {
  private readonly exchange: IExchange;
  private readonly stableCoin: StableUSDCoin;
  private priceProvider: IPriceProvider;

  constructor(config: Config) {
    this.exchange = new Binance(config);
    this.stableCoin = config.StableCoin;

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
    return this.getPrices()[symbol.toString()];
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

  getCoinNames(): string[] {
    const coinNames = [];
    Object.keys(this.exchange.getPrices()).forEach(symbol => {
      if (symbol.endsWith(this.stableCoin)) {
        coinNames.push(symbol.split(this.stableCoin)[0]);
      }
    });
    return coinNames;
  }
}
