// this file contains the sudoku_solver logic
// defining global constants
const SUDOKU_SIZE = 6;
const ROWS_OF_BOXES = 3;
const COLS_OF_BOXES = 2;
// maps box key to a list of all coordinates in that box
let BOX_MAP = new Map();
// populating the box_map 
for (let r = 0; r < SUDOKU_SIZE; r++) {
    for (let c = 0; c < SUDOKU_SIZE; c++) {
        let box_key = get_box_key(r, c);
        if (!BOX_MAP.has(box_key)) {
            BOX_MAP.set(box_key, []);
        }
        const coord = [r, c];
        BOX_MAP.get(box_key).push(coord);
    }
}
// solves sudoku and returns list of KeyPress commands that will interact with webpage to solve it
export function solve_sudoku(board) {
    // create an array of blank spaces to keep track of where to press buttons in solution
    let blank_space = [];
    for (let r = 0; r < SUDOKU_SIZE; r++) {
        let row = [];
        for (let c = 0; c < SUDOKU_SIZE; c++) {
            row.push(board[r][c] == 0);
        }
        blank_space.push(row);
    }
    // create a solver board to solve using baseline deductive reasoning and process of elimination
    // use binary bit strings to represent information
    // each box stores a bit string
    // for sure 1: 000001 (1)
    // for sure 2: 000010 (2)
    // ...
    // for sure 6: 100000 (32)
    // no clue at all - blank square: 111111 (63)
    // 0 represent position at that bit idx has no chance of being the actual value for the box
    // 1 means it has a chance based on current board constraints
    // initialize a solver board and populate it with the appropriate bit strings 
    let solver_board = Array.from({ length: 6 }, () => Array(6).fill(0));
    for (let r = 0; r < SUDOKU_SIZE; r++) {
        for (let c = 0; c < SUDOKU_SIZE; c++) {
            if (board[r][c] != 0) {
                solver_board[r][c] = Math.pow(2, (board[r][c] - 1));
            }
            else {
                solver_board[r][c] = Math.pow(2, SUDOKU_SIZE) - 1;
            }
        }
    }
    // repeatedly call 2 helper constraint satisfying solver functions that help narrow down and solve the sudoku
    while (true) {
        let changed_i = eliminate_impossible(solver_board);
        let changed_b = deduct_and_fill(solver_board);
        if (!changed_i && !changed_b) {
            break;
        }
    }
    // convert board back to 0-6 representation from intermediate bit string representation
    let [result_board, fully_solved] = bin_to_normal(solver_board);
    // if board is not fully solved after constraint satisfaction approach, fall back to dfs_solver 
    if (!fully_solved) {
        dfs_solver(result_board);
    }
    // return list of KeyPress commands for final solved board representation
    return solved_2D_to_commands(result_board, blank_space);
}
// function which returns list of KeyPress commands based on which spaces are originally blank and solved board
function solved_2D_to_commands(solved_board, blank_space) {
    let commands = [];
    // 1 Down Arrow key press used to focus to first top left Sudoku Cell
    let move = ["ArrowDown", "ArrowDown", 40];
    commands.push(move);
    // loop through Sudoku in snake pattern
    // left to right for even rows
    // right to left for odd rows
    for (let r = 0; r < SUDOKU_SIZE; r++) {
        if (r % 2 == 0) { // traverse left to right
            for (let c = 0; c < SUDOKU_SIZE; c++) {
                if (blank_space[r][c]) { // if empty spot, assign appropriate digit from solved board and append to commands
                    let value = solved_board[r][c];
                    let command = [value.toString(), "Digit".concat(value.toString()), 48 + value];
                    commands.push(command);
                }
                if (c < SUDOKU_SIZE - 1) { // increment right if not last cell in column
                    let move = ["ArrowRight", "ArrowRight", 39];
                    commands.push(move);
                }
            }
        }
        else { // traverse right to left
            for (let c = SUDOKU_SIZE - 1; c >= 0; c--) {
                if (blank_space[r][c]) {
                    let value = solved_board[r][c];
                    let command = [value.toString(), "Digit".concat(value.toString()), 48 + value];
                    commands.push(command);
                }
                if (c > 0) {
                    let move = ["ArrowLeft", "ArrowLeft", 37];
                    commands.push(move);
                }
            }
        }
        // as long as not last row, move down using down array
        if (r < SUDOKU_SIZE - 1) {
            let move = ["ArrowDown", "ArrowDown", 40];
            commands.push(move);
        }
    }
    // return list of KeyPress commands
    return commands;
}
// function to get box key from row and function
function get_box_key(r, c) {
    return Math.floor(r / COLS_OF_BOXES) * COLS_OF_BOXES + Math.floor(c / ROWS_OF_BOXES);
}
// function that returns whether or not 2 passed in 2D arrays are equal
function equal2D(board_1, board_2) {
    for (let i = 0; i < board_1.length; i++) {
        for (let j = 0; j < board_1[i].length; j++) {
            if (board_1[i][j] != board_2[i][j]) {
                return false;
            }
        }
    }
    return true;
}
// function that converts bit string sudoku back to original 0-6 version 
// and returns whether or not it is fully solved
function bin_to_normal(bin_board) {
    let fully_solved = true;
    let result_board = [];
    for (let r = 0; r < SUDOKU_SIZE; r++) {
        let row = [];
        for (let c = 0; c < SUDOKU_SIZE; c++) {
            // if cell is a power of 2, it is solved based on bit string math, 
            // otherwise, it is unsolved and mark it as 0
            if (~~(Math.log2(bin_board[r][c])) == Math.log2(bin_board[r][c])) {
                row.push(~~(Math.log2(bin_board[r][c])) + 1);
            }
            else {
                fully_solved = false;
                row.push(0);
            }
        }
        result_board.push(row);
    }
    // return 2 values: result board, and a boolean indicating whether or not the board is fully solved
    return [result_board, fully_solved];
}
// helper function that uses existing filled in numbers to rules out possibilities 
// based on commonality across row, column, diagonal
// e.g., if there is a 1 that is filled out somewhere on the board, ensure that all the bit strings for 
// that 1's row, column, and box are zeroed out at the one position
function eliminate_impossible(board) {
    const old_board = board.map(row => [...row]);
    // if bit string is a power of 2, we have narrowed down value at that position to exactly 1 number
    const deterministic_bit_strs = new Set([1, 2, 4, 8, 16, 32]);
    for (let r = 0; r < SUDOKU_SIZE; r++) {
        for (let c = 0; c < SUDOKU_SIZE; c++) {
            if (deterministic_bit_strs.has(board[r][c])) {
                // enforce one instance per column
                for (let other_r = 0; other_r < SUDOKU_SIZE; other_r++) {
                    if (other_r != r) {
                        board[other_r][c] &= ~board[r][c];
                    }
                }
                // enforce one instance per row
                for (let other_c = 0; other_c < SUDOKU_SIZE; other_c++) {
                    if (other_c != c) {
                        board[r][other_c] &= ~board[r][c];
                    }
                }
                // enforce one instance per box
                for (let [other_r, other_c] of BOX_MAP.get(get_box_key(r, c))) {
                    if (other_r != r || other_c != c) {
                        board[other_r][other_c] &= ~board[r][c];
                    }
                }
            }
        }
    }
    // return true if changes were made, false othewise
    return !equal2D(old_board, board);
}
// helper function that iterates through each row, column, and box to check the following:
// if there is only one cell in that row, column, or diagonal that can be a certain number, 
// fill that cell out with that number, for example, if 1 cannot be in 5 other cells in a box, 
// fill out a 1 in the remaining cell leverages bit manipulations to ensure this
function deduct_and_fill(board) {
    const old_board = board.map(row => [...row]);
    // check for rows
    for (let r = 0; r < SUDOKU_SIZE; r++) {
        for (let shift = 0; shift < SUDOKU_SIZE; shift++) {
            let summation = 0;
            let spot = [-1, -1];
            for (let c = 0; c < SUDOKU_SIZE; c++) {
                summation += (board[r][c] & (Math.pow(2, shift))) >> shift;
                if ((board[r][c] & (Math.pow(2, shift))) >> shift == 1) {
                    spot = [r, c];
                }
            }
            if (summation == 1) {
                board[spot[0]][spot[1]] = Math.pow(2, shift);
            }
        }
    }
    // check for columns
    for (let c = 0; c < SUDOKU_SIZE; c++) {
        for (let shift = 0; shift < SUDOKU_SIZE; shift++) {
            let summation = 0;
            let spot = [-1, -1];
            for (let r = 0; r < SUDOKU_SIZE; r++) {
                summation += (board[r][c] & (Math.pow(2, shift))) >> shift;
                if ((board[r][c] & (Math.pow(2, shift))) >> shift == 1) {
                    spot = [r, c];
                }
            }
            if (summation == 1) {
                board[spot[0]][spot[1]] = Math.pow(2, shift);
            }
        }
    }
    // check for boxes
    for (let box of BOX_MAP.values()) {
        for (let shift = 0; shift < SUDOKU_SIZE; shift++) {
            let summation = 0;
            let spot = [-1, -1];
            for (const [r, c] of box) {
                summation += (board[r][c] & (Math.pow(2, shift))) >> shift;
                if ((board[r][c] & (Math.pow(2, shift))) >> shift == 1) {
                    spot = [r, c];
                }
            }
            if (summation == 1) {
                board[spot[0]][spot[1]] = Math.pow(2, shift);
            }
        }
    }
    return !equal2D(old_board, board);
}
// helper function that solves a Sudoku by a backtracking approach that parallels the essence of DFS
// only called if normal deductive and elimination techniques did not work
function dfs_solver(board) {
    // setting up and populating dictionaries of sets to keep track of nums in each row, col, box
    let rows = new Map();
    let cols = new Map();
    let boxes = new Map();
    for (let i = 0; i < SUDOKU_SIZE; i++) {
        rows.set(i, new Set());
        cols.set(i, new Set());
        boxes.set(i, new Set());
    }
    // adding all the existing filled in numbers to the hashmap of row, col, box 
    // (key = idx, item = set of numbers so far)
    for (let r = 0; r < SUDOKU_SIZE; r++) {
        for (let c = 0; c < SUDOKU_SIZE; c++) {
            let num = board[r][c];
            if (num != 0) {
                rows.get(r).add(num);
                cols.get(c).add(num);
                let box_key = get_box_key(r, c);
                boxes.get(box_key).add(num);
            }
        }
    }
    // helper to guide left to right, top to down, fill out and backtrack approach
    function next_place(r, c) {
        if (c == SUDOKU_SIZE - 1) {
            return [r + 1, 0];
        }
        else {
            return [r, c + 1];
        }
    }
    // actual backtracking function that attempts to fill out recursively, ensuring constraints are satisfied,
    // backtracks if fails and retries until entire Sudoku filled
    function backtrack(r, c) {
        if (r >= SUDOKU_SIZE) {
            return true;
        }
        let [nr, nc] = next_place(r, c);
        if (board[r][c] != 0) {
            return backtrack(nr, nc);
        }
        for (let i = 1; i < SUDOKU_SIZE + 1; i++) {
            let box_key = get_box_key(r, c);
            if (!rows.get(r).has(i) && !cols.get(c).has(i) && !boxes.get(box_key).has(i)) {
                board[r][c] = i;
                rows.get(r).add(i);
                cols.get(c).add(i);
                boxes.get(box_key).add(i);
                if (backtrack(nr, nc)) {
                    return true;
                }
                board[r][c] = 0;
                rows.get(r).delete(i);
                cols.get(c).delete(i);
                boxes.get(box_key).delete(i);
            }
        }
        return false;
    }
    backtrack(0, 0);
}
