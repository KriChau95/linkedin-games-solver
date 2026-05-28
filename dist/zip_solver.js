export function solve_zip(board, walls) {
    const BOARD_SIZE = board.length;
    let sr = -1;
    let sc = -1;
    let dest = -1;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] == 1) {
                sr = r;
                sc = c;
            }
            if (board[r][c] > dest) {
                dest = board[r][c];
            }
        }
    }
    let str_walls = [];
    for (let wall of walls) {
        let str_wall = `${wall[0]},${wall[1]},${wall[2]},${wall[3]}`;
        str_walls.push(str_wall);
    }
    let final_path = [];
    let path = [];
    dfs(sr, sc, 1, dest, board, str_walls, path, final_path);
    return coords_to_commands(final_path);
}
function coords_to_commands(coordinates) {
    let commands = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
        let start_coord = coordinates[i];
        let next_coord = coordinates[i + 1];
        let rc_start = start_coord.split(',');
        let r_start = parseInt(rc_start[0], 10);
        let c_start = parseInt(rc_start[1], 10);
        let rc_next = next_coord.split(',');
        let r_next = parseInt(rc_next[0], 10);
        let c_next = parseInt(rc_next[1], 10);
        if (r_next - r_start == 1) {
            commands.push(["ArrowDown", "ArrowDown", 40]);
        }
        else if (r_next - r_start == -1) {
            commands.push(["ArrowUp", "ArrowUp", 38]);
        }
        else if (c_next - c_start == 1) {
            commands.push(["ArrowRight", "ArrowRight", 39]);
        }
        else if (c_next - c_start == -1) {
            commands.push(["ArrowLeft", "ArrowLeft", 37]);
        }
    }
    return commands;
}
function dfs(r, c, curr_num, dest, board, walls, path, final_path) {
    let curr_coord = `${r},${c}`;
    path.push(curr_coord);
    if (board[r][c] == dest && path.length == board.length * board.length) {
        final_path.splice(0, final_path.length, ...path);
    }
    else {
        for (let [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            let nr = r + dr;
            let nc = c + dc;
            if (0 <= nr && nr < board.length && 0 <= nc && nc < board.length && !path.includes(`${nr},${nc}`) && !walls.includes(`${r},${c},${nr},${nc}`) && !walls.includes(`${nr},${nc},${r},${c}`)) {
                if (board[nr][nc] == curr_num + 1) {
                    dfs(nr, nc, curr_num + 1, dest, board, walls, path, final_path);
                }
                else if (board[nr][nc] == 0) {
                    dfs(nr, nc, curr_num, dest, board, walls, path, final_path);
                }
            }
        }
    }
    path.pop();
}
let board = [
    [1, 0, 0, 0, 0, 11, 0],
    [0, 0, 9, 0, 0, 0, 0],
    [0, 8, 0, 10, 0, 6, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 7, 0, 3, 0, 5, 0],
    [0, 0, 0, 0, 4, 0, 0],
    [0, 2, 0, 0, 0, 0, 12]
];
let walls = [
    [1, 1, 1, 2],
    [1, 2, 1, 3],
    [2, 4, 2, 5],
    [2, 5, 2, 6],
    [4, 0, 4, 1],
    [4, 1, 4, 2],
    [5, 3, 5, 4],
    [5, 4, 5, 5]
];
console.log(solve_zip(board, walls));
