import { Tag, TagResolver } from "../spec";
import { ArgumentQueue } from "../../markup/args";
import { TagResolverContext } from "../context";
import { Component } from "../../component/spec";
import { HexUtil } from "../../util/hex";

// Taken from: https://github.com/PaperMC/adventure/blob/16f2eb29e939e76851c4a4854e7ddb62cf255b54/text-minimessage/src/main/java/net/kyori/adventure/text/minimessage/tag/standard/PrideTag.java#L51
const PRIDE_FLAGS: Record<string, string[]> = {
    pride: ["#E50000", "#FF8D00", "#FFEE00", "#028121", "#004CFF", "#770088"],
    progress: ["#FFFFFF", "#FFAFC7", "#73D7EE", "#613915", "#000000", "#E50000", "#FF8D00", "#FFEE00", "#028121", "#004CFF", "#770088"],
    trans: ["#5BCFFB", "#F5ABB9", "#FFFFFF", "#F5ABB9", "#5BCFFB"],
    bi: ["#D60270", "#9B4F96", "#0038A8"],
    pan: ["#FF1C8D", "#FFD700", "#1AB3FF"],
    nb: ["#FCF431", "#FCFCFC", "#9D59D2", "#282828"],
    lesbian: ["#D62800", "#FF9B56", "#FFFFFF", "#D462A6", "#A40062"],
    ace: ["#000000", "#A4A4A4", "#FFFFFF", "#810081"],
    agender: ["#000000", "#BABABA", "#FFFFFF", "#BAF484", "#FFFFFF", "#BABABA", "#000000"],
    demisexual: ["#000000", "#FFFFFF", "#6E0071", "#D3D3D3"],
    genderqueer: ["#B57FDD", "#FFFFFF", "#49821E"],
    genderfluid: ["#FE76A2", "#FFFFFF", "#BF12D7", "#000000", "#303CBE"],
    intersex: ["#FFD800", "#7902AA", "#FFD800"],
    aro: ["#3BA740", "#A8D47A", "#FFFFFF", "#ABABAB", "#000000"],
    baker: ["#CD66FF", "#FF6599", "#FE0000", "#FE9900", "#FFFF01", "#009900", "#0099CB", "#350099", "#990099"],
    philly: ["#000000", "#784F17", "#FE0000", "#FD8C00", "#FFE500", "#119F0B", "#0644B3", "#C22EDC"],
    queer: ["#000000", "#9AD9EA", "#00A3E8", "#B5E51D", "#FFFFFF", "#FFC90D", "#FC6667", "#FEAEC9", "#000000"],
    gay: ["#078E70", "#26CEAA", "#98E8C1", "#FFFFFF", "#7BADE2", "#5049CB", "#3D1A78"],
    bigender: ["#C479A0", "#ECA6CB", "#D5C7E8", "#FFFFFF", "#D5C7E8", "#9AC7E8", "#6C83CF"],
    demigender: ["#7F7F7F", "#C3C3C3", "#FBFF74", "#FFFFFF", "#FBFF74", "#C3C3C3", "#7F7F7F"],
};

function getFlagColors(flagName: string): string[] {
    return PRIDE_FLAGS[flagName] || PRIDE_FLAGS["pride"];
}

function interpolateRGBColors(c1: { r: number, g: number, b: number }, c2: { r: number, g: number, b: number }, t: number) {
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `#${HexUtil.octet2Hex(r)}${HexUtil.octet2Hex(g)}${HexUtil.octet2Hex(b)}`;
}

export class PrideTagResolver implements TagResolver {
    has(name: string): boolean {
        return name === "pride";
    }

    resolve(name: string, args: ArgumentQueue, ctx: TagResolverContext): Tag | null {
        let flag = "pride";
        let phase = 0;
        const arg = args.peek();

        if (arg !== null) {
            const parts = arg.value.split("|");
            if (parts[0]) flag = parts[0];
            if (parts[1]) phase = parseFloat(parts[1]) || 0;
        }

        const colors = getFlagColors(flag);
        const step = 1 / (colors.length - 1);

        return Tag.modify((component: Component) => {
            component.setColorByPlacement((relativePosition) => {
                const shiftedPosition = relativePosition + phase;

                const startColorIndex = Math.min(
                    Math.floor(shiftedPosition / step),
                    colors.length - 2
                );

                const interpolationFactor = (shiftedPosition - startColorIndex * step) / step;

                const startColor = HexUtil.hexToRgb(colors[startColorIndex]);
                const endColor = HexUtil.hexToRgb(colors[startColorIndex + 1]);

                return interpolateRGBColors(startColor, endColor, interpolationFactor);
            });

            return component;
        });
    }
}

export namespace PrideTagResolver {
    export const INSTANCE: TagResolver = new PrideTagResolver();
}