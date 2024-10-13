// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EventEmitter } from "events";
import { Readable } from "stream";
import { DebugProtocol } from "@vscode/debugprotocol";

import { IProtocolParser } from "../types";

const PROTOCOL_START_INDENTIFIER = "\r\n\r\n";

type Listener = (...args: unknown[]) => void;

/**
 * Parsers the debugger Protocol messages and raises the following events:
 * 1. 'data', message (for all protocol messages)
 * 1. 'event_<event name>', message (for all protocol events)
 * 1. 'request_<command name>', message (for all protocol requests)
 * 1. 'response_<command name>', message (for all protocol responses)
 * 1. '<type>', message (for all protocol messages that are not events, requests nor responses)
 * @export
 * @class ProtocolParser
 * @extends {EventEmitter}
 * @implements {IProtocolParser}
 */
export class ProtocolParser implements IProtocolParser {
	private rawData = Buffer.alloc(0);

	private contentLength = -1;

	private disposed = false;

	private stream?: Readable;

	private events: EventEmitter;

	constructor() {
		this.events = new EventEmitter();
	}

	public dispose(): void {
		if (this.stream) {
			this.stream.removeListener("data", this.dataCallbackHandler);
			this.stream = undefined;
		}
	}

	public connect(stream: Readable): void {
		this.stream = stream;
		stream.addListener("data", this.dataCallbackHandler);
	}

	public on(event: string | symbol, listener: Listener): this {
		this.events.on(event, listener);
		return this;
	}

	public once(event: string | symbol, listener: Listener): this {
		this.events.once(event, listener);
		return this;
	}

	private dataCallbackHandler = (data: string | Buffer) => {
		this.handleData(data as Buffer);
	};

	private dispatch(body: string): void {
		const message = JSON.parse(body) as DebugProtocol.ProtocolMessage;

		switch (message.type) {
			case "event": {
				const event = message as DebugProtocol.Event;
				if (typeof event.event === "string") {
					this.events.emit(`${message.type}_${event.event}`, event);
				}
				break;
			}
			case "request": {
				const request = message as DebugProtocol.Request;
				if (typeof request.command === "string") {
					this.events.emit(
						`${message.type}_${request.command}`,
						request,
					);
				}
				break;
			}
			case "response": {
				const response = message as DebugProtocol.Response;
				if (typeof response.command === "string") {
					this.events.emit(
						`${message.type}_${response.command}`,
						response,
					);
				}
				break;
			}
			default: {
				this.events.emit(`${message.type}`, message);
			}
		}

		this.events.emit("data", message);
	}

	private handleData(data: Buffer): void {
		if (this.disposed) {
			return;
		}
		this.rawData = Buffer.concat([this.rawData, data]);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (this.contentLength >= 0) {
				if (this.rawData.length >= this.contentLength) {
					const message = this.rawData.toString(
						"utf8",
						0,
						this.contentLength,
					);
					this.rawData = this.rawData.slice(this.contentLength);
					this.contentLength = -1;
					if (message.length > 0) {
						this.dispatch(message);
					}
					// there may be more complete messages to process.
					// eslint-disable-next-line no-continue
					continue;
				}
			} else {
				const idx = this.rawData.indexOf(PROTOCOL_START_INDENTIFIER);
				if (idx !== -1) {
					const header = this.rawData.toString("utf8", 0, idx);
					const lines = header.split("\r\n");
					for (const line of lines) {
						const pair = line.split(/: +/);
						if (pair[0] === "Content-Length") {
							this.contentLength = +pair[1];
						}
					}
					this.rawData = this.rawData.slice(
						idx + PROTOCOL_START_INDENTIFIER.length,
					);
					// eslint-disable-next-line no-continue
					continue;
				}
			}
			break;
		}
	}
}
