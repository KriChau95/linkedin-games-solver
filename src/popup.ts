// import types and functions from sudoku_solver
import { solve_queens, Tuple } from './queens_solver.js';
import type { KeyPress } from './sudoku_solver.js';
import { solve_sudoku } from './sudoku_solver.js';
import { solve_zip, wall } from './zip_solver.js';

document.getElementById("solve-btn")?.addEventListener("click", async() =>{

    // getting the current active tab
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tab = tabs[0];

    // return an error if no active tab found
    if (!tab?.id){
        return console.error("No active tab found!");
    }

    // extract current page URL
    const url = tab.url;

    // determine which game is being played

    if (url?.includes("sudoku")){

        // store the board by parsing the web page
        
        const board: number[][] = await chrome.scripting.executeScript({

            target: {tabId: tab.id},
            func: () => {

                // checking for iframe to ensure it works in both logged in and logged out version
                let root = document;

                const iframe = document.querySelector("iframe");

                if (iframe?.contentDocument) {
                    root = iframe.contentDocument;
                }

                // store raw cells as HTMLElement Array
                const cells = Array.from(root.querySelectorAll('.sudoku-cell')) as HTMLElement[];

                // initialize empty board
                const board: number[][] = [];
                const SUDOKU_SIZE = 6;

                // loop through 1D Array of cells to parse it into a 2D array - board
                for (let r = 0; r < SUDOKU_SIZE; r++){

                    const row: number[] = [];
                    
                    for (let c = 0; c < SUDOKU_SIZE; c++){
                    
                        const cellIdx = r * SUDOKU_SIZE + c;
                        const cell = cells[cellIdx];
                        const valueText = cell?.querySelector<HTMLElement>('.sudoku-cell-content')?.innerText.trim() || '';
                    
                        row.push(valueText === '' ? 0 : parseInt(valueText, 10));
                    }
                    
                    board.push(row);

                }

                return board;
            }

        }).then(res => res[0].result) || [];

        // get commands list from solve_sudoku function, passing in original board (2D array of elements (values: 0-6))
        let commands: KeyPress[] = solve_sudoku(board);

        // execute script to fill in sudoku by passing in commands in args list
        await chrome.scripting.executeScript({
            target: {tabId: tab.id, allFrames: true},
            func: (commands) => {

                // create a function called pressKey that takes in key, code, and keyCode of a key
                // and creates a Keyboard event for a full key press cycle simulation
                const pressKey = (key: string, code: string, keyCode: number) => {

                    // define active element (selected box) as target
                    const target = document.activeElement as HTMLElement;
                    
                    // simulate key down and key up event in succession to simulate clicking a key
                    ["keydown", "keyup"].forEach(type => {

                            const event = new KeyboardEvent(type, {
                                key, code, keyCode, which: keyCode, bubbles: true, cancelable: true
                            });
                            
                            target.dispatchEvent(event);
                        });
                        
                    };
                
                // execute each of the commands in commands by calling the pressKey function
                for (const [key, code, keyCode] of commands){
                    pressKey(key, code, keyCode);
                }

            },
            args: [commands]
        });
        
    } else if (url?.includes("queens")){

        const board: number[][] = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => {

                // checking for iframe to ensure it works in both logged in and logged out version
                let root = document;

                // const iframe = document.querySelector("iframe");

                // if (iframe?.contentDocument) {
                //     root = iframe.contentDocument;
                // }

                const gameBoard = document.getElementById("queens-game-board")
                
                let cells = null;
                if (gameBoard != null){
                    cells = gameBoard.querySelectorAll('[role="button"]')
                }

                let size = null;
                if (cells != null){
                    for (let i = 1; i < cells.length; i++){
                        if (Number(cells[i].getAttribute('aria-label')?.slice(-1)) < Number(cells[i-1].getAttribute('aria-label')?.slice(-1))){
                            size = Number(cells[i-1].getAttribute('aria-label')?.slice(-1));
                            break;
                        }
                    }
                }

                const board: number[][] = [];

                if (size == null || cells == null){
                    return;
                }

                let color_map = new Map();
                let color_val = 0;

                for (let r = 0; r < size; r++){

                    const row: number[] = [];
                    
                    for (let c = 0; c < size; c++){
                    
                        const cellIdx = r * size + c;
                        const cell = cells[cellIdx];
                        let description = cell.getAttribute('aria-label');

                        if (description == null){
                            return;
                        }
                        
                        const color = description.match(/color (.+?),/)?.[1] || '';

                        if (!color_map.has(color)){
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
        let queen_coords: Tuple[] = solve_queens(board);

        await chrome.scripting.executeScript({
            target: {tabId: tab.id, allFrames: true},
            func: async (queen_coords) => {

                const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

                const board = document.getElementById("queens-game-board");
                let cells = board?.querySelectorAll('[role="button"]') || [];
                const size = Math.sqrt(cells.length);

                const clickCell = (row: number, col: number) => {
                    
                    const idx = row * size + col;
                    const cell = cells[idx];

                    // try multiple click methods
                    ((cell.firstElementChild || cell) as HTMLElement).click();

                    cell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                    cell.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));

                };
                
                for (let [r, c] of queen_coords){
                    clickCell(r, c);
                    await sleep(10);
                    clickCell(r, c);
                    await sleep(10);
                }
},
            args: [queen_coords]
        });

    } else if (url?.includes("zip")){
        const [board, walls]: [number[][], wall[]] = await chrome.scripting.executeScript({

            target: {tabId: tab.id},
            func: () => {

                let cells = Array.from(document.querySelectorAll('[data-cell-idx]'));

                // initialize empty board
                const board: number[][] = [];
                const BOARD_SIZE = ~~Math.sqrt(cells.length);

                const walls: wall[] = [];

                // loop through 1D Array of cells to parse it into a 2D array - board
                for (let r = 0; r < BOARD_SIZE; r++){

                    const row: number[] = [];
                    
                    for (let c = 0; c < BOARD_SIZE; c++){
                        
                        // get current cell
                        const cellIdx = r * BOARD_SIZE + c;
                        const cell = cells[cellIdx];
                        
                        // get full cell and descendants (needed to process walls)
                        const complete_cell = [cell, ...cell.querySelectorAll('*')];

                        for (let element of complete_cell){

                            const after = window.getComputedStyle(element, '::after');
                            const border_right_width = after.getPropertyValue('border-right-width');
                            const border_bottom_width = after.getPropertyValue('border-bottom-width');

                            if (border_right_width != '0px'){
                                let curr_wall: wall = [r,c,r,c+1];
                                walls.push(curr_wall);
                            }

                            if (border_bottom_width != '0px'){
                                let curr_wall: wall = [r,c,r+1,c];
                                walls.push(curr_wall)
                            }
                     

                        }

                        const valueText = cell?.getAttribute('aria-label') || '';
                        const numText = valueText.substring(valueText.indexOf(' ') + 1)
                        row.push(valueText === '' ? 0 : parseInt(numText, 10));
                    }
                    
                    board.push(row);

                }

                return [board, walls] as [number[][], wall[]];
            }

        }).then(res => res[0].result) as [number[][], wall[]];

         // get commands list from solve_zip function, passing in original board (2D array of elements (values: 0-6))
        let commands: KeyPress[] = solve_zip(board, walls);

        console.log(commands);

        // execute script to fill in sudoku by passing in commands in args list
        await chrome.scripting.executeScript({
            target: {tabId: tab.id, allFrames: true},
            func: async (commands) => {

                const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

                // create a function called pressKey that takes in key, code, and keyCode of a key
                // and creates a Keyboard event for a full key press cycle simulation
                const pressKey = (key: string, code: string, keyCode: number) => {

                    // define active element (selected box) as target
                    const target = document.activeElement as HTMLElement;
                    
                    // simulate key down and key up event in succession to simulate clicking a key
                    ["keydown", "keyup"].forEach(type => {

                            const event = new KeyboardEvent(type, {
                                key, code, keyCode, which: keyCode, bubbles: true, cancelable: true
                            });
                            
                            target.dispatchEvent(event);
                        });
                        
                    };
                
                // execute each of the commands in commands by calling the pressKey function
                for (const [key, code, keyCode] of commands){
                    pressKey(key, code, keyCode);
                    await sleep(1);
                }

            },
            args: [commands]
        });
    }

})