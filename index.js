import KrakenClient from "kraken-api";
import Functions from "firebase-functions";

const PX = 0.3;

const trade = async (client, pair, volume, price, close) => {
  const order = {
    pair: pair,
    type: "buy",
    ordertype: "limit",
    oflags: "post",
    volume: String(volume),
    price: String(price),
  };
  if (close) {
    order["close[ordertype]"] = "limit";
    order["close[price]"] = String(close);
  }
  const request = await client.api("AddOrder", order);
  console.info(request["result"]["descr"]["order"]);
};

export const schedule = Functions.runWith({
  secrets: ["KRAKEN_API_KEY", "KRAKEN_API_SECRET"],
})
  .pubsub.schedule("every 10 minutes")
  .onRun(async (_) => {
    const client = new KrakenClient(
      process.env.KRAKEN_API_KEY,
      process.env.KRAKEN_API_SECRET
    );
    const orders = await client.api("OpenOrders");
    if (Object.keys(orders["result"]["open"]).length < 1) {
      const pair = "ALGOUSD";
      const value = 4000;
      const volume = (value / PX).toFixed();
      const close = (PX * 1.01).toFixed(5);
      trade(client, pair, volume, PX, close);
    }
  });
