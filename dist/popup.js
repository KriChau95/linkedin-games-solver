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
console.log(document.getElementById("solve-btn"));
(_a = document.getElementById("solve-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    // Getting the current active tab
    const tabs = yield chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!(tab === null || tab === void 0 ? void 0 : tab.id)) {
        return console.error("No active tab found!");
    }
    // Inject script into the page
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // 1. Extract Sudoku Grid
            var _a;
            const cells = Array.from(document.querySelectorAll('.sudoku-cell'));
            console.log(cells);
            const board = [];
            const SUDOKU_SIZE = 6;
            for (let r = 0; r < SUDOKU_SIZE; r++) {
                const row = [];
                for (let c = 0; c < SUDOKU_SIZE; c++) {
                    const cellIdx = r * SUDOKU_SIZE + c;
                    const cell = cells[cellIdx];
                    const valueText = ((_a = cell === null || cell === void 0 ? void 0 : cell.querySelector('.sudoku-cell-content')) === null || _a === void 0 ? void 0 : _a.innerText.trim()) || '';
                    row.push(valueText === '' ? 0 : parseInt(valueText, 10));
                }
                board.push(row);
            }
            console.log(board);
            // 2. Solve Sudoku
        }
    });
}));
// document.getElementById("solve-btn")?.addEventListener("click", async () => {
//     // Get the current active tab
//     const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//     const tab = tabs[0];
//     if (!tab?.id) return console.error("No active tab found!");
//     // Inject script into the page
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         func: () => {
//             // --- Extract the Sudoku grid ---
//             const cells = Array.from(document.querySelectorAll('.sudoku-cell')) as HTMLElement[];
//             const gridSize = 6; // standard Sudoku
//             const grid: number[][] = [];
//             for (let row = 0; row < gridSize; row++) {
//                 const rowData: number[] = [];
//                 for (let col = 0; col < gridSize; col++) {
//                     const cellIndex = row * gridSize + col;
//                     const cell = cells[cellIndex];
//                     const valueText = cell?.querySelector<HTMLElement>('.sudoku-cell-content')?.innerText.trim() || '';
//                     rowData.push(valueText === '' ? 0 : parseInt(valueText, 10));
//                 }
//                 grid.push(rowData);
//             }
//             console.log("Extracted Sudoku Grid:", grid);
//             // --- Focus the active cell and simulate keypress ---
//             const activeCell = document.querySelector<HTMLElement>(".sudoku-cell-active");
//             if (!activeCell) return console.warn("No active Sudoku cell!");
//             activeCell.focus();
//             const pressKey = (key: string, code: string, keyCode: number) => {
//                 ["keydown", "keyup"].forEach(type => {
//                     const event = new KeyboardEvent(type, {
//                         key, code, keyCode, which: keyCode, bubbles: true, cancelable: true
//                     });
//                     activeCell.dispatchEvent(event);
//                 });
//             };
//             // Example: type "1" and move right
//             pressKey("1", "Digit1", 49);
//             pressKey("ArrowRight", "ArrowRight", 39);
//             console.log("Dispatched 1 keypress to the active cell");
//         }
//     });
// });
