from copy import deepcopy
import math

SUDOKU_SIZE = 6
ROWS_OF_BOXES = 3
COLS_OF_BOXES = 2

# 2D array board variable to store sudoku
board = [[0,1,0,0,0,0],
         [0,0,0,0,3,4],
         [0,0,0,0,0,6],
         [0,2,0,0,0,0],
         [0,0,5,0,1,0],
         [0,0,2,6,0,0]]

# helper function to get box key from row index and column index
def get_box_key(r,c):
    return (r // COLS_OF_BOXES) * COLS_OF_BOXES + c // ROWS_OF_BOXES

# maps box key to a list of all coordinates in that box
box_map = dict()

# populating the box_map 
for i in range(SUDOKU_SIZE):
    for j in range(SUDOKU_SIZE):
        box_key = get_box_key(i,j)
        if box_key in box_map:
            box_map[box_key].append((i,j))
        else:
            box_map[box_key] = [(i,j)]

# helper method to print the board
def print_board(board, show_boxes = True):
    for i in range(SUDOKU_SIZE):
        for j in range(SUDOKU_SIZE):
            print(board[i][j], end = " ")
            if show_boxes and j % (SUDOKU_SIZE // COLS_OF_BOXES) == (SUDOKU_SIZE // COLS_OF_BOXES) - 1 and j != SUDOKU_SIZE-1:
                print("|",end = " ")
        if show_boxes and i % (SUDOKU_SIZE // ROWS_OF_BOXES) == (SUDOKU_SIZE // ROWS_OF_BOXES) - 1 and i != SUDOKU_SIZE-1:
            print("\n" + "-" * (2 * SUDOKU_SIZE -1 + 2 * (SUDOKU_SIZE // ROWS_OF_BOXES - 1)))
        else:
            print()

print("ORIGINAL BOARD:")
print_board(board)

# create a solver board to solve using baseline deductive reasoning and process of elimination
# use binary bit strings to represent information
# each box stores a bit string
# for sure 1: 000001 (1)
# for sure 2: 000010 (2)
# ...
# for sure 6: 100000 (32)
# no clue at all - blank square: 111111 (63)
# 0 represent position at that bit idx has no chance of being the actual value for the box
# 1 means it has a chance based on current board constraints

# initialize a solver board and populate it with the appropriate bit strings 
solver_board = [[0] * SUDOKU_SIZE for _ in range(SUDOKU_SIZE)]
for i in range(SUDOKU_SIZE):
    for j in range(SUDOKU_SIZE):
        if board[i][j] != 0:
            solver_board[i][j] = 2 ** (board[i][j] - 1)
        else:
            solver_board[i][j] = 2 ** SUDOKU_SIZE - 1

# helper function that uses existing filled in numbers to rules out possibilities 
# based on commonality across row, column, diagonal
# e.g., if there is a 1 that is filled out somewhere on the board, ensure that all the bit strings for 
# that 1's row, column, and box are zeroed out at the one position
def eliminate_impossible(board):

    old_board = deepcopy(board)

    for r in range(SUDOKU_SIZE):
        for c in range(SUDOKU_SIZE):
            if board[r][c] in [1,2,4,8,16,32]: # filled in spot deterministically
                # enforce one instance per column
                for other_r in range(SUDOKU_SIZE):
                    if other_r != r:
                        board[other_r][c] &= ~board[r][c]
                # enforce one instance per row
                for other_c in range(SUDOKU_SIZE):
                    if other_c != c:
                        board[r][other_c] &= ~board[r][c]
                # enforce one instane per box
                for other_r, other_c in box_map[get_box_key(r,c)]:
                    if other_r != r or other_c != c:
                        board[other_r][other_c] &= ~board[r][c]

    return board != old_board

# helper function that iterates through each row, column, and box to check the following:
# if there is only one cell in that row, column, or diagonal that can be a certain number, 
# fill that cell out with that number, for example, if 1 cannot be in 5 other cells in a box, 
# fill out a 1 in the remaining cell
# leverages bit manipulations to ensure this
def deduct_and_fill(board):

    old_board = deepcopy(board)
    
    # check for rows
    for r in range(SUDOKU_SIZE):
        for shift in range(SUDOKU_SIZE):
            summation = 0
            spot = (-1,-1)
            for c in range(SUDOKU_SIZE):
                summation += (board[r][c] & (2 ** shift)) >> shift
                if (board[r][c] & (2 ** shift)) >> shift == 1:
                    spot = (r,c)
            if summation == 1:
                board[spot[0]][spot[1]] = 2 ** shift

    # check for columns
    for c in range(SUDOKU_SIZE):
        for shift in range(SUDOKU_SIZE):
            summation = 0
            spot = (-1,-1)
            for r in range(SUDOKU_SIZE):
                summation += (board[r][c] & (2 ** shift)) >> shift
                if (board[r][c] & (2 ** shift)) >> shift == 1:
                    spot = (r,c)
            if summation == 1:
                board[spot[0]][spot[1]] = 2 ** shift
    
    # check for boxes
    for box in list(box_map.values()):
        for shift in range(SUDOKU_SIZE):
            summation = 0
            spot = (-1,-1)
            for r,c in box:
                summation += (board[r][c] & (2 ** shift)) >> shift
                if (board[r][c] & (2 ** shift)) >> shift == 1:
                    spot = (r,c)
            if summation == 1:
                board[spot[0]][spot[1]] = 2 ** shift
    
    return board != old_board

# use our eliminate impossible and deduct and fill functions in
# conjunction to attempt to solve the Sudoku using only those methods if possible
# essentially, we use typical human approaches, in combined with advantage of large
# computer memory to solve as much of the Sudoku as possible
while True:

    changed_i = eliminate_impossible(solver_board)

    changed_d = deduct_and_fill(solver_board)

    if not changed_i and not changed_d:
        break

# helper function to convert the binary bit strings to original number representations
# returns board, and boolean to indicate whether Sudoku is fully solved yet
def bin_to_normal(board):

    fully_solved = True
    
    result_board = []

    for i in range(SUDOKU_SIZE):
        row = []
        for j in range(SUDOKU_SIZE):
            if int(math.log2(board[i][j])) == math.log2(board[i][j]):
                row.append(int(math.log2(board[i][j]))+1)
            else:
                fully_solved = False
                row.append(0)
        result_board.append(row)
    
    return result_board, fully_solved

result_board, fully_solved = bin_to_normal(solver_board)

# helper function that solves a Sudoku by a backtracking approach that parallels the essence of DFS
# only called if normal deductive and elimination techniques did not work
def dfs_solver(board):

    # setting up and populating dictionaries of sets to keep track of nums in each row, col, box
    rows = dict()
    cols = dict()
    boxes = dict()

    for i in range(SUDOKU_SIZE):
        rows[i] = set()
        cols[i] = set()
        boxes[i] = set()

    # adding all the existing filled in numbers to the hashmap of row, col, box 
    # (key = idx, item = set of numbers so far)
    for r in range(SUDOKU_SIZE):
        for c in range(SUDOKU_SIZE):
            num = board[r][c]
            if num != 0:
                rows[r].add(num)
                cols[c].add(num)
                box_key = get_box_key(r, c)
                boxes[box_key].add(num)
    
    # helper to guide left to right, top to down, fill out and backtrack approach
    def next_place(r,c):
        if c == SUDOKU_SIZE - 1:
            return (r+1, 0)
        else:
            return (r, c+1)
    
    # actual backtracking function that attempts to fill out recursively, ensuring constraints are satisfied,
    # backtracks if fails and retries until entire Sudoku filled
    def backtrack(r, c):

        if r >= SUDOKU_SIZE:
            return True

        nr, nc = next_place(r,c)

        if board[r][c] != 0:
            return backtrack(nr,nc)

        for i in range(1, SUDOKU_SIZE + 1):
            box_key = get_box_key(r,c)
            if i not in rows[r] and i not in cols[c] and i not in boxes[box_key]:
                board[r][c] = i
                rows[r].add(i)
                cols[c].add(i)
                boxes[box_key].add(i)
                if backtrack(nr,nc):
                    return True
                board[r][c] = 0
                rows[r].remove(i)
                cols[c].remove(i)
                boxes[box_key].remove(i)
        
        return False
    
    backtrack(0,0)

# Display output in terminal
if fully_solved:
    print("Final solved board (no backtracking needed)")
    print_board(result_board)
else:
    dfs_solver(result_board)
    print("Final solved board (backtracking needed)")
    print_board(result_board)