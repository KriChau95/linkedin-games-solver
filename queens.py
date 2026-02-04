from collections import defaultdict
from copy import deepcopy
from itertools import combinations

# numbers of rows and columns in the square grid
SIZE = 9

# represent board as 2D array where each group (a.k.a. distinct colored block)
# is a distinct number in the 2D array
board = [
    [0,0,0,1,1,0,0,0,0],
    [0,0,1,1,0,0,2,2,0],
    [0,0,0,0,0,2,2,0,0],
    [0,0,0,0,3,3,4,0,0],
    [0,0,0,3,3,4,4,5,0],
    [0,0,6,6,7,4,5,5,0],
    [0,6,6,7,7,0,5,0,0],
    [0,8,8,7,0,0,0,0,0],
    [8,8,0,0,0,0,0,0,0]
]

# SIZE = 8

# board = [
#     [0,0,0,0,0,0,1,1],
#     [0,0,0,0,0,2,1,1],
#     [0,0,0,3,3,2,1,1],
#     [0,0,3,3,3,3,4,4],
#     [0,5,6,6,6,6,5,7],
#     [0,5,5,6,6,5,5,7],
#     [0,5,5,5,5,5,5,7],
#     [0,0,7,7,7,7,7,7]
# ]

# SIZE = 8

# board = [
#     [0,0,0,1,2,2,3,3],
#     [4,4,0,1,2,2,3,3],
#     [0,0,0,1,2,2,2,3],
#     [0,1,1,1,2,2,5,6],
#     [0,0,0,2,2,5,5,6],
#     [7,2,2,2,2,2,5,6],
#     [7,2,2,2,2,2,5,6],
#     [7,2,2,2,2,5,5,5]
# ]

# SIZE = 7

# board = [
#     [0,0,0,0,0,0,0],
#     [1,1,2,2,2,1,1],
#     [1,1,2,3,3,1,1],
#     [1,4,2,2,5,5,1],
#     [1,4,4,5,5,6,1],
#     [1,4,4,6,6,6,1],
#     [1,1,1,1,1,1,1]
# ]

# groups - a hashmap where key is group number, and values is list of tuple coordinates        
groups = defaultdict(list)

# populate groups based on board
for r in range(SIZE):
    for c in range(SIZE):
        groups[board[r][c]].append((r,c))

# state_board represents state for each cell in the grid during the solving process
# 0 - impossible for a queen to be there
# 1 - possible for a queen to be there, but not guaranteed
# 2 - sure that there is a queen there
# all cells start in state 1 and can transition to either state 0 or 2, which are terminal states
state_board = [[1] * SIZE for _ in range(SIZE)]

# helper method to print board cleanly as a grid
def print_board(board):
    for r in range(len(board)):
        for c in range(len(board[r])):
            print(board[r][c], end = " ")
        print()


