import config from "../../config.js";
import log from "../../log.js";
import { getPtr } from "../utils.js";

declare let Swift: any;

export const SwiftAvailable = function () {
    return config.getBoolean("want.swift") && Process.platform === "darwin" &&
        Swift !== undefined && Swift.available;
};

export function traceSwift(klass: string, method: string) {
    if (!SwiftAvailable()) {
        return;
    }
    const targetAddress = getPtr("swift:" + klass + "." + method);
    if (ptr(0).equals(targetAddress)) {
        console.error("Missing method " + method + " in class " + klass);
        return;
    }
    const callback = function (args: string[]) {
        const msg = ["[SWIFT]", klass, method, JSON.stringify(args)];
        log.traceEmit(msg.join(" "));
    };
    Swift.Interceptor.Attach(targetAddress, callback);
}

export function swiftTypesR2(args: string[]) {
    let res = "";
    if (SwiftAvailable()) {
        switch (args.length) {
            case 0:
                for (const mod in Swift.modules) {
                    res += mod + "\n";
                }
                break;
            case 1:
                try {
                    const target = args[0];
                    const module = (Swift && Swift.modules)
                        ? Swift.modules[target]
                        : null;
                    if (!module) {
                        throw new Error("No module named like this.");
                    }
                    let m = module.enums;
                    if (m) {
                        for (const e of Object.keys(m)) {
                            res += "td enum " + e + " {";
                            const fields = [];
                            if (m[e].$fields) {
                                for (const f of m[e].$fields) {
                                    fields.push(f.name);
                                }
                            }
                            res += fields.join(", ");
                            res += "}\n";
                        }
                    }
                    m = Swift.modules[target].classes;
                    if (m) {
                        for (const e of Object.keys(m)) {
                            if (m[e].$methods) {
                                for (const f of m[e].$methods) {
                                    const name = f.type + "_" +
                                        (f.name ? f.name : f.address);
                                    res += "f swift." + target + "." + e + "." +
                                        name + " = " + f.address + "\n";
                                }
                            }
                        }
                    }
                    m = Swift.modules[target].structs;
                    if (m) {
                        for (const e of Object.keys(m)) {
                            res += '"td struct ' + target + "." + e + " {";
                            if (m[e].$fields) {
                                for (const f of m[e].$fields) {
                                    res += "int " + f.name + ";";
                                    // res += '  ' + f.name + ' ' + f.typeName + '\n';
                                }
                            }
                            res += '}"\n';
                        }
                    }
                } catch (e) {
                    res += e;
                }
                break;
        }
    }
    return res;
}

export function swiftTypes(args: string[]): string {
    if (!SwiftAvailable()) {
        if (config.getBoolean("want.swift")) {
            console.error("See :e want.swift=true");
        }
        return "";
    }
    let res = "";
    switch (args.length) {
        case 0:
            for (const mod in Swift.modules) {
                res += mod + "\n";
            }
            break;
        case 1:
            try {
                const target = args[0];
                const module = (Swift && Swift.modules)
                    ? Swift.modules[target]
                    : null;
                if (!module) {
                    throw new Error("No module named like this.");
                }
                res += "module " + target + "\n\n";
                let m = module.enums;
                if (m) {
                    for (const e of Object.keys(m)) {
                        if ((e as any).$conformances) {
                            res += "// conforms to " +
                                (m[e].$conformances.join(", ")) + "\n";
                        }
                        res += "enum " + e + " {\n";
                        if (m[e].$fields) {
                            for (const f of m[e].$fields) {
                                res += "  " + f.name + ",\n";
                            }
                        }
                        res += "}\n";
                    }
                    res += "\n";
                }
                m = Swift.modules[target].classes;
                if (m) {
                    for (const e of Object.keys(m)) {
                        res += "class " + e + " {\n";
                        if (m[e].$fields) {
                            for (const f of m[e].$fields) {
                                res += "  " + f.name + " " + f.typeName + "\n";
                            }
                        }
                        if (m[e].$methods) {
                            for (const f of m[e].$methods) {
                                const name = f.type +
                                    (f.name ? f.name : f.address);
                                res += "  fn " + name + "() // " + f.address +
                                    "\n";
                            }
                        }
                        res += "}\n";
                    }
                    res += "\n";
                }
                m = Swift.modules[target].structs;
                if (m) {
                    for (const e of Object.keys(m)) {
                        if ((e as any).$conformances) {
                            res += "// conforms to " +
                                (m[e].$conformances.join(", ")) + "\n";
                        }
                        res += "struct " + e + " {\n";
                        if (m[e].$fields) {
                            for (const f of m[e].$fields) {
                                res += "  " + f.name + " " + f.typeName + "\n";
                            }
                        }
                        res += "}\n";
                    }
                    res += "\n";
                }
                m = module.protocols;
                if (m) {
                    for (const e of Object.keys(m)) {
                        if (m[e].isClassOnly) {
                            res += "class ";
                        }
                        res += "protocol " + e + " (requires: " +
                            m[e].numRequirements + ")\n";
                    }
                    res += "\n";
                }
            } catch (e) {
                res += e;
            }
            break;
    }
    return res;
}
