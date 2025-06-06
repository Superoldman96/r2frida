import r2frida from "./plugin.js";

function haveVolatileApi() {
    try {
        const p = new NativePointer("0");
        return (typeof p.readVolatile === "function");
    } catch (e) {
        return false;
    }
    return false;
}

function getFirstReadableRange() {
    const range = Process.enumerateRanges("r-x")[0];
    return {
        start: range.base,
        end: range.base.add(range.size),
    };
}

const config: any[string] = {
    "java.wait": false,
    "want.swift": false,
    "io.safe": false,
    "io.volatile": haveVolatileApi(),
    "patch.code": true,
    "search.bigendian": false,
    "search.in": "perm:r--",
    "search.from": getFirstReadableRange().start.toString(),
    "search.to": getFirstReadableRange().end.toString(),
    "search.kwidx": 0,
    "search.align": 0,
    "search.quiet": false,
    "stalker.event": "compile",
    "stalker.timeout": 5 * 60,
    "stalker.in": "raw",
    "hook.backtrace": false,
    "hook.verbose": true,
    "hook.time": true,
    "hook.logs": true,
    "hook.output": "simple",
    "hook.usecmd": "",
    "file.log": "",
    "symbols.module": "",
    "symbols.unredact": Process.platform === "darwin",
    "dbg.hwbp": "true",
};

const configHelp: any[string] = {
    "want.swift": _configHelpWantSwift,
    "java.wait": _configHelpJavaWait,
    "io.safe": _configHelpIoSafe,
    "io.volatile": _configHelpIoVolatile,
    "search.bigendian": _configHelpSearchEndian,
    "search.in": _configHelpSearchIn,
    "search.from": _configHelpSearchFrom,
    "search.to": _configHelpSearchTo,
    "search.align": _configHelpSearchAlign,
    "stalker.event": _configHelpStalkerEvent,
    "stalker.timeout": _configHelpStalkerTimeout,
    "stalker.in": _configHelpStalkerIn,
    "hook.backtrace": _configHelpHookBacktrace,
    "hook.verbose": _configHelpHookVerbose,
    "hook.time": _configHelpHookTime,
    "hook.usecmd": _configHelpHookUseCmd,
    "hook.logs": _configHelpHookLogs,
    "hook.output": _configHelpHookOutput,
    "file.log": _configHelpFileLog,
    "symbols.module": _configHelpSymbolsModule,
    "symbols.unredact": _configHelpSymbolsUnredact,
};

const configValidator: any[string] = {
    "want.swift": _configValidateBoolean,
    "java.wait": _configValidateBoolean,
    "io.safe": _configValidateBoolean,
    "io.volatile": _configValidateBoolean,
    "search.bigendian": _configValidateBoolean,
    "search.align": _configValidateNumber,
    "search.in": _configValidateSearchIn,
    "search.from": _configValidateSearchFrom,
    "search.to": _configValidateSearchTo,
    "stalker.event": _configValidateStalkerEvent,
    "stalker.timeout": _configValidateStalkerTimeout,
    "stalker.in": _configValidateStalkerIn,
    "hook.backtrace": _configValidateBoolean,
    "hook.verbose": _configValidateBoolean,
    "hook.time": _configValidateBoolean,
    "hook.logs": _configValidateBoolean,
    "hook.output": _configValidateString,
    "file.log": _configValidateString,
    "symbols.module": _configValidateString,
    "symbols.unredact": _configValidateBoolean,
};

function _configHelpWantSwift() {
    return "Use Swift.Frida if available, disabled by default as long as some apps make Frida crash";
}

function _configHelpIoVolatile() {
    return "Use the new Volatile IO API (requires frida 16.1.0)";
}

function _configHelpIoSafe() {
    return "Safe IO";
}

function _configHelpJavaWait() {
    return "Wait for Java classloader to be ready (boolean)";
}

function _configHelpSearchEndian() {
    return `Specify the endianness`;
}

function _configHelpSearchIn() {
    return `Specify which memory ranges to search in, possible values:
perm:---        filter by permissions (default: 'perm:r--')
current         search the range containing current offset
heap            search inside the heap allocated regions
path:pattern    search ranges mapping paths containing 'pattern'
  `;
}

function _configHelpSearchFrom() {
    return `Specify the start address to search in`;
}

function _configHelpSearchTo() {
    return `Specify the end address to search in`;
}

function _configHelpSearchAlign() {
    return `Only accept matches hitting on aligned addresses`;
}

function _configHelpStalkerEvent() {
    return `Specify the event to use when stalking, possible values:
  
call            trace calls
ret             trace returns
exec            trace every instruction
block           trace basic block execution (every time)
compile         trace basic blocks once (this is the default)
  `;
}

function _configHelpStalkerTimeout() {
    return `Time after which the stalker gives up (in seconds). Defaults to 5 minutes,
  set to 0 to disable.`;
}

function _configHelpFileLog() {
    return `Set filename to save all the tracing logs generated by :dt
  
string        specify file path of the log file`;
}

function _configHelpHookUseCmd() {
    return `Use the given command when registering a new trace (dt) or injection (di) to be executed when hits
'' | 'r2cmd'  the r2 command will be executed from the host side and r2frida commands can be also recursively called`;
}

function _configHelpHookVerbose() {
    return `Show trace messages to the console. They are also logged in :dtl
true | false    to enable or disable the option`;
}