# helper method that eliminates cells that for sure cannot contain the queen
# considers a block, if a queen in any of the cells in a block for sure eliminates some cell outside that block,
# eliminates that cell
# moves cells from state 1 to state 0
# takes in board (constant representation of initial game), state_board (current states of each cell), and groups (currently viable cells in each group (in state 1 or 2))
def eliminate_impossible(board, state_board, groups):

    # list to store tuples that will be moved to the 0-state (eliminated)
    x_cells = []
    
    # iterate over each cell in each group
    for cells in groups.values():

        # do the following for the current group

        eliminated = defaultdict(int)
        # create a helper hashmap: eliminated, with key = cell coordinate (r,c),
        # and values = how many of the cells in the current group would would eliminate that cell
        for cell in cells:
            r, c = cell
            for i in range(SIZE):
                eliminated[(i,c)] += 1
                eliminated[(r,i)] += 1
            for dr, dc in [(1,1), (1,-1), (-1,1), (-1,-1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < SIZE and 0 <= nc < SIZE:
                    eliminated[(nr,nc)] += 1

        # if all cells in that group eliminate it, remove it from consideration - move from state 1 to 0
        for coord, freq in eliminated.items():
            if freq == len(cells) and coord not in cells: # account for the fact that we are looking at cells outside the block/groups in consideration
                x_cells.append(coord)
    
    # update state board accordingly
    for r, c in x_cells:
        state_board[r][c] = 0
    
    # update groups hashmap accordingly
    new_groups = defaultdict(list)
    for r in range(SIZE):
        for c in range(SIZE):
            if state_board[r][c] == 1:
                new_groups[board[r][c]].append((r,c))

    return state_board, new_groups

# helper method that uses a line of deductive reasoning to eliminate impossible cells
# for example if I focus on 2 columns, and there are
# two distinct 2x2 blocks in them
# since each column must contain one queen, regardless of how I place the queens in these 2 blocks,
# cells in both columns outside the two 2x2 blocks will automatically be eliminated
# reapply this reasoning for rows, and for combinations of 3-4 rows/columns
def pigeonhole_rows_cols(board, state_board, groups):
    
    chosen_groups = []
    chosen_cols = []
    
    # generate a list of lists, where each individual list is a list of column indices of size 2,3, or 4
    col_sets = list(combinations(list(range(SIZE)), 2)) + list(combinations(list(range(SIZE)), 3)) + list(combinations(list(range(SIZE)), 4))  
    
    # for each set of columns
    for col_set in col_sets:

        # use helper group_freq hashmap to see if all remaining possible cells of a block are contained in the current set of columns
        group_freq = defaultdict(int)
        selected_set = []
        for c in col_set:
            for r in range(SIZE):
                if state_board[r][c]: group_freq[board[r][c]] += 1
        for block_id, freq in group_freq.items():
            if freq == len(groups[block_id]):
                selected_set.append(block_id)

        # if they are, add the column indices, as well as the blocks that are involved to lists for storage
        if len(selected_set) == len(col_set):
            chosen_cols.append(col_set)
            chosen_groups.append(selected_set)

    # iterate through the lists and eliminate the appropriate cells: in the column, but not in the blocks
    for i in range(len(chosen_groups)):
        block_ids = chosen_groups[i]
        col_ids = chosen_cols[i]
        for r in range(SIZE):
            for c in col_ids:
                if board[r][c] not in block_ids:
                    state_board[r][c] = 0
    
    # update groups to only store remaining possible cells per group
    new_groups = defaultdict(list)

    for r in range(SIZE):
        for c in range(SIZE):
            if state_board[r][c] == 1:
                new_groups[board[r][c]].append((r,c))

    groups = new_groups

    # Repeat the above process with rows

    chosen_groups = []
    chosen_rows= []
    
    row_sets = list(combinations(list(range(SIZE)), 2)) + list(combinations(list(range(SIZE)), 3)) + list(combinations(list(range(SIZE)), 4))  

    for row_set in row_sets:
        group_freq = defaultdict(int)
        selected_set = []
        for r in row_set:
            for c in range(SIZE):
                if state_board[r][c]: group_freq[board[r][c]] += 1
        for block_id, freq in group_freq.items():
            if freq == len(groups[block_id]):
                selected_set.append(block_id)
        if len(selected_set) == len(col_set):
            chosen_rows.append(row_set)
            chosen_groups.append(selected_set)

    for i in range(len(chosen_groups)):
        block_ids = chosen_groups[i]
        row_ids = chosen_rows[i]
        for c in range(SIZE):
            for r in row_ids:
                if board[r][c] not in block_ids:
                    state_board[r][c] = 0
    
    new_groups = defaultdict(list)

    for r in range(SIZE):
        for c in range(SIZE):
            if state_board[r][c] == 1:
                new_groups[board[r][c]].append((r,c))

    return state_board, new_groups

# helper method that builds upon deductive work of other methods to try to place queens if it is confident enough
# this method is moving queens from state 1 to state 2
# if a row, column, or group has only 1 viable cell
# - place it in that cell
# - eliminate cells that need to be eliminated by placing it in that spot
#   - all other in that row, all other in that column, all other in that group, diagonals 1 unit away
def try_place_queens(board, state_board, groups):

    # I. Check for Group/Block uniqueness:
    for possible_cells in groups.values():
        
        # if a group contains only one possible cell for a queen to be placed
        if len(possible_cells) == 1:

            # set that cell to the 2 (queen) state
            r,c = possible_cells[0]
            state_board[r][c] = 2

            # eliminate all cells in the same column as the cell
            for other_r in range(SIZE):
                if other_r != r:
                    state_board[other_r][c] = 0

            # eliminate all cells in the same row as the cell
            for other_c in range(SIZE):
                if other_c != c:
                    state_board[r][other_c] = 0
            
            # eliminate diagonal cells 1 unit away from the cell
            for dr, dc in [(-1,1), (1,-1), (1,1), (-1,-1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < SIZE and 0 <= nc < SIZE:
                    state_board[nr][nc] = 0

    # update groups possible cell lists according to updates that were just made
    new_groups = defaultdict(list)

    for r in range(SIZE):
        for c in range(SIZE):
            if state_board[r][c] == 1 or state_board[r][c] == 2:
                new_groups[board[r][c]].append((r,c))
    
    groups = new_groups

    # II. Repeat a similar process for Row Uniqueness
    for r in range(SIZE):
        p_cells = []
        for c in range(SIZE):
            if state_board[r][c] == 1:
                p_cells.append((r,c))
        if len(p_cells) == 1:
            pr = p_cells[0][0]
            pc = p_cells[0][1]
            state_board[pr][pc] = 2
            for other_r in range(SIZE):
                if other_r != pr:
                    state_board[other_r][pc] = 0
            c_group = groups[board[pr][pc]]
            for gr, gc in c_group:
                if gc != pc or gr != pr:
                    state_board[gr][gc] = 0
            for dr, dc in [(-1,1), (1,-1), (1,1), (-1,-1)]:
                nr, nc = pr + dr, pc + dc
                if 0 <= nr < SIZE and 0 <= nc < SIZE:
                    state_board[nr][nc] = 0
    
    new_groups = defaultdict(list)

    for r in range(SIZE):
        for c in range(SIZE):
            if state_board[r][c] == 1 or state_board[r][c] == 2:
                new_groups[board[r][c]].append((r,c))
    
    groups = new_groups

    # III. Repeat a similar process for Column Uniqueness
    for c in range(SIZE):
        p_cells = []
        for r in range(SIZE):
            if state_board[r][c] == 1:
                p_cells.append((r,c))
        if len(p_cells) == 1:
            pr = p_cells[0][0]
            pc = p_cells[0][1]
            state_board[pr][pc] = 2
            for other_c in range(SIZE):
                if other_c != pc:
                    state_board[pr][other_c] = 0
            for dr, dc in [(-1,1), (1,-1), (1,1), (-1,-1)]:
                nr, nc = pr + dr, pc + dc
                if 0 <= nr < SIZE and 0 <= nc < SIZE:
                    state_board[nr][nc] = 0
    
    new_groups = defaultdict(list)

    for r in range(SIZE):
        for c in range(SIZE):
            if state_board[r][c] == 1 or state_board[r][c] == 2:
                new_groups[board[r][c]].append((r,c))

    
    return state_board, new_groups


print("ORIGINAL BOARD")
print_board(board)

solved = False

# until we find a solution or run into a situation where we have to guess
while True:

    start_board = deepcopy(board)
    start_state_board = deepcopy(state_board)

    # keep trying all 3 methods
    new_bool_board, new_groups = eliminate_impossible(board, state_board, groups)
    state_board = deepcopy(new_bool_board)
    groups = deepcopy(new_groups)

    new_bool_board, new_groups = pigeonhole_rows_cols(board, state_board, groups)
    state_board = deepcopy(new_bool_board)
    groups = deepcopy(new_groups)

    new_bool_board, new_groups = try_place_queens(board, state_board, groups)
    state_board = deepcopy(new_bool_board)
    groups = deepcopy(new_groups)

    # check if we have found a solution by checking if all queens have been placed
    queens_placed = 0

    for r in range(SIZE):
        for c in range(SIZE):
            if state_board[r][c] == 2:
                queens_placed += 1
    
    if queens_placed == SIZE:
        solved = True
        break
    
    # if we make no progress using CSP approach, we exit and default to DFS
    if board == start_board and  state_board == start_state_board:
        break

# print progress after exhausting CSP approach

print("\nBOARD after - CSP")
print_board(state_board)
for key, value in groups.items():
    print(key, value)

# helper method that leverages a DFS/backtracking approach in order to finish the remainder of the puzzle
def place_queens(board, state_board):

    # stores final result board
    result = []

    # sets to keep track of which col + block indices have already been filled
    placedCol = set()
    placedBlock = set()

    # stores row indices that are yet to have a definite queen placed in them
    rows_remaining = []

    # initializes a solved board that contains the queens placed so far
    solved_board = [[0] * SIZE for _ in range(SIZE)]
    
    # populate solved_board based on queens placed so far, and determine which row indices do not have a queen
    for r in range(SIZE):
        queen_in_row = False
        for c in range(SIZE):
            if state_board[r][c] == 2:
                solved_board[r][c] = 2
                queen_in_row = True
        if not queen_in_row:
            rows_remaining.append(r)

    # recursive method to guess placements until one satisying the rules of the game is reached
    def backtrack(r_index):

        # if we have placed a queen in all the remaining rows, store that version of the board to the result array
        if r_index == len(rows_remaining):

            copy = deepcopy(solved_board)
            result.append(copy)
            return

        # otherwise, go through all columns in the row
        for c in range(SIZE):
            
            # get the row from the row index
            r = rows_remaining[r_index]

            # if the current cell is 0, we cannot place a queen there, so continue to next iteration
            if state_board[r][c] == 0:
                continue
            
            block_id = board[r][c]
            
            # if current cell is such that placing a queen there would overlap with zone of another queen, we cannot place a queen there, so continue to next iteration
            if r > 0 and (c in placedCol or block_id in placedBlock or abs(solved_board[r-1].index(2) - c) == 1):
                continue
            
            # at this point, we can place a queen without violating existing constraints
            # place it and update
            solved_board[r][c] = 2
            placedCol.add(c)
            placedBlock.add(block_id)

            # continue on to the next row index recursively
            backtrack(r_index+1)

            # if we did not find a viable solution down this backtracking path, undo the placement
            solved_board[r][c] = 0
            placedCol.remove(c)
            placedBlock.remove(block_id)
    
    # carry out backtracking and return result
    backtrack(0)
    return result[0]

# if CSP approach insufficient, perform backtracking
if not solved:

    groups = defaultdict(list)

    for i in range(SIZE):
        for j in range(SIZE):
            groups[board[i][j]].append((i,j))


    result = place_queens(board, state_board)
    print("\nFINAL SOLVED BOARD - DFS")
    print_board(result)