const SUDOKU_SIZE = 6;
const ROWS_OF_BOXES = 3;
const COLS_OF_BOXES = 2;

// maps box key to a list of all coordinates in that box
let BOX_MAP = new Map();

// populating the box_map 

for (let r = 0; r < SUDOKU_SIZE; r++){
    for (let c = 0; c < SUDOKU_SIZE; c++){
        let box_key = get_box_key(r,c);
        if (!BOX_MAP.has(box_key)){
            BOX_MAP.set(box_key, []);
        }
        const coord: Tuple = [r,c];
        BOX_MAP.get(box_key).push(coord);
    }
}

type Tuple = [number, number];

// 31/244

// export at end
function solve_sudoku(grid: number[][]): number[] {

    // create an array of blank spaces to keep track of where to press button key in solution
    let blank_space: boolean[][] = []
    for (let r = 0; r < SUDOKU_SIZE; r++){
        let row: boolean[] = [];
        for (let c = 0; c < SUDOKU_SIZE; c++){
            row.push(grid[r][c] == 0);
        }
        blank_space.push(row);
    }



    let solved_board = Array.from({length: 6}, () => Array(6).fill(0))


    const nums: number[] = [1, 2, 3, 4, 5];
    return nums;
}

// helper function to get box key from row and function
function get_box_key(r: number, c: number): number{
    return Math.floor(r / COLS_OF_BOXES) * COLS_OF_BOXES + Math.floor(c / ROWS_OF_BOXES);
}

// helper function that uses existing filled in numbers to rules out possibilities 
// based on commonality across row, column, diagonal
// e.g., if there is a 1 that is filled out somewhere on the board, ensure that all the bit strings for 
// that 1's row, column, and box are zeroed out at the one position
function eliminate_impossible(board: number[][]): boolean{

    const old_board: number[][] = board.map(row => [...row]);

    // if bit string is a power of 2, we have narrowed down value at that position to exactly 1 number
    const deterministic_bit_strs = new Set([1,2,4,8,16,32]);

    for (let r = 0; r < SUDOKU_SIZE; r++){
        for(let c = 0; c < SUDOKU_SIZE; c++){
            if (deterministic_bit_strs.has(board[r][c])){
                
                // enforce one instance per column
                for (let or = 0; or < SUDOKU_SIZE; or++){
                    if (or != r){
                        board[or][c] &= ~board[r][c];
                    }
                }

                // enforce one instance per row
                for (let oc = 0; oc < SUDOKU_SIZE; oc++){
                    if (oc != c){
                        board[r][oc] &= ~board[r][c];
                    }
                }

                // enforce one instance per box
                BOX_MAP.get(get_box_key(r,c)).forEach(
                    (or:number,oc:number)=>{
                        if (or != r || oc != c){
                            board[or][oc] &= ~board[r][c];
                        }
                })
            } 
        }
    }

    // return true if changes were made, false othewise
    return !equal2D(old_board, board);

}

// function that returns whether or not 2 passed in 2D arrays are equal
function equal2D(board_1: number[][], board_2: number[][]): boolean{
    for (let i = 0; i < board_1.length; i++){
        for (let j = 0; j < board_1[i].length; j++){
            if (board_1[i][j] != board_2[i][j]){
                return false;
            }
        }
    }
    return true;
}

let board = [[0,0,0,1,2,0], [0,2,1,0,3,0,0], [0,5,0,0,0,6], [3,0,0,0,5,1], [2,1,0,4,0,0], [0,0,6,5,0,0]]
solve_sudoku(board);