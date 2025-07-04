import {Test, runTests, assertEquals} from "../junit";
import MiniMessage from "../../src";

class ClickEventTest {

    @Test()
    clickEventWithQuotedUrl() {
        const mm = MiniMessage.miniMessage();
        const src = `<click:open_url:'https://example.com'>Text</click>`;
        const component = mm.deserialize(src);
        
        // Check that the component has the correct clickEvent
        const clickEvent = component.getProperty("clickEvent")!;
        assertEquals(clickEvent.action, "open_url");
        assertEquals(clickEvent.value, "https://example.com");
        
        // Check that the HTML output is correct
        const html = MiniMessage.miniMessage().toHTML(component);
        
        // The HTML should contain a data-mm-click-event attribute with the correct JSON
        const expectedAttr = `data-mm-click-event="{\\\"action\\\":\\\"open_url\\\",\\\"value\\\":\\\"https://example.com\\\"}"`;
        const containsExpectedAttr = html.includes(expectedAttr);
        assertEquals(containsExpectedAttr, true);
    }
}

runTests(ClickEventTest);