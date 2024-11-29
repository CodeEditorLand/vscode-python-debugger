"use strict";

import { IExtensionApi } from "./apiTypes";
import { Commands } from "./common/constants";
import { registerLogger, traceError } from "./common/log/logging";
import { IExtensionContext } from "./common/types";
import { createOutputChannel, registerCommand } from "./common/vscodeapi";
import { registerDebugger } from "./extensionInit";
import { sendTelemetryEvent } from "./telemetry";
import { EventName } from "./telemetry/constants";

export async function activate(
	context: IExtensionContext,
): Promise<IExtensionApi | undefined> {
	const outputChannel = createOutputChannel("Python Debugger");

	context.subscriptions.push(outputChannel, registerLogger(outputChannel));

	context.subscriptions.push(
		registerCommand(Commands.ViewOutput, () => outputChannel.show()),
	);

	try {
		const api = await registerDebugger(context);

		sendTelemetryEvent(EventName.DEBUG_SUCCESS_ACTIVATION);

		return api;
	} catch (ex) {
		traceError("sendDebugpySuccessActivationTelemetry() failed.", ex);

		throw ex; // re-raise
	}
}
