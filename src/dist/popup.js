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
import { solve_sudoku } from './sudoku_solver.js';
(_a = document.getElementById("solve-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    // Getting the current active tab
    const tabs = yield chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    // return an error if no active tab found
    if (!(tab === null || tab === void 0 ? void 0 : tab.id)) {
        return console.error("No active tab found!");
    }
    const url = tab.url;
    console.log("Current URL:", url);
    if (url === null || url === void 0 ? void 0 : url.includes("sudoku")) {
        // store the board by parsing the web page
        const board = (yield chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                var _a;
                // checking for iframe to ensure it works in both logged in and logged out version
                let root = document;
                const iframe = document.querySelector("iframe");
                if (iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) {
                    root = iframe.contentDocument;
                }
                // store raw cells as HTMLElement Array
                const cells = Array.from(root.querySelectorAll('.sudoku-cell'));
                // initialize empty board
                const board = [];
                const SUDOKU_SIZE = 6;
                // loop through 1D Array of cells to parse it into a 2D array - board
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
                return board;
            }
        }).then(res => res[0].result)) || [];
        // get commands list from solve_sudoku function, passing in original board (2D array of elements (values: 0-6))
        let commands = solve_sudoku(board);
        // execute script to fill in sudoku by passing in commands in args list
        yield chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: (commands) => {
                // create a function called pressKey that takes in key, code, and keyCode of a key
                // and creates a Keyboard event for a full key press cycle simulation
                const pressKey = (key, code, keyCode) => {
                    // define active element (selected box) as target
                    const target = document.activeElement;
                    // simulate key down and key up event in succession to simulate clicking a key
                    ["keydown", "keyup"].forEach(type => {
                        const event = new KeyboardEvent(type, {
                            key, code, keyCode, which: keyCode, bubbles: true, cancelable: true
                        });
                        target.dispatchEvent(event);
                    });
                };
                // execute each of the commands in commands by calling the pressKey function
                for (const [key, code, keyCode] of commands) {
                    pressKey(key, code, keyCode);
                }
            },
            args: [commands]
        });
    }
    else if (url === null || url === void 0 ? void 0 : url.includes("queens")) {
        const cells = Array.from(document.querySelectorAll('[aria-label^=Empty cell]'));
        console.log("queens");
        console.log(cells);
    }
}));
