import { model, Schema } from "mongoose";
import type { ICoinInfo } from "../services/crypto/types/type";

const CoinInfoSchema = new Schema<ICoinInfo>({
  baseAsset: { type: String, required: true },
  minQty: { type: Number, required: true },
  quoteAsset: { type: String, required: true },
  status: { type: String, required: true },
  symbol: { type: String, required: true, unique: true },
  tickSize: { type: Number, required: true },
});

export const CoinInfoModel = model<ICoinInfo>("CoinInfo", CoinInfoSchema);
