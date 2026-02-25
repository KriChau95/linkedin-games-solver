"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solve_sudoku = solve_sudoku;
var SUDOKU_SIZE = 6;
var ROWS_OF_BOXES = 3;
var COLS_OF_BOXES = 2;
function solve_sudoku(grid) {
    // maps box key to a list of all coordinates in that box
    var box_map = new Map();
    // populating the box_map 
    for (var r = 0; r < SUDOKU_SIZE; r++) {
        for (var c = 0; c < SUDOKU_SIZE; c++) {
            var box_key = get_box_key(r, c);
            if (!box_map.has(box_key)) {
                box_map.set(box_key, []);
            }
            var coord = [r, c];
            box_map.get(box_key).push(coord);
        }
    }
    var nums = [1, 2, 3, 4, 5];
    return nums;
}
// helper function to get box key from row and function
function get_box_key(r, c) {
    return Math.floor(r / COLS_OF_BOXES) * COLS_OF_BOXES + Math.floor(c / ROWS_OF_BOXES);
}
