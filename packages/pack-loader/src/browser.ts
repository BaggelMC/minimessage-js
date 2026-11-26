import loadResourcePacks from "./index";

// UMD entry point, which assigns `loadResourcePacks` to window.adventurePackLoader.
// Load it after minimessage.umd.js: the "minimessage-js" import is resolved to
// the `adventure` global at build time (build-umd.ts) instead of being bundled

declare global {
    interface Window {
        /**
         * UMD export for the pack loader, only valid when using the UMD build (`pack-loader.umd.js`).
         *
         * @example
         *     const packs = await window.adventurePackLoader.loadResourcePacks(file);
         */
        readonly adventurePackLoader: { readonly loadResourcePacks: typeof loadResourcePacks };
    }
}

((g: any) => {
    Object.defineProperty(g, "adventurePackLoader", {
        value: Object.freeze({ loadResourcePacks }),
        writable: false,
        enumerable: true,
        configurable: false,
    });
})(typeof globalThis === "object" ? globalThis : window);
