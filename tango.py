from collections import defaultdict

board = [
    [0,0,0,0,0,1],
    [0,0,0,0,0,0],
    [0,0,0,2,1,1],
    [0,0,0,0,0,0],
    [0,2,1,2,1,1],
    [0,0,0,0,0,0]
]

BOARD_SIZE = len(board)

equals = [(1,4,1,5), (3,2,3,3), (3,4,3,5)]
crosses = [(5,0,5,1), (5,2,5,3), (5,4,5,5)]

equal_map = defaultdict(list)
cross_map = defaultdict(list)

for r1, c1, r2, c2 in equals:
    equal_map[(r1, c1)].append((r2, c2))
    equal_map[(r2, c2)].append((r1, c1))

for r1, c1, r2, c2 in crosses:
    cross_map[(r1, c1)].append((r2, c2))
    cross_map[(r2, c2)].append((r1, c1))
    
def print_board(board):

    for i in range(BOARD_SIZE):
        for j in range(BOARD_SIZE):
            print(board[i][j], end = " ")
        print()


# helper function that solves a Tango by a backtracking approach that parallels the essence of DFS
# only called if normal deductive and elimination techniques did not work
def dfs_solver(board):

    # setting up and populating dictionaries of sets to keep track of nums in each row, col
    rows = dict()
    cols = dict()

    for i in range(BOARD_SIZE):
        rows[i] = {1: 0, 2: 0}
        cols[i] = {1: 0, 2: 0}

    # adding all the existing filled in numbers to the hashmap of row, col
    # (key = idx, item = set of numbers so far)
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            num = board[r][c]
            if num != 0:
                rows[r][num] += 1
                cols[c][num] += 1

    
    # helper to guide left to right, top to down, fill out and backtrack approach
    def next_place(r,c):
        if c == BOARD_SIZE - 1:
            return (r+1, 0)
        else:
            return (r, c+1)
    
    def check_three_b2b(n, r, c):

        one_left = board[r][c-1] if c-1 >=0 else 67
        two_left = board[r][c-2] if c-2 >=0 else 67
        one_right = board[r][c+1] if c+1 < len(board) else 67
        two_right = board[r][c+2] if c+2 < len(board) else 67

        one_above = board[r-1][c] if r-1 >=0 else 67
        two_above = board[r-2][c] if r-2 >=0 else 67
        one_below = board[r+1][c] if r+1 < len(board) else 67
        two_below = board[r+2][c] if r+2 < len(board) else 67

        if one_left == n and one_right == n:
            return True
        if two_left == n and one_left == n:
            return True
        if one_right == n and two_right == n:
            return True

        if one_above == n and one_below == n:
            return True
        if one_above == n and two_above == n:
            return True
        if one_below == n and two_below == n:
            return True
    
        return False

    def check_equals_crosses(n,r,c):

        eq_coord_list = equal_map[(r, c)]
        for otr, otc in eq_coord_list:
            if board[otr][otc] !=0 and board[otr][otc] != n:
                return False
        
        cross_coord_list = cross_map[(r, c)]
        for otr, otc in cross_coord_list:
            if board[otr][otc] !=0 and board[otr][otc] == n:
                return False
        
        return True

    
    # actual backtracking function that attempts to fill out recursively, ensuring constraints are satisfied,
    # backtracks if fails and retries until entire Sudoku filled
    def backtrack(r, c):

        if r >= BOARD_SIZE:
            return True

        nr, nc = next_place(r,c)

        if board[r][c] != 0:
            return backtrack(nr,nc)

        for i in range(1, 3):
            if rows[r][i] <= 2 and cols[c][i] <= 2 and not check_three_b2b(i, r, c) and check_equals_crosses(i, r, c): # and no 3 consecutive and crosses and equals remain
                board[r][c] = i
                rows[r][i] += 1
                cols[c][i] += 1
                if backtrack(nr,nc):
                    return True
                board[r][c] = 0
                rows[r][i] -= 1
                cols[c][i] -= 1
        
        return False
    
    backtrack(0,0)

print("BEFORE")
print_board(board)

dfs_solver(board)

print()
print("AFTER")
print_board(board)