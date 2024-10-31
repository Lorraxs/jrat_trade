import { t, type Static } from "elysia";

export const tBroadcastMessage = t.Union([
  t.Object({
    channel: t.Literal("test"),
    time: t.Number(),
    data: t.Object({
      foo: t.Literal("bar"),
    }),
  }),
  t.Object({
    channel: t.Literal("order_blocks"),
    time: t.Number(),
    data: t.Array(
      t.Object({
        symbol: t.String(),
        interval: t.String(),
        orderBlocks: t.Array(
          t.Object({
            barHigh: t.Number(),
            barLow: t.Number(),
            barTime: t.Number(),
            bias: t.Number(),
          })
        ),
      })
    ),
  }),
  t.Object({
    channel: t.Literal("new_client"),
    time: t.Number(),
    data: t.Object({
      id: t.String(),
    }),
  }),
  t.Object({
    channel: t.Literal("new_kline"),
    time: t.Number(),
    data: t.Object({
      symbol: t.String(),
      interval: t.String(),
      openTime: t.Number(),
      open: t.String(),
      high: t.String(),
      low: t.String(),
      close: t.String(),
      volume: t.String(),
      closeTime: t.Number(),
      quoteAssetVolume: t.String(),
      numberOfTrades: t.Number(),
      takerBuyBaseAssetVolume: t.String(),
      takerBuyQuoteAssetVolume: t.String(),
      ignore: t.String(),
    }),
  }),
]);

export type IBroadcastMessage = Static<typeof tBroadcastMessage>;
