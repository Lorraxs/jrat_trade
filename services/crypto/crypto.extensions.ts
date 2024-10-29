import type { interfaces } from "inversify";
import type { ServicesContainer } from "../../utils/servicesContainer";
import type { WsMarketStreamManager } from "./providers/binance/stream";
import type { ExchangeInfo } from "./exchangeInfo";
import type { Symbol as zSymbol } from "./symbol";

export const ExchangeProvider = Symbol("ExchangeProvider");
export interface ExchangeProvider {
  name: string;
  wsMarketStreamManager: WsMarketStreamManager;
  exchangeInfo: ExchangeInfo;
  symbols: Set<zSymbol>;
  getSymbols(): void;
  init(options: ExchangeProviderOptions): void;
  testMode: boolean;
}

export interface ExchangeProviderOptions {
  test?: boolean;
}

export function registerExchangeProvider(
  container: ServicesContainer,
  service: interfaces.Newable<ExchangeProvider>
) {
  container.registerImpl(ExchangeProvider, service);
}
