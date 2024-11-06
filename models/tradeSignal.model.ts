import { model, Schema } from "mongoose";
import type { TradeSignal } from "../services/crypto/types/type";

const TradeSignalSchema = new Schema<TradeSignal>({
  hash: { type: String, required: true, unique: true },
  symbol: { type: String, required: true },
  interval: { type: String, required: true },
  bias: { type: Number, required: true },
  barHigh: { type: Number, required: true },
  barLow: { type: Number, required: true },
  barTime: { type: Number, required: true },
});

export const TradeSignalModel = model<TradeSignal>(
  "TradeSignal",
  TradeSignalSchema
);
