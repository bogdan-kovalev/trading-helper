import Integer = GoogleAppsScript.Integer
import { Log, SECONDS_IN_HOUR } from "./Common"

const MAX_CACHE_VAL_SIZE_BYTES = 100 * 1024

function byteCount(s: string): number {
  return encodeURI(s).split(/%..|./).length - 1
}

export class CacheProxy {
  static readonly StableCoins = `StableCoins`

  static get(key: string): string | null {
    return CacheService.getScriptCache().get(key)
  }

  /**
   * @param key
   * @param value
   * @param expirationInSeconds By default, keep for 6 hours (maximum time allowed by GAS)
   */
  static put(key: string, value: string, expirationInSeconds: Integer = SECONDS_IN_HOUR * 6): void {
    const size = byteCount(value)
    if (size > 0.9 * MAX_CACHE_VAL_SIZE_BYTES) {
      Log.info(
        `Cache value for key ${key} is more than 90% of the maximum size of ${MAX_CACHE_VAL_SIZE_BYTES} bytes.`,
      )
    }
    if (size > MAX_CACHE_VAL_SIZE_BYTES) {
      const error = new Error(
        `Cache value for ${key} is too large: ${size} bytes. Max size is ${MAX_CACHE_VAL_SIZE_BYTES} bytes.`,
      )
      Log.error(error)
      throw error
    }
    // Log.debug(`Value for key ${key} is ${size} bytes. Which is ${Math.round(size / MAX_CACHE_VAL_SIZE_BYTES * 100)}% of the maximum.`);
    CacheService.getScriptCache().put(key, value, expirationInSeconds)
  }

  static remove(key: string): void {
    CacheService.getScriptCache().remove(key)
  }
}
