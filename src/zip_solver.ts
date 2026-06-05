// defining types specific to zip

// a wall is a barrier between two cells defined by [row_1, col_1, row_2, col_2]
export type wall = [number, number, number, number];

// a representation of a KeyPress event based on event.key, event.code, and event.which
type KeyPress = [string, string, number];

// solver function that takes in board representation and wall locations
// returns a list of key presses representing how to interact with webpage to solve zip puzzle
export function solve_zip(board: number[][], walls: wall[]){

    // determine board length and store to a constant
    const BOARD_SIZE = board.length;

    // determine row and col of start (cell containing 1)
    let sr = -1;
    let sc = -1;

    // determine final (largest) number on the board and store it to dest (destination)
    let dest = -1;

    // parse through the board to determine start row, start col, destination number
    for (let r = 0; r < BOARD_SIZE; r++){
        for (let c = 0; c < BOARD_SIZE; c++){
            if(board[r][c] == 1){
                sr = r;
                sc = c;
            }
            if (board[r][c] > dest){
                dest = board[r][c];
            }
        }
    }

    // initialize an empty list of strings
    let str_walls: string[] = [];

    // modify the walls to be strings so that lookup (includes) functionality works
    for (let wall of walls){
        let str_wall = `${wall[0]},${wall[1]},${wall[2]},${wall[3]}`;
        str_walls.push(str_wall);
    }

    // create blank variables to store the final path and the current path
    let final_path: string[] = []
    let path: string[] = []

    // run dfs to populate path for discovery and eventually store solution path to final_path
    dfs(sr, sc, 1, dest, board, str_walls, path, final_path);
    
    // call helper function that translates path of coordinates to a series of KeyPress commands (up, down, left right, arrow presses)
    return coords_to_commands(final_path);

}

// helper function that translates path of coordinates to a series of KeyPress commands
function coords_to_commands(coordinates: string[]){

    // final list of commands to return - initialize to be empty
    let commands: KeyPress[] = [];

    // iterate across coordinates
    for (let i = 0; i < coordinates.length -1; i++){

        // determine start and end rows and cols
        let start_coord = coordinates[i];
        let next_coord = coordinates[i+1];

        let rc_start = start_coord.split(',');
        let r_start = parseInt(rc_start[0],10);
        let c_start = parseInt(rc_start[1],10);

        let rc_next = next_coord.split(',');
        let r_next = parseInt(rc_next[0],10);
        let c_next = parseInt(rc_next[1],10);

        // determine up, down, left, or right, based on delta between rows and cols
        if (r_next - r_start == 1){
            commands.push(["ArrowDown", "ArrowDown", 40]);
        } else if (r_next - r_start == -1){
            commands.push(["ArrowUp", "ArrowUp", 38])
        } else if (c_next - c_start == 1){
            commands.push(["ArrowRight", "ArrowRight", 39])
        } else if (c_next - c_start == -1){
            commands.push(["ArrowLeft", "ArrowLeft", 37])
        }
    }

    // return final list of commands
    return commands;
}

// helper function that runs dfs to find the solution
// based on current row, col, most recent number traversed,
// destination number, board, wall positions,
// current path, and final path
function dfs(r: number, c:number, curr_num:number, dest:number, board:number[][], walls: string[], path:string[], final_path: string[]){
    
    // determine current coordinate as a string (for lookup)
    let curr_coord = `${r},${c}`;
    path.push(curr_coord);

    // if we are at the destination, return the path
    if (board[r][c] == dest && path.length == board.length * board.length){
        final_path.splice(0, final_path.length, ...path);
    } else {
        // move one step in any available direction, and continue dfs recursively
        for (let [dr, dc] of [[0,1], [0,-1], [1,0], [-1,0]]){
            let nr = r + dr;
            let nc = c + dc;
            // make sure next move in dfs is within board,
            // does not overlap existing path
            // doesn't cross a wall
            if (0 <= nr && nr < board.length && 0 <= nc && nc < board.length && 
                !path.includes(`${nr},${nc}`) && 
                !walls.includes(`${r},${c},${nr},${nc}`) && !walls.includes(`${nr},${nc},${r},${c}`)){
                if (board[nr][nc] == curr_num + 1){
                    dfs(nr, nc, curr_num + 1, dest, board, walls, path, final_path);
                } else if (board[nr][nc] == 0){
                    dfs(nr, nc, curr_num, dest, board, walls, path, final_path);
                }
            }
        }
    }

    // backtrack if we didn't find a solution down this path
    path.pop();
}