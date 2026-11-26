// Builds dist/pack-loader.umd.js for use next to minimessage.umd.js
// "minimessage-js" is mapped to the `adventure` global so it isn't bundled twice

const result = await Bun.build({
    entrypoints: ["./src/browser.ts"],
    outdir: "./dist",
    naming: "pack-loader.umd.js",
    format: "iife",
    target: "browser",
    plugins: [
        {
            name: "adventure-global",
            setup(build) {
                build.onResolve({ filter: /^minimessage-js$/ }, () => ({
                    path: "minimessage-js",
                    namespace: "adventure-global",
                }));
                build.onLoad({ filter: /.*/, namespace: "adventure-global" }, () => ({
                    contents: `
                        const g = typeof globalThis === "object" ? globalThis : window;
                        if (!g.adventure) throw new Error("pack-loader.umd.js requires minimessage.umd.js to be loaded first");
                        export const Key = g.adventure.Key;
                    `,
                    loader: "js",
                }));
            },
        },
    ],
});

if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
}
