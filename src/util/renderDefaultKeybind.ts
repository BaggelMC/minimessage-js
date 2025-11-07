import {MiniMessageInstance} from "../spec";
import {KEYBIND_TO_TRANSLATABLE, KEYBIND_TO_LITERAL} from "../data/keybinds";

export function renderDefaultKeybindHTML(keybind: string, context: MiniMessageInstance): string {
    const translatableKey = KEYBIND_TO_TRANSLATABLE[keybind];
    if (translatableKey) {
        return context.translations[translatableKey] ?? KEYBIND_TO_LITERAL[keybind] ?? keybind;
    }
    return KEYBIND_TO_LITERAL[keybind] ?? keybind;
}
