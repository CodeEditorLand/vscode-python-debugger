// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import * as path from "path";
import { DebugProtocol } from "@vscode/debugprotocol";
import { createWriteStream, WriteStream } from "fs-extra";
import {
	DebugAdapterTracker,
	DebugAdapterTrackerFactory,
	DebugConfiguration,
	DebugSession,
	ProviderResult,
} from "vscode";

import { EXTENSION_ROOT_DIR } from "../../common/constants";
import { StopWatch } from "../../common/utils/stopWatch";

class DebugSessionLoggingTracker implements DebugAdapterTracker {
	private readonly enabled: boolean = false;

	private stream?: WriteStream;

	private timer = new StopWatch();

	constructor(private readonly session: DebugSession) {
		this.enabled = this.session.configuration.logToFile as boolean;

		if (this.enabled) {
			const fileName = `debugger.vscode_${this.session.id}.log`;

			this.stream = createWriteStream(
				path.join(EXTENSION_ROOT_DIR, fileName),
			);
		}
	}

	public onWillStartSession() {
		this.timer.reset();

		this.log(
			`Starting Session:\n${this.stringify(this.session.configuration)}\n`,
		);
	}

	public onWillReceiveMessage(message: DebugProtocol.Message) {
		this.log(`Client --> Adapter:\n${this.stringify(message)}\n`);
	}

	public onDidSendMessage(message: DebugProtocol.Message) {
		this.log(`Client <-- Adapter:\n${this.stringify(message)}\n`);
	}

	public onWillStopSession() {
		this.log("Stopping Session\n");
	}

	public onError(error: Error) {
		this.log(`Error:\n${this.stringify(error)}\n`);
	}

	public onExit(code: number | undefined, signal: string | undefined) {
		this.log(
			`Exit:\nExit-Code: ${code ? code : 0}\nSignal: ${signal ? signal : "none"}\n`,
		);

		this.stream?.close();
	}

	private log(message: string) {
		if (this.enabled) {
			this.stream!.write(`${this.timer.elapsedTime} ${message}`); // NOSONAR
		}
	}

	private stringify(
		data: DebugProtocol.Message | Error | DebugConfiguration,
	) {
		return JSON.stringify(data, null, 4);
	}
}

export class DebugSessionLoggingFactory implements DebugAdapterTrackerFactory {
	constructor() {}

	public createDebugAdapterTracker(
		session: DebugSession,
	): ProviderResult<DebugAdapterTracker> {
		return new DebugSessionLoggingTracker(session);
	}
}
