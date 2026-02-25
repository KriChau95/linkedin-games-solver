"use strict";
const SUDOKU_SIZE = 6;
const ROWS_OF_BOXES = 3;
const COLS_OF_BOXES = 2;
// 31/244
// export at end
function solve_sudoku(grid) {
    // maps box key to a list of all coordinates in that box
    let box_map = new Map();
    // populating the box_map 
    for (let r = 0; r < SUDOKU_SIZE; r++) {
        for (let c = 0; c < SUDOKU_SIZE; c++) {
            let box_key = get_box_key(r, c);
            if (!box_map.has(box_key)) {
                box_map.set(box_key, []);
            }
            const coord = [r, c];
            box_map.get(box_key).push(coord);
        }
    }
    const nums = [1, 2, 3, 4, 5];
    return nums;
}
// helper function to get box key from row and function
function get_box_key(r, c) {
    return Math.floor(r / COLS_OF_BOXES) * COLS_OF_BOXES + Math.floor(c / ROWS_OF_BOXES);
}
