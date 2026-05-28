"use strict";
// this file contains the queens_solver logic
function solve_queens(board) {
    // determine board size
    const SIZE = board.length;
    // create an populate groups based on board:
    // groups: hashmap where key is group number, and values is list of tuple coordinates        
    let groups = new Map();
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            let group_id = board[r][c];
            if (!groups.has(group_id)) {
                groups.set(group_id, []);
            }
            const coord = [r, c];
            groups.get(group_id).push(coord);
        }
    }
    // state_board represents state for each cell in the grid during the solving process
    // 0 - impossible for a queen to be there
    // 1 - possible for a queen to be there, but not guaranteed
    // 2 - sure that there is a queen there
    // all cells start in state 1 and can transition to either state 0 or 2, which are terminal states
    let state_board = [];
    for (let r = 0; r < SIZE; r++) {
        let row = [];
        for (let c = 0; c < SIZE; c++) {
            row.push(1);
        }
        state_board.push(row);
    }
    let solved = false;
    // until we find a solution or run into a situation where we have to guess
    while (true) {
        let start_board = board.map(row => [...row]);
        let start_state_board = state_board.map(row => [...row]);
        let [new_bool_board, new_groups] = eliminate_impossible(board, state_board, groups);
        state_board = new_bool_board.map(row => [...row]);
        groups = clone_groups(new_groups);
        [new_bool_board, new_groups] = pigeonhole_rows_cols(board, state_board, groups);
        state_board = new_bool_board.map(row => [...row]);
        groups = clone_groups(new_groups);
        [new_bool_board, new_groups] = try_place_queens(board, state_board, groups);
        state_board = new_bool_board.map(row => [...row]);
        groups = clone_groups(new_groups);
        // check if we have found a solution by checking if all queens have been placed
        let queens_placed = 0;
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (state_board[r][c] == 2) {
                    queens_placed++;
                }
            }
        }
        if (queens_placed == SIZE) {
            solved = true;
            break;
        }
        // if we make no progress using CSP approach, we exit and default to DFS
        if (equal2D(start_board, board) && equal2D(start_state_board, state_board)) {
            break;
        }
    }
    let result = state_board;
    if (!solved) {
        result = dfs_solver(board, state_board);
    }
    console.log(result);
    return result;
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
// helper function to clone group dictionary
function clone_groups(groups) {
    return new Map([...groups].map(([k, v]) => [
        k,
        v.map(([r, c]) => [r, c])
    ]));
}
// helper method that eliminates cells that for sure cannot contain the queen
// considers a block, if a queen in any of the cells in a block for sure eliminates some cell outside that block,
// eliminates that cell
// moves cells from state 1 to state 0
// takes in board (constant representation of initial game), state_board (current states of each cell), and groups (currently viable cells in each group (in state 1 or 2))
function eliminate_impossible(board, state_board, groups) {
    let SIZE = board.length;
    // list to store coordinates that will be moved to the 0-state (eliminated)
    let x_cells = [];
    // iterate over all cells in each group
    for (let cells of groups.values()) {
        // do the following for the current group
        let eliminated = new Map();
        // create a helper hashmap: eliminated, with key = cell coordinate (r,c),
        // and values = how many of the cells in the current group would would eliminate that cell
        for (let cell of cells) {
            let r = cell[0];
            let c = cell[1];
            for (let i = 0; i < SIZE; i++) {
                let col_coord = `(${i},${c})`;
                if (!eliminated.has(col_coord)) {
                    eliminated.set(col_coord, 0);
                }
                eliminated.set(col_coord, eliminated.get(col_coord) + 1);
                let row_coord = `(${r},${i})`;
                if (!eliminated.has(row_coord)) {
                    eliminated.set(row_coord, 0);
                }
                eliminated.set(row_coord, eliminated.get(row_coord) + 1);
            }
            for (let [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                let nr = r + dr;
                let nc = c + dc;
                let new_coord = `(${nr},${nc})`;
                if (0 <= nr && nr < SIZE && 0 <= nc && nc < SIZE) {
                    if (!eliminated.has(new_coord)) {
                        eliminated.set(new_coord, 0);
                    }
                    eliminated.set(new_coord, eliminated.get(new_coord) + 1);
                }
            }
        }
        // if all cells in that group eliminate it, remove it from consideration - move from state 1 to 0
        let string_cells = [];
        for (let i = 0; i < cells.length; i++) {
            string_cells.push(`(${cells[i][0]},${cells[i][1]})`);
        }
        for (let [coord, freq] of eliminated) {
            if (freq == cells.length && !string_cells.includes(coord)) {
                const [r, c] = coord.slice(1, -1).split(",").map(Number);
                x_cells.push([r, c]);
            }
        }
    }
    // update state board accordingly
    for (let [r, c] of x_cells) {
        state_board[r][c] = 0;
    }
    // update groups hashmap accordingly
    let new_groups = new Map();
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state_board[r][c] == 1) {
                if (!new_groups.has(board[r][c])) {
                    new_groups.set(board[r][c], []);
                }
                new_groups.get(board[r][c]).push([r, c]);
            }
        }
    }
    return [state_board, new_groups];
}
// helper method that uses a line of deductive reasoning to eliminate impossible cells
// for example if I focus on 2 columns, and there are
// two distinct 2x2 blocks in them
// since each column must contain one queen, regardless of how I place the queens in these 2 blocks,
// cells in both columns outside the two 2x2 blocks will automatically be eliminated
// reapply this reasoning for rows, and for combinations of 3-4 rows/columns
function pigeonhole_rows_cols(board, state_board, groups) {
    let SIZE = board.length;
    let chosen_groups = [];
    let chosen_cols = [];
    let ids = Array.from({ length: SIZE }, (_, i) => i);
    // generate a list of lists, where each individual list is a list of column indices of size 2,3,4, or 5
    let col_sets = get_combos(ids, 2, 5);
    // for each set of columns
    for (let col_set of col_sets) {
        // use helper group_freq hashmap to see if all remaining possible cells of a block are contained in the current set of columns
        let group_freq = new Map();
        let selected_set = [];
        for (let c of col_set) {
            for (let r = 0; r < SIZE; r++) {
                if (state_board[r][c]) {
                    if (!group_freq.has(board[r][c])) {
                        group_freq.set(board[r][c], 0);
                    }
                    group_freq.set(board[r][c], group_freq.get(board[r][c]) + 1);
                }
            }
        }
        for (let [block_id, freq] of group_freq) {
            if (freq == groups.get(block_id)?.length) {
                selected_set.push(block_id);
            }
        }
        // if they are, add the column indices, as well as the blocks that are involved to lists for storage
        if (selected_set.length == col_set.length) {
            chosen_cols.push(col_set);
            chosen_groups.push(selected_set);
        }
    }
    // iterate through the lists and eliminate the appropriate cells: in the column, but not in the blocks
    for (let i = 0; i < chosen_groups.length; i++) {
        let block_ids = chosen_groups[i];
        let col_ids = chosen_cols[i];
        for (let r = 0; r < SIZE; r++) {
            for (let c of col_ids) {
                if (!block_ids.includes(board[r][c])) {
                    state_board[r][c] = 0;
                }
            }
        }
    }
    // update groups to only store remaining possible cells per group
    let new_groups = new Map();
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state_board[r][c] == 1) {
                if (!new_groups.has(board[r][c])) {
                    new_groups.set(board[r][c], []);
                }
                new_groups.get(board[r][c]).push([r, c]);
            }
        }
    }
    groups = new_groups;
    // Repeat the same process with rows
    chosen_groups = [];
    let chosen_rows = [];
    let row_sets = col_sets;
    // for each set of columns
    for (let row_set of row_sets) {
        //use helper group_freq hashmap to see if all remaining possible cells of a block are contained in the current set of columns
        let group_freq = new Map();
        let selected_set = [];
        for (let r of row_set) {
            for (let c = 0; c < SIZE; c++) {
                if (state_board[r][c]) {
                    if (!group_freq.has(board[r][c])) {
                        group_freq.set(board[r][c], 0);
                    }
                    group_freq.set(board[r][c], group_freq.get(board[r][c]) + 1);
                }
            }
        }
        for (let [block_id, freq] of group_freq) {
            if (freq == groups.get(block_id)?.length) {
                selected_set.push(block_id);
            }
        }
        // if they are, add the column indices, as well as the blocks that are involved to lists for storage
        if (selected_set.length == row_set.length) {
            chosen_rows.push(row_set);
            chosen_groups.push(selected_set);
        }
    }
    // iterate through the lists and eliminate the appropriate cells: in the column, but not in the blocks
    for (let i = 0; i < chosen_groups.length; i++) {
        let block_ids = chosen_groups[i];
        let row_ids = chosen_rows[i];
        for (let c = 0; c < SIZE; c++) {
            for (let r of row_ids) {
                if (!block_ids.includes(board[r][c])) {
                    state_board[r][c] = 0;
                }
            }
        }
    }
    // update groups to only store remaining possible cells per group
    new_groups = new Map();
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state_board[r][c] == 1) {
                if (!new_groups.has(board[r][c])) {
                    new_groups.set(board[r][c], []);
                }
                new_groups.get(board[r][c]).push([r, c]);
            }
        }
    }
    return [state_board, new_groups];
}
// helper method that takes in a set of numbers
function get_combos(nums, min_len, max_len) {
    let combos = [];
    let N = nums.length;
    const total = Math.pow(2, N);
    for (let i = 0; i < total; i++) {
        let combo = [];
        for (let j = 0; j < N; j++) {
            if (i & (1 << j)) {
                combo.push(nums[j]);
            }
        }
        if (min_len <= combo.length && combo.length <= max_len) {
            combos.push(combo);
        }
    }
    return combos;
}
// helper method that builds upon deductive work of other methods to try to place queens if it is confident enough
// this method is moving queens from state 1 to state 2
// if a row, column, or group has only 1 viable cell
// - place it in that cell
// - eliminate cells that need to be eliminated by placing it in that spot
//   - all other in that row, all other in that column, all other in that group, diagonals 1 unit away
function try_place_queens(board, state_board, groups) {
    let SIZE = board.length;
    // I. Check for Group/Block uniqueness:
    for (let possible_cells of groups.values()) {
        // if a group contains only one possible cell for a queen to be placed
        let [r, c] = [-1, -1];
        if (possible_cells.length == 1) {
            // set that cell to the 2 (queen) state
            [r, c] = possible_cells[0];
            state_board[r][c] = 2;
            // eliminate all cells in the same column as the cell
            for (let other_r = 0; other_r < SIZE; other_r++) {
                if (other_r != r) {
                    state_board[other_r][c] = 0;
                }
            }
            // eliminate all cells in the same row as the cell
            for (let other_c = 0; other_c < SIZE; other_c++) {
                if (other_c != c) {
                    state_board[r][other_c] = 0;
                }
            }
            // eliminate diagonal cells 1 unit away from the cell
            for (let [dr, dc] of [[-1, 1], [1, -1], [1, 1], [-1, -1]]) {
                let [nr, nc] = [r + dr, c + dc];
                if (0 <= nr && nr < SIZE && 0 <= nc && nc < SIZE) {
                    state_board[nr][nc] = 0;
                }
            }
        }
    }
    // update groups possible cell lists according to updates that were just made
    let new_groups = new Map();
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state_board[r][c] == 1 || state_board[r][c] == 2) {
                if (!new_groups.has(board[r][c])) {
                    new_groups.set(board[r][c], []);
                }
                new_groups.get(board[r][c]).push([r, c]);
            }
        }
    }
    groups = new_groups;
    //  II. Repeat a similar process for Row Uniqueness
    for (let r = 0; r < SIZE; r++) {
        let p_cells = [];
        for (let c = 0; c < SIZE; c++) {
            if (state_board[r][c] == 1) {
                p_cells.push([r, c]);
            }
        }
        if (p_cells.length == 1) {
            let pr = p_cells[0][0];
            let pc = p_cells[0][1];
            state_board[pr][pc] = 2;
            for (let other_r = 0; other_r < SIZE; other_r++) {
                if (other_r != pr) {
                    state_board[other_r][pc] = 0;
                }
            }
            let c_group = groups.get(board[pr][pc]);
            if (c_group == undefined) {
                return [[], new Map()];
            }
            for (let [gr, gc] of c_group) {
                if (gc != pc || gr != pr) {
                    state_board[gr][gc] == 0;
                }
            }
            for (let [dr, dc] of [[-1, 1], [1, -1], [1, 1], [-1, -1]]) {
                let [nr, nc] = [pr + dr, pc + dc];
                if (0 <= nr && nr < SIZE && 0 <= nc && nc < SIZE) {
                    state_board[nr][nc] = 0;
                }
            }
        }
    }
    new_groups = new Map();
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state_board[r][c] == 1 || state_board[r][c] == 2) {
                if (!new_groups.has(board[r][c])) {
                    new_groups.set(board[r][c], []);
                }
                new_groups.get(board[r][c]).push([r, c]);
            }
        }
    }
    groups = new_groups;
    // III. Repeat a similar process for Column Uniqueness
    for (let c = 0; c < SIZE; c++) {
        let p_cells = [];
        for (let r = 0; r < SIZE; r++) {
            if (state_board[r][c] == 1) {
                p_cells.push([r, c]);
            }
        }
        if (p_cells.length == 1) {
            let pr = p_cells[0][0];
            let pc = p_cells[0][1];
            state_board[pr][pc] = 2;
            for (let other_c = 0; other_c < SIZE; other_c++) {
                if (other_c != pc) {
                    state_board[pr][other_c] = 0;
                }
            }
            let r_group = groups.get(board[pr][pc]);
            if (r_group == undefined) {
                return [[], new Map()];
            }
            for (let [gr, gc] of r_group) {
                if (gc != pc || gr != pr) {
                    state_board[gr][gc] == 0;
                }
            }
            for (let [dr, dc] of [[-1, 1], [1, -1], [1, 1], [-1, -1]]) {
                let [nr, nc] = [pr + dr, pc + dc];
                if (0 <= nr && nr < SIZE && 0 <= nc && nc < SIZE) {
                    state_board[nr][nc] = 0;
                }
            }
        }
    }
    new_groups = new Map();
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state_board[r][c] == 1 || state_board[r][c] == 2) {
                if (!new_groups.has(board[r][c])) {
                    new_groups.set(board[r][c], []);
                }
                new_groups.get(board[r][c]).push([r, c]);
            }
        }
    }
    return [state_board, new_groups];
}
// helper method that leverages a DFS/backtracking approach in order to finish the remainder of the puzzle
function dfs_solver(board, state_board) {
    let SIZE = board.length;
    // stores final result board
    let result = [];
    // sets to keep track of which col + block indices have already been filled
    let placedCol = new Set();
    let placedBlock = new Set();
    // stores row indices that are yet to have a definite queen placed in them
    let rows_remaining = [];
    // initializes a solved board that contains the queens placed so far
    let solved_board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    // populate solved_board based on queens placed so far, and determine which row indices do not have a queen
    for (let r = 0; r < SIZE; r++) {
        let queen_in_row = false;
        for (let c = 0; c < SIZE; c++) {
            if (state_board[r][c] == 2) {
                solved_board[r][c] == 2;
                queen_in_row = true;
            }
        }
        if (!queen_in_row) {
            rows_remaining.push(r);
        }
    }
    // recursive method to guess placements until one satisying the rules of the game is reached
    function backtrack(r_index) {
        // if we have placed a queen in all the remaining rows, store that version of the board to the result array
        if (r_index == rows_remaining.length) {
            let copy = solved_board.map(row => [...row]);
            result.push(copy);
            return;
        }
        // otherwise, go through all columns in the row
        for (let c = 0; c < SIZE; c++) {
            // get the row from the row index
            let r = rows_remaining[r_index];
            // if the current cell is 0, we cannot place a queen there, so continue to next iteration
            if (state_board[r][c] == 0) {
                continue;
            }
            let block_id = board[r][c];
            // if current cell is such that placing a queen there would overlap with zone of another queen, we cannot place a queen there, so continue to next iteration
            if (r > 0 && (placedCol.has(c) || placedBlock.has(block_id) || Math.abs(solved_board[r - 1].indexOf(2) - c) == 1)) {
                continue;
            }
            // at this point, we can place a queen without violating existing constraints
            // place it and update
            solved_board[r][c] = 2;
            placedCol.add(c);
            placedBlock.add(block_id);
            // continue on to the next row index recursively
            backtrack(r_index + 1);
            // if we did not find a viable solution down this backtracking path, undo the placement
            solved_board[r][c] = 0;
            placedCol.delete(c);
            placedBlock.delete(block_id);
        }
    }
    // carry out backtracking and return result
    backtrack(0);
    return result[0];
}
// at the bottom of your file
const testBoard = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1],
    [0, 2, 0, 0, 3, 1, 1, 1],
    [2, 2, 2, 3, 3, 3, 1, 1],
    [2, 2, 2, 3, 3, 3, 4, 1],
    [2, 2, 2, 3, 5, 3, 4, 1],
    [2, 2, 6, 3, 5, 3, 4, 1],
    [7, 2, 6, 3, 5, 3, 4, 1]
];
const stateBoard = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
];
solve_queens(testBoard);
