import * as http from "http";
import { balance, trade, TradeSetup } from "./lib/bitmex/bitmex-client";
import { AsyncResult } from "./lib/result/async";
import { Ok, Err, Result } from "./lib/result";
import { tryCatch } from "./lib/result/try-catch";
import { validate } from "./lib/result/validate";
import { writeFileSync } from "fs";
import { now } from "./lib/time";

type TradeInput = {
	screenshot: string,
	entry: number,
	stop: number,
	tp: number,
	risk: number,
	reasoning: string,
};
let serverResponse: http.ServerResponse;
const server = http.createServer();

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Methods": "POST",
};

const serverResult = new AsyncResult<string, string>(resolve => {
	server.on("request", (req: http.IncomingMessage, res: http.ServerResponse) => {
		if (req.method === "OPTIONS") {
			res.writeHead(200, "OK", corsHeaders);
			res.end();
			return;
		}
		let rawData = "";
		req.on("data", chunk => {
			rawData += chunk;
		});
		req.on("end", () => resolve(Ok(rawData)));
		req.on("error", err => resolve(Err(err.message)));

		serverResponse = res;
	});
	server.listen(7777);
});

const isTradeInput = (obj: any): obj is TradeInput =>
	typeof obj === "object"
		&& obj !== null
		&& !Array.isArray(obj)
		&& "screenshot" in obj && typeof obj.screenshot === "string"
		&& "reasoning" in obj && typeof obj.reasoning === "string"
		&& "entry" in obj && typeof obj.entry === "number"
		&& "stop" in obj && typeof obj.stop === "number"
		&& "tp" in obj && typeof obj.tp === "number"
		&& "risk" in obj && typeof obj.risk === "number"
		
serverResult
	.andThen(payload => tryCatch(() => JSON.parse(payload), "Failed to parse payload"))
	.andThen(validate(isTradeInput, "Failed to parse trade input"))
	.andThenAsync<TradeSetup>(tradeInput => balance()
		.map(balance => {
			const setupId = now().toString();
			const { entry, tp, stop, risk, screenshot, reasoning } = tradeInput;
			const rr = (entry - tp) / (stop - entry);
			const side = entry > stop ? "long" : "short";
			// sizeBtc * (stop - entry) / stop = 0.01
			// sizeBtc = 0.01 * stop / (stop - entry)
			const amount = Math.round(balance * risk * stop * entry / Math.abs(stop - entry) / 1e10);
			return { setupId, side, entry, stop, tp, amount, rr, risk, screenshot, reasoning };	
		})
	)
	.map(tradeSetup => {
		const time = now().toString();
		writeFileSync(`trades/${time}.json`, JSON.stringify(tradeSetup, undefined, 2));
		return tradeSetup;
	})
	.andThenAsync(trade)
	.mapOrElse(err => {
		serverResponse.writeHead(400, "Bad request", corsHeaders);
		serverResponse.end(err);
	}, tradeResult => {
		serverResponse.writeHead(200, "OK", corsHeaders);
		serverResponse.end(JSON.stringify(tradeResult, undefined, 2));
	})
	.then(() => server.close())
	.start();
