import { Tag, TagResolver } from "../spec";
import { ArgumentQueue } from "../../markup/args";
import { TagResolverContext } from "../context";
import { Component } from "../../component/spec";
import { uuidRegex, playerNameRegex } from "../../data/head";

export class HeadTagResolver implements TagResolver {

    has(name: string): boolean {
        return name === "head";
    }

    resolve(name: string, args: ArgumentQueue, ctx: TagResolverContext): Tag | null {
        const arg = args.pop();
        if (!arg) return null;
        const arg2 = args.peek()

        const playerIdentifier = arg.value.trim();
        let showOuterLayer = true;
        if (arg2) {
            showOuterLayer = arg2.value.trim() ? arg2.value.trim().toLowerCase() !== "false" : true;
        }

        const component = Component.empty();
        component.setProperty("hat", showOuterLayer);

        if (uuidRegex.test(playerIdentifier)) {
            component.setProperty("player", { id: uuidToIntArray(playerIdentifier) });
        } else if (playerIdentifier.includes("/")) {
            component.setProperty("player", { texture: "minecraft:" + playerIdentifier });
        } else if (playerNameRegex.test(playerIdentifier)) {
            component.setProperty("player", playerIdentifier);
        } else {
            return null;
        }

        return Tag.insert(component);
    }
}

/** Converts UUID string -> 4x signed 32-bit ints for Minecraft internal representation */
function uuidToIntArray(uuid: string): number[] {
    const hex = uuid.replace(/-/g, "");
    const ints: number[] = [];
    for (let i = 0; i < 32; i += 8) {
        const part = parseInt(hex.slice(i, i + 8), 16);
        ints.push((part << 0) >> 0); // force signed 32-bit
    }
    return ints;
}

export namespace HeadTagResolver {
    export const INSTANCE: TagResolver = new HeadTagResolver();
}
