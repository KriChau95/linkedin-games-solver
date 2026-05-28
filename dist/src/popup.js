// import types and functions from sudoku_solver
import { solve_queens } from './queens_solver.js';
import { solve_sudoku } from './sudoku_solver.js';
document.getElementById("solve-btn")?.addEventListener("click", async () => {
    // Getting the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    // return an error if no active tab found
    if (!tab?.id) {
        return console.error("No active tab found!");
    }
    const url = tab.url;
    console.log("Current URL:", url);
    if (url?.includes("sudoku")) {
        // store the board by parsing the web page
        const board = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // checking for iframe to ensure it works in both logged in and logged out version
                let root = document;
                const iframe = document.querySelector("iframe");
                if (iframe?.contentDocument) {
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
                        const valueText = cell?.querySelector('.sudoku-cell-content')?.innerText.trim() || '';
                        row.push(valueText === '' ? 0 : parseInt(valueText, 10));
                    }
                    board.push(row);
                }
                return board;
            }
        }).then(res => res[0].result) || [];
        // get commands list from solve_sudoku function, passing in original board (2D array of elements (values: 0-6))
        let commands = solve_sudoku(board);
        // execute script to fill in sudoku by passing in commands in args list
        await chrome.scripting.executeScript({
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
    else if (url?.includes("queens")) {
        // adjust delay as needed
        console.log("queens");
        const board = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // checking for iframe to ensure it works in both logged in and logged out version
                let root = document;
                // const iframe = document.querySelector("iframe");
                // if (iframe?.contentDocument) {
                //     root = iframe.contentDocument;
                // }
                const gameBoard = document.getElementById("queens-game-board");
                let cells = null;
                if (gameBoard != null) {
                    cells = gameBoard.querySelectorAll('[role="button"]');
                }
                let size = null;
                if (cells != null) {
                    for (let i = 1; i < cells.length; i++) {
                        if (Number(cells[i].getAttribute('aria-label')?.slice(-1)) < Number(cells[i - 1].getAttribute('aria-label')?.slice(-1))) {
                            size = Number(cells[i - 1].getAttribute('aria-label')?.slice(-1));
                            break;
                        }
                    }
                }
                const board = [];
                if (size == null || cells == null) {
                    return;
                }
                let color_map = new Map();
                let color_val = 0;
                for (let r = 0; r < size; r++) {
                    const row = [];
                    for (let c = 0; c < size; c++) {
                        const cellIdx = r * size + c;
                        const cell = cells[cellIdx];
                        let description = cell.getAttribute('aria-label');
                        if (description == null) {
                            return;
                        }
                        const color = description.match(/color (.+?),/)?.[1] || '';
                        if (!color_map.has(color)) {
                            color_map.set(color, color_val);
                            color_val++;
                        }
                        row.push(color_map.get(color));
                    }
                    board.push(row);
                }
                return board;
            }
        }).then(res => res[0].result) || [];
        // get commands list from solve_sudoku function, passing in original board (2D array of elements (values: 0-6))
        let commands = solve_queens(board);
        console.log(commands);
        // execute script to fill in sudoku by passing in commands in args list
        await chrome.scripting.executeScript({
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
});
