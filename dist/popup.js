// import types and functions from sudoku_solver
import { solve_queens } from './queens_solver.js';
import { solve_sudoku } from './sudoku_solver.js';
import { solve_zip } from './zip_solver.js';
import { solve_tango } from './tango_solver.js';
const solver_label = document.getElementById("solver-label");
const button = document.getElementById("solve-btn");
(async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    const url = tab?.url ?? "";
    if (url.includes("sudoku")) {
        button.classList.add("sudoku");
    }
    else if (url.includes("queens")) {
        button.classList.add("queens");
    }
    else if (url.includes("tango")) {
        button.classList.add("tango");
    }
    else if (url.includes("zip")) {
        button.classList.add("zip");
    }
})();
document.getElementById("solve-btn")?.addEventListener("click", async () => {
    // getting the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    // return an error if no active tab found
    if (!tab?.id) {
        return console.error("No active tab found!");
    }
    // extract current page URL
    const url = tab.url;
    // determine which game is being played
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
    else if (url?.includes("queens")) { // queens solver
        // extract the board by getting each cell
        const frameResults = await chrome.scripting.executeScript({
            target: {
                tabId: tab.id,
                allFrames: true,
            },
            func: () => {
                const grid = document.getElementById("queens-grid");
                return grid?.querySelectorAll('[role="button"]').length ?? 0;
            },
        });
        console.log(frameResults);
        const queensFrameId = frameResults.find(r => (r.result ?? 0) > 0)?.frameId || 0;
        const board = await chrome.scripting.executeScript({
            target: { tabId: tab.id, frameIds: [queensFrameId] },
            func: () => {
                // checking for iframe to ensure it works in both logged in and logged out version
                let root = document;
                // const iframe = document.querySelector("iframe");
                // if (iframe?.contentDocument) {
                //     root = iframe.contentDocument;
                // }
                let gameBoard = document.getElementById("queens-game-board");
                let cells = null;
                // every cell in the queens board has a role = "button" attribute
                if (gameBoard != null) {
                    cells = gameBoard.querySelectorAll('[role="button"]');
                }
                else {
                    gameBoard = document.getElementById("queens-grid");
                    if (gameBoard != null) {
                        cells = gameBoard.querySelectorAll('[role="button"]');
                        console.log(cells);
                    }
                }
                // determine overall board size by examining the aria-label attribute of each cell and finding the end of the first row
                let size = null;
                if (cells != null) {
                    for (let i = 1; i < cells.length; i++) {
                        if (Number(cells[i].getAttribute('aria-label')?.slice(-1)) < Number(cells[i - 1].getAttribute('aria-label')?.slice(-1))) {
                            size = Number(cells[i - 1].getAttribute('aria-label')?.slice(-1));
                            break;
                        }
                    }
                }
                // board construction
                const board = [];
                if (size == null || cells == null) {
                    return;
                }
                // create a map from color text string description to color idx (how it is represented in solver)
                let color_map = new Map();
                let color_val = 0;
                // iterate over the entire board
                for (let r = 0; r < size; r++) {
                    const row = [];
                    for (let c = 0; c < size; c++) {
                        // examine the current cell
                        const cellIdx = r * size + c;
                        const cell = cells[cellIdx];
                        // get the description of the cell via the aria-label attribute
                        // sample description: "Empty cell of color Rose Pink, row 1, column 2"
                        let description = cell.getAttribute('aria-label');
                        if (description == null) {
                            return;
                        }
                        // examine the color of the label by looking at where "color" occurs then the following characters until there is a comma
                        // . : match any non-newline character
                        // + : grab as much as possible
                        // ? : grab as little as possible for regex to work
                        const color = description.match(/color (.+?),/)?.[1] || '';
                        // set key = color text string, value = color index
                        if (!color_map.has(color)) {
                            color_map.set(color, color_val);
                            color_val++;
                        }
                        // add the numberic representation of the color to the board
                        row.push(color_map.get(color));
                    }
                    board.push(row);
                }
                console.log(board);
                return board;
            }
        }).then(res => res[0].result) || [];
        // the coordinates of the queens (r,c) ... from the solve_queens function
        let queen_coords = solve_queens(board);
        // fill in queens board
        await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            // use an asynchronous function because all clicks immediately back to back does not work, so we incorporate sleep
            func: async (queen_coords) => {
                // define a function that represents sleeping for ms milliseconds
                const sleep = (ms) => new Promise(r => setTimeout(r, ms));
                // get the board and cells from the page
                let board = document.getElementById("queens-game-board");
                let cells = board?.querySelectorAll('[role="button"]') || [];
                if (cells.length == 0) {
                    board = document.getElementById("queens-grid");
                    cells = board?.querySelectorAll('[role="button"]') || [];
                }
                // determine the board size
                const size = Math.sqrt(cells.length);
                // define a function that clicks a cell based on its row and column
                const clickCell = (row, col) => {
                    // determine current cell
                    const idx = row * size + col;
                    const cell = cells[idx];
                    // try multiple click methods: first one is 
                    (cell.firstElementChild || cell).click();
                    cell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                    cell.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                };
                for (let [r, c] of queen_coords) {
                    clickCell(r, c);
                    await sleep(10);
                    clickCell(r, c);
                    await sleep(10);
                }
            },
            args: [queen_coords]
        });
    }
    else if (url?.includes("zip")) {
        // parse board and save representation as 2D array of board, and list of wall coordinates
        const [board, walls] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                let root = document;
                // process all the cells into an array
                let cells = Array.from(root.querySelectorAll('[data-cell-idx]'));
                if (cells.length == 0) {
                    const iframe = document.querySelector("iframe");
                    if (iframe?.contentDocument) {
                        root = iframe.contentDocument;
                        cells = Array.from(root.querySelectorAll('[data-cell-idx]'));
                    }
                }
                console.log(cells);
                // initialize empty board
                const board = [];
                // determine the board size as a square root of total number of cells in the board
                const BOARD_SIZE = ~~Math.sqrt(cells.length);
                // initialize empty list of walls
                const walls = [];
                // loop through 1D Array of cells to parse it into a 2D array - board
                for (let r = 0; r < BOARD_SIZE; r++) {
                    const row = [];
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        // get current cell
                        const cellIdx = r * BOARD_SIZE + c;
                        const cell = cells[cellIdx];
                        // get full cell and descendants (needed to process walls)
                        const complete_cell = [cell, ...cell.querySelectorAll('*')];
                        // examine all descendants of the cell
                        for (let element of complete_cell) {
                            // check for attributes indicating presence of a wall
                            const after = window.getComputedStyle(element, '::after');
                            const border_right_width = after.getPropertyValue('border-right-width');
                            const border_bottom_width = after.getPropertyValue('border-bottom-width');
                            // if there is a right wall, store curr cell and cell to the right info to walls
                            if (border_right_width != '0px') {
                                let curr_wall = [r, c, r, c + 1];
                                walls.push(curr_wall);
                            }
                            // if there is a bottom wall, store curr cell and cell to the bottom info to walls
                            if (border_bottom_width != '0px') {
                                let curr_wall = [r, c, r + 1, c];
                                walls.push(curr_wall);
                            }
                        }
                        // extract value of number at the cell if there is any
                        console.log(cell);
                        const valueText = cell?.getAttribute('aria-label') || cell?.querySelector('.trail-cell-content')?.textContent?.trim() || '';
                        const numText = valueText.substring(valueText.indexOf(' ') + 1);
                        // save number as is if present, otherwise save it as 0
                        row.push(valueText === '' ? 0 : parseInt(numText, 10));
                    }
                    board.push(row);
                }
                console.log(board);
                console.log(walls);
                return [board, walls];
            }
        }).then(res => res[0].result);
        // get commands list from solve_zip function, passing in original board (2D array of elements (values: 0-6))
        let commands = solve_zip(board, walls);
        // execute script to fill in sudoku by passing in commands in args list
        await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: async (commands) => {
                // helper sleep function to pause between key presses to enable extension
                // to interact reasonably with the webpage
                const sleep = (ms) => new Promise(r => setTimeout(r, ms));
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
                    await sleep(1);
                }
            },
            args: [commands]
        });
    }
    else if (url?.includes("tango")) {
        const frameResults = await chrome.scripting.executeScript({
            target: {
                tabId: tab.id,
                allFrames: true,
            },
            func: () => {
                const grid = document.querySelector(".lotka-grid");
                console.log(grid);
                return grid?.querySelectorAll('[role="button"]').length ?? 0;
            },
        });
        console.log(frameResults);
        const tangoBoardId = frameResults.find(r => (r.result ?? 0) > 0)?.frameId || 0;
        const [board, equals, crosses] = await chrome.scripting.executeScript({
            target: { tabId: tab.id, frameIds: [tangoBoardId] },
            func: () => {
                // checking for iframe to ensure it works in both logged in and logged out version
                let root = document;
                // store raw cells as HTMLElement Array
                let info = Array.from(root.querySelectorAll('[id^=tango-cell]'));
                console.log(info);
                if (info.length == 0) {
                    info = Array.from(root.querySelectorAll('[id^=lotka-cell]'));
                    console.log(info);
                }
                let cells = [];
                for (let i = 0; i < info.length; i += 2) {
                    cells.push(info[i]);
                }
                console.log(cells);
                const board = [];
                const SIZE = 6;
                for (let r = 0; r < SIZE; r++) {
                    const row = [];
                    for (let c = 0; c < SIZE; c++) {
                        const cellIdx = r * SIZE + c;
                        const cell = cells[cellIdx];
                        if (cell.innerHTML.includes("Sun")) {
                            row.push(1);
                        }
                        else if (cell.innerHTML.includes("Moon")) {
                            row.push(2);
                        }
                        else {
                            row.push(0);
                        }
                    }
                    board.push(row);
                }
                let equals = [];
                let crosses = [];
                for (let i = 0; i < cells.length; i++) {
                    let r = Math.floor(i / SIZE);
                    let c = i % SIZE;
                    if (cells[i].innerHTML.includes('equal') || cells[i].innerHTML.includes('Equal')) {
                        let constraints = cells[i].querySelectorAll('[data-testid="edge-equal"]');
                        if (constraints.length == 0) {
                            constraints = cells[i].querySelectorAll('[id="="]');
                        }
                        for (let constraint of constraints) {
                            const cell_rect = cells[i].getBoundingClientRect(); // obtain bounding rectangle for full cell
                            const constraint_rect = constraint?.getBoundingClientRect(); // obtain bounding rectangle for equal/cross (constraint)
                            if (cell_rect && constraint_rect) {
                                // top: y = 0
                                // left: x = 0
                                const constraint_center_x = constraint_rect.left + constraint_rect.width / 2; // determine constraint center x coordinate
                                const constraint_center_y = constraint_rect.top + constraint_rect.height / 2; // determine constraint center y coordinate
                                const relative_x = constraint_center_x - cell_rect.left; // delta x between top left of cell and constraint center x
                                const relative_y = constraint_center_y - cell_rect.top; // delta y between top left of cell and constraint center y
                                if (relative_y > relative_x) {
                                    console.log("bottom edge");
                                    let con = [r, c, r + 1, c];
                                    equals.push(con);
                                }
                                else {
                                    console.log("right edge");
                                    let con = [r, c, r, c + 1];
                                    equals.push(con);
                                }
                            }
                        }
                        console.log(cells[i].offsetHeight + "," + cells[i].offsetLeft, +"," + cells[i].offsetTop + "," + cells[i].offsetWidth);
                    }
                    else if (cells[i].innerHTML.includes('cross') || cells[i].innerHTML.includes('Cross')) {
                        let constraints = cells[i].querySelectorAll('[data-testid="edge-cross"]');
                        if (constraints.length == 0) {
                            constraints = cells[i].querySelectorAll('.lotka-edge-sign-path:not([id])');
                        }
                        for (let constraint of constraints) {
                            const cell_rect = cells[i].getBoundingClientRect(); // obtain bounding rectangle for full cell
                            const constraint_rect = constraint?.getBoundingClientRect(); // obtain bounding rectangle for equal/cross (constraint)
                            if (cell_rect && constraint_rect) {
                                // top: y = 0
                                // left: x = 0
                                const constraint_center_x = constraint_rect.left + constraint_rect.width / 2; // determine constraint center x coordinate
                                const constraint_center_y = constraint_rect.top + constraint_rect.height / 2; // determine constraint center y coordinate
                                const relative_x = constraint_center_x - cell_rect.left; // delta x between top left of cell and constraint center x
                                const relative_y = constraint_center_y - cell_rect.top; // delta y between top left of cell and constraint center y
                                if (relative_y > relative_x) {
                                    console.log("bottom edge");
                                    let con = [r, c, r + 1, c];
                                    crosses.push(con);
                                }
                                else {
                                    console.log("right edge");
                                    let con = [r, c, r, c + 1];
                                    crosses.push(con);
                                }
                            }
                        }
                    }
                }
                console.log(equals);
                console.log(crosses);
                return [board, equals, crosses];
            }
        }).then(res => res[0].result);
        // the coordinates of the queens (r,c) ... from the solve_queens function
        let solved_tango = solve_tango(board, equals, crosses);
        console.log(solved_tango);
        // fill in queens board
        await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            // use an asynchronous function because all clicks immediately back to back does not work, so we incorporate sleep
            func: async (solved_tango) => {
                // define a function that represents sleeping for ms milliseconds
                const sleep = (ms) => new Promise(r => setTimeout(r, ms));
                // get the board and cells from the page
                let board = document.querySelector('[data-testid="tango-gameboard-wrapper"]');
                let cells = board?.querySelectorAll('[role="button"]') || [];
                if (cells.length == 0) {
                    board = document.querySelector(".lotka-grid");
                    cells = board?.querySelectorAll('[role="button"]') || [];
                }
                // determine the board size
                const size = Math.sqrt(cells.length);
                // define a function that clicks a cell based on its row and column
                const clickCell = (row, col) => {
                    // determine current cell
                    const idx = row * size + col;
                    const cell = cells[idx];
                    // try multiple click methods: first one is 
                    (cell.firstElementChild || cell).click();
                    cell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                    cell.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                };
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        for (let cl = 0; cl < solved_tango[r][c]; cl++) {
                            clickCell(r, c);
                            await sleep(1);
                        }
                    }
                }
            },
            args: [solved_tango]
        });
    }
});
