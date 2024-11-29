// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

"use strict";

import { MultiStepInput } from "../../../common/multiStepInput";
import { DebugConfigStrings } from "../../../common/utils/localize";
import { DebuggerTypeName } from "../../../constants";
import { sendTelemetryEvent } from "../../../telemetry";
import { EventName } from "../../../telemetry/constants";
import { LaunchRequestArguments } from "../../../types";
import { DebugConfigurationState, DebugConfigurationType } from "../../types";

export async function buildFileLaunchDebugConfiguration(
	_input: MultiStepInput<DebugConfigurationState>,
	state: DebugConfigurationState,
): Promise<void> {
	const config: Partial<LaunchRequestArguments> = {
		name: DebugConfigStrings.file.snippet.name,
		type: DebuggerTypeName,
		request: "launch",
		program: "${file}",
		console: "integratedTerminal",
	};

	sendTelemetryEvent(EventName.DEBUGGER_CONFIGURATION_PROMPTS, undefined, {
		configurationType: DebugConfigurationType.launchFastAPI,
	});

	Object.assign(state.config, config);
}
