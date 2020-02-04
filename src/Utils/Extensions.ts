// #region Array
// tslint:disable-next-line
interface Array<T> {
    last(): T;
}

if (!Array.prototype.last) {
    Array.prototype.last = function () { return this[this.length - 1]; };
}
// #endregion

// #region String
// tslint:disable-next-line
interface String {
    repeat(count: number): string;
    endsWith(searchString: string, position: number): boolean;
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString: string, position: number) {
        var subjectString = this.toString();
        if (typeof position !== "number" || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

if (!String.prototype.repeat) {
    String.prototype.repeat = function(count: number) {
        "use strict";
        if (this == null) {
            throw new TypeError("can\"t convert " + this + " to object");
        }
        var str = "" + this;
        count = +count;
        if (count !== count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError("repeat count must be non-negative");
        }
        if (count === Infinity) {
            throw new RangeError("repeat count must be less than infinity");
        }
        count = Math.floor(count);
        if (str.length === 0 || count === 0) {
            return "";
        }
        // Ensuring count is a 31-bit integer allows us to heavily optimize the
        // main part. But anyway, most current (August 2014) browsers can"t handle
        // strings 1 << 28 chars or longer, so:
        if (str.length * count >= 1 << 28) {
            throw new RangeError("repeat count must not overflow maximum string size");
        }
        var rpt = "";
        for (;;) {
            if ((count & 1) === 1) {
                rpt += str;
            }
            count >>>= 1;
            if (count === 0) {
                break;
            }
            str += str;
        }
        // Could we try:
        // return Array(count + 1).join(this);
        return rpt;
    };
}
// #endregion

// #region Promise
// tslint:disable-next-line
interface PromiseConstructor {
    delay(timeoutMs: number): Promise<void>;
}

Promise.delay = function(timeoutMs: number) {
    return new Promise<void>((resolve, reject) => setTimeout(resolve, timeoutMs));
};
// #endregion

// tslint:disable-next-line
interface Date {
    format(format: string): string;
}

