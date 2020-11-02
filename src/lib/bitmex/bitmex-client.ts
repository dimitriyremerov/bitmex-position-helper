import { now } from "../time";
import * as https from "https";
import * as crypto from "crypto";
import { AsyncResult } from "../result/async";
import { Ok, Err } from "../result";
import { tryCatch } from "../result/try-catch";
import { JsonArray, JsonObject } from "../json";

const hostname = "www.bitmex.com";
const apiKey = "FIXME";
const apiSecret = "FIXME";
const apiRoot = "/api/v1/";
const instrument = "XBTUSD";

export type TradeSetup = {
	setupId: string,
	entry: number,
	stop: number,
	tp: number,
	rr: number,
	side: "long" | "short",
	risk: number,
	amount: number,
	screenshot: string,
	reasoning: string,
};

export const trade = (setup: TradeSetup): AsyncResult<JsonArray, string> => {
	const { entry, stop, tp, amount, setupId } = setup;
	if (amount > 50000) {
		throw "Error of some kind";
	}
	const expires = now() + 5;
	const verb = "POST";
	const endpoint = "order/bulk";
	const side = entry > stop ? "Buy" : "Sell";
	const sideClose = entry > stop ? "Sell" : "Buy";
	const orders = [
		{
			symbol: instrument,
			side: side,
			orderQty: amount,
			price: entry,
			ordType: "Limit",
			clOrdID: setupId + "-entry",
		},
		{
			symbol: instrument,
			side: sideClose,
			orderQty: amount,
			stopPx: stop,
			ordType: "Stop",
			execInst: "ReduceOnly,MarkPrice",
			clOrdID: setupId + "-stop",
		},
		{
			symbol: instrument,
			side: sideClose,
			orderQty: amount,
			price: tp,
			stopPx: entry + Math.sign(entry - tp) * 0.5,
			execInst: "ReduceOnly,LastPrice",
			ordType: "StopLimit",
			clOrdID: setupId + "-tp",
		}
	];
	const postData = JSON.stringify({ orders });
	const signature = sign(verb, endpoint, "", expires, postData);
	const headers = {
		"content-type": "application/json",
		"content-length": Buffer.byteLength(postData),
		"accept": "application/json",
		"api-expires": expires,
		"api-key": apiKey,
		"api-signature": signature,
	};
	
	const options = {
		hostname,
		path: apiRoot + endpoint,
		method: "POST",
		headers,
	};

	return (new AsyncResult<string, string>(_resolve => {
		const req = https.request(options, msg => {
			const { statusCode } = msg;
			const resolve = (data: string) =>
				statusCode === 200 ?  _resolve(Ok(data)): _resolve(Err(data));
		  
			msg.setEncoding("utf8");
			let rawData = "";
			msg.on("data", chunk => rawData += chunk);
			msg.on("end", () => resolve(rawData));
		});
		req.on("error", e => _resolve(Err(e.message)));
		req.write(postData);
		req.end();
	})).andThen(returnData => tryCatch(
		() => JSON.parse(returnData) as JsonArray,
		"Failed to parse response"
	));
};

export const balance = (): AsyncResult<number, string> => {
	const expires = now() + 5;
	const verb = "GET";
	const endpoint = "user/margin";
	const query = "?currency=XBt";
	const signature = sign(verb, endpoint, query, expires, "");
	const headers = {
		"content-type": "application/json",
		"accept": "application/json",
		"api-expires": expires,
		"api-key": apiKey,
		"api-signature": signature,
	};
	const url = "https://" + hostname + apiRoot + endpoint + query;

	return (new AsyncResult<string, string>(resolve => 
		https.get(url, { headers }, msg => {
			const { statusCode } = msg;
		  
			if (statusCode !== 200) {
				return resolve(Err(`Status code: ${statusCode}`));
			}
		  
			msg.setEncoding("utf8");
			let rawData = "";
			msg.on("data", chunk => rawData += chunk);
			msg.on("end", () => resolve(Ok(rawData)));
		}
	).on("error", e => resolve(Err(e.message)))
	)).andThen(returnData => tryCatch(
		() => JSON.parse(returnData),
		"Failed to parse response"
	)).map(res => res.walletBalance as number);
};

const sign = (verb: "GET" | "POST", endpoint: string, query: string, expires: number, postBody: string) =>
	crypto.createHmac("sha256", apiSecret)
		.update(verb + apiRoot + endpoint + query + expires.toString() + postBody)
		.digest("hex");