function _configHelpHookTime() {
    return `Show timestamp in trace logs
true | false    to enable or disable the option`;
}

function _configHelpHookLogs() {
    return `Save hook trace logs internally in the agent. Use :dtl to list them
true | false    to enable or disable the option (enabled by default)`;
}

function _configHelpHookOutput() {
    return `Choose output format.
  
  simple | json   (simple by default)
  `;
}

function _configHelpHookBacktrace() {
    return `Append the backtrace on each trace hook registered with :dt commands
true | false    to enable or disable the option`;
}

function _configHelpStalkerIn() {
    return `Restrict stalker results based on where the event has originated:
raw             stalk everywhere (the default)
app             stalk only in the app module
modules         stalk in app module and all linked libraries`;
}

function _configHelpSymbolsModule() {
    return `When set ignore offset to tell frida which module to use for symbols:
See :dm command to get all maps and :dmm for modules`;
}

function _configHelpSymbolsUnredact() {
    return `Try to get symbol names from debug symbols when they're "redacted":
true            try to unredact (the default)
false           do not attempt to unredact`;
}

function _configValidateStalkerTimeout(val: number): boolean {
    return val >= 0;
}

function _configValidateStalkerEvent(val: string): boolean {
    return ["call", "ret", "exec", "block", "compile"].indexOf(val) !== -1;
}

function _configValidateStalkerIn(val: string): boolean {
    return ["raw", "app", "modules"].indexOf(val) !== -1;
}
function _configValidateString(val: any): boolean {
    return typeof val === "string";
}

function _configValidateNumber(val: any): boolean {
    return !isNaN(Number(val));
}

function _configValidateBoolean(val: any): boolean {
    return _isTrue(val) || _isFalse(val);
}

function _isTrue(x: any): boolean {
    return (x === true || x === 1 || x === "1" || (/(true)/i).test(x));
}

function _isFalse(x: any): boolean {
    return (x === false || x === 0 || x === "0" || (/(false)/i).test(x));
}

function _configValidateSearchFrom(addr: string): boolean {
    const minAddr = Process.enumerateRanges("r--")[0].base;
    return ptr(addr).compare(minAddr) >= 0;
}

function _configValidateSearchTo(addr: string): boolean {
    const ranges = Process.enumerateRanges("r--");
    const maxAddr = ranges[ranges.length - 1].base;
    return ptr(addr).compare(maxAddr) <= 0;
}

function _configValidateSearchIn(val: string): boolean {
    if (val === "heap") {
        return true;
    }
    const valSplit = val.split(":");
    const [scope, param] = valSplit;
    if (param === undefined) {
        if (scope === "current") {
            return valSplit.length === 1;
        }
        return false;
    }
    if (scope === "perm") {
        const paramSplit = param.split("");
        if (paramSplit.length !== 3 || valSplit.length > 2) {
            return false;
        }
        const [r, w, x] = paramSplit;
        return (r === "r" || r === "-") &&
            (w === "w" || w === "-") &&
            (x === "x" || x === "-");
    }
    return scope === "path";
}

function helpFor(k: string) {
    if (configHelp[k] !== undefined) {
        return configHelp[k]();
    }
    console.error(`no help for ${k}`);
    return "";
}

function asR2Script(): string {
    return Object.keys(config)
        .map((k) => ":e " + k + "=" + config[k])
        .join("\n");
}

function getString(k: string): string {
    const ck = config[k];
    if (_configValidateBoolean(ck)) {
        return ck ? "true" : "false";
    }
    return ck ? ("" + ck) : "";
}

export function evalConfigR2(args: string[]): string {
    return asR2Script();
}

export function evalConfig(args: string[]) {
    if (args.length === 0) {
        return asR2Script();
    }
    const argstr = args.join(" ");
    if (argstr.endsWith(".")) {
        // list k=v of all the keys starting with argstr
        const lines = [];
        for (const k of Object.keys(config)) {
            if (k.startsWith(argstr)) {
                lines.push(`:e ${k} = ${config[k]}`);
            }
        }
        return lines.join("\n");
    }
    const kv = argstr.split(/=/);
    if (kv.length === 2) {
        const [k, v] = [kv[0].trim(), kv[1].trim()];
        if (get(k) !== undefined) {
            if (v === "?") {
                return helpFor(kv[0]);
            }
            set(k, v);
        } else {
            console.error("unknown variable");
        }
        return "";
    }
    return getString(argstr);
}

export function evalConfigSearch(args: string[]) {
    const currentRange = Process.getRangeByAddress(ptr(r2frida.offset));
    const from = currentRange.base;
    const to = from.add(currentRange.size);
    return `e search.in=range
e search.from=${from}
e search.to=${to}
e anal.in=range
e anal.from=${from}
e anal.to=${to}`;
}

export function set(k: string, v: any) {
    if (configValidator[k] !== undefined) {
        const cb: any = configValidator[k];
        if (cb && !cb(v)) {
            console.error(`Invalid value for ${k}`);
            return "";
        }
    }
    config[k] = v;
}

export function get(k: string) {
    return config[k];
}

export const getBoolean = (k: string) => _isTrue(config[k]);
export const getNumber = (k: string) =>
    isNaN(Number(config[k])) ? 0 : config[k];
export { config as values };
export default {
    values: config,
    getBoolean,
    getString,
    getNumber,
    evalConfigR2,
    evalConfig,
    evalConfigSearch,
    set,
    get,
};
