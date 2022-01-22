interface IExchange {
  getFreeAsset(asset: string): number

  marketBuy(assetName: string, moneyCoin: string, qty: string): TradeResult

  marketSell(assetName: string, moneyCoin: string): TradeResult

  getPrice(assetName: string, moneyCoin: string): number
}

class Binance implements IExchange {
  private static readonly API = "https://api.binance.com/api/v3";
  private readonly key: string;
  private readonly secret: string;
  private readonly tradeReqParams: object;
  private readonly reqParams: object;

  constructor(store: IStore) {
    this.key = store.get('KEY')
    this.secret = store.get('SECRET')
    this.tradeReqParams = {method: 'post', headers: {'X-MBX-APIKEY': this.key}}
    this.reqParams = {headers: {'X-MBX-APIKEY': this.key}}
  }

  getPrice(assetName: string, moneyCoin: string): number {
    const resource = "ticker/price"
    const query = `symbol=${assetName}${moneyCoin}`;
    const data = execute({
      context: null,
      interval: 500,
      attempts: 20,
      runnable: ctx => UrlFetchApp.fetch(`${Binance.API}/${resource}?${query}`, this.reqParams)
    });
    Log.debug(data.getContentText())
    return +JSON.parse(data.getContentText()).price
  }

  getFreeAsset(asset: string): number {
    const resource = "account"
    const query = "";
    const data = execute({
      context: null, interval: 200, attempts: 50,
      runnable: ctx => UrlFetchApp.fetch(`${Binance.API}/${resource}?${this.addSignature(query)}`, this.reqParams)
    });
    try {
      const account = JSON.parse(data.getContentText());
      const assetVal = account.balances.find((balance) => balance.asset == asset);
      Log.debug(assetVal)
      return assetVal ? +assetVal.free : 0
    } catch (e) {
      Log.error(e)
    }
    return 0
  }

  marketBuy(assetName: string, moneyCoin: string, qty: string): TradeResult {
    const freeAsset = this.getFreeAsset(moneyCoin)
    if (!freeAsset || (+freeAsset < +qty)) {
      return TradeResult.fromMsg(`${assetName}${moneyCoin}`, `NOT ENOUGH TO BUY: ${moneyCoin}=${freeAsset}`)
    }
    const query = `symbol=${assetName}${moneyCoin}&type=MARKET&side=BUY&quoteOrderQty=${qty}`;
    const tradeResult = this.marketTrade(query);
    tradeResult.cost *= -1
    return tradeResult;
  }

  marketSell(assetName: string, moneyCoin: string): TradeResult {
    const freeAsset = this.getFreeAsset(assetName)
    if (!freeAsset || (+freeAsset < 1)) {
      return TradeResult.fromMsg(`${assetName}${moneyCoin}`, `NOT ENOUGH TO SELL: ${assetName}=${freeAsset}`)
    }
    const query = `symbol=${assetName}${moneyCoin}&type=MARKET&side=SELL&quantity=${freeAsset}`;
    return this.marketTrade(query);
  }

  marketTrade(query: string): TradeResult {
    const response = execute({
      context: null, interval: 200, attempts: 50,
      runnable: ctx => UrlFetchApp.fetch(`${Binance.API}/order?${this.addSignature(query)}`, this.tradeReqParams)
    });
    Log.debug(response.getContentText())
    try {
      const order = JSON.parse(response.getContentText());
      const tradeResult = new TradeResult();
      const price = order.fills && order.fills[0] && order.fills[0].price
      tradeResult.cost = +order.cummulativeQuoteQty
      tradeResult.price = +price
      tradeResult.symbol = order.symbol
      tradeResult.succeeded = true
      return tradeResult;
    } catch (e) {
      Log.error(e)
      throw e
    }
  }

  private addSignature(data: string) {
    const timestamp = Number(new Date().getTime()).toFixed(0);
    const sigData = `${data}${data ? "&" : ""}timestamp=${timestamp}`
    const sig = Utilities.computeHmacSha256Signature(sigData, this.secret).map(e => {
      const v = (e < 0 ? e + 256 : e).toString(16);
      return v.length == 1 ? "0" + v : v;
    }).join("")

    return `${sigData}&signature=${sig}`
  }
}
