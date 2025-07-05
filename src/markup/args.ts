import {Optional} from "../util/optional";

export class Argument {

    readonly value: string;
    constructor(data: string) {
        this.value = data;
    }

    get lowerValue(): string {
        return this.value.toLowerCase();
    }

    asNumber(): Optional<number> {
        return Optional.ofNaNable(parseFloat(this.value));
    }

    asInt(): Optional<number> {
        return Optional.ofNaNable(parseInt(this.value));
    }

    isTrue(): boolean {
        switch (this.lowerValue) {
            case "true":
            case "1":
            case "yes":
            case "on":
                return true;
            case "false":
            case "0":
            case "no":
            case "off":
                return false;
            default:
                return !!this.value;
        }
    }

    isFalse(): boolean {
        return !this.isTrue();
    }

}

export class ArgumentQueue {

    private readonly data: string;
    private head: number = 0;
    constructor(args: string) {
        this.data = args;
    }

    reset(): void {
        this.head = 0;
    }

    hasNext(): boolean {
        return this.head < this.data.length;
    }

    peek(): Argument | null {
        if (!this.hasNext()) return null;
        return this.pop0(true);
    }

    pop(): Argument {
        if (!this.hasNext()) throw new Error("Cannot pop ArgumentQueue (no more data)");
        return this.pop0(false);
    }

    private pop0(rewind: boolean): Argument {
        const start: number = this.head;
        let c: number;
        let inQuotes = false;
        let quoteChar = 0;
        let quoteStart = -1;

        while (this.head < this.data.length) {
            c = this.data.charCodeAt(this.head);

            // Handle quotes (single or double)
            if (c === 39 || c === 34) { // ' or "
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = c;
                    quoteStart = this.head;
                } else if (c === quoteChar) {
                    inQuotes = false;
                }
            }

            // Only break on colon if not inside quotes
            if (c === 58 && !inQuotes) break; // : (colon)

            this.head++;
        }

        let dat = this.data.substring(start, this.head);

        // Strip quotes if the entire argument is quoted
        if (quoteStart === start && quoteStart >= 0 && !inQuotes) {
            const quoteEnd = this.head - 1;
            if (this.data.charCodeAt(quoteEnd) === quoteChar) {
                dat = this.data.substring(start + 1, quoteEnd);
            }
        }

        if (rewind) {
            this.head = start;
        } else {
            this.head++;
        }
        return new Argument(dat);
    }

}

export namespace ArgumentQueue {

    export const EMPTY = new ArgumentQueue("");

}
