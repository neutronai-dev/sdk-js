#!/usr/bin/env node
import { runCli } from "../cli.js";

const exit_code = await runCli(process.argv.slice(2), process.env);
process.exitCode = exit_code;
