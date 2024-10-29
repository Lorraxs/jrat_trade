import { model, Schema } from "mongoose";
import type { ICandleData } from "../services/crypto/types/type";
import type { Binance } from "../services/crypto/types/binance.type";

const KlineSchema = new Schema<Binance.FormatedKline>({
  symbol: { type: String, required: true },
  takerBuyBaseAssetVolume: { type: String, required: true },
  close: { type: String, required: true },
  closeTime: { type: Number, required: true },
  high: { type: String, required: true },
  interval: { type: String, required: true },
  low: { type: String, required: true },
  open: { type: String, required: true },
  openTime: { type: Number, required: true },
  takerBuyQuoteAssetVolume: { type: String, required: true },
  numberOfTrades: { type: Number, required: true },
  volume: { type: String, required: true },
  quoteAssetVolume: { type: String, required: true },
});

KlineSchema.index({ symbol: 1, interval: 1, openTime: 1 }, { unique: true });

export const KlineModel = model<Binance.FormatedKline>("Kline", KlineSchema);
