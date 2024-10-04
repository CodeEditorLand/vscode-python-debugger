/* eslint-disable @typescript-eslint/naming-convention */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
	SpawnOptions as ChildProcessSpawnOptions,
	ExecOptions,
} from "child_process";
import { CancellationToken } from "vscode";

export type SpawnOptions = ChildProcessSpawnOptions & {
	encoding?: string;
	token?: CancellationToken;
	mergeStdOutErr?: boolean;
	throwOnStdErr?: boolean;
	extraVariables?: NodeJS.ProcessEnv;
};

export type ShellOptions = ExecOptions & { throwOnStdErr?: boolean };

export type ExecutionResult<T extends string | Buffer> = {
	stdout: T;
	stderr?: T;
};

export class StdErrError extends Error {
	constructor(message: string) {
		super(message);
	}
}
