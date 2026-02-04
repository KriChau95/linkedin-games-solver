"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
(_a = document.getElementById("solve-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    const tabs = yield chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || !tab.id) {
        console.error("No active tab found!");
        return;
    }
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // Create a KeyboardEvent for the right arrow
            const rightArrowEvent = new KeyboardEvent("keydown", {
                key: "ArrowRight",
                code: "ArrowRight",
                keyCode: 39, // legacy
                which: 39, // legacy
                bubbles: true, // allow it to bubble
                cancelable: true
            });
            // Dispatch the event on the active element or document body
            const target = document.activeElement || document.body;
            target.dispatchEvent(rightArrowEvent);
            console.log("Dispatched Right Arrow key press:", rightArrowEvent);
        }
    });
}));
