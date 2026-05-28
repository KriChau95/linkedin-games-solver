

board = [
    [0, 0, 0, 0, 1, 0, 0],
    [0, 7, 0, 0, 0, 9, 0],
    [10, 0, 0, 8, 0, 0, 0],
    [0, 0, 5, 0, 2, 0, 0],
    [0, 0, 0, 4, 0, 0, 12],
    [0, 6, 0, 0, 0, 3, 0],
    [0, 0, 11, 0, 0, 0, 0]
]

walls = {(0,2,1,2), (0,4,1,4), (2,0,2,1), (2,5,2,6), (4,0,4,1), (4,5,4,6), (5,2,6,2), (5,4,6,4)}

BOARD_SIZE = len(board)

sr = -1
sc = -1

dest = -1

for r in range(BOARD_SIZE):
    for c in range(BOARD_SIZE):
        if board[r][c] == 1:
            sr, sc = r, c
        if board[r][c] > dest:
            dest = board[r][c]
    
def dfs(r, c, curr_num, dest, board, path, all_paths):
    
    path.append((r,c))

    if board[r][c] == dest and len(path) == len(board) ** 2:
        all_paths.append(path.copy())
    else:
        for dr, dc in [(0,1), (0,-1), (1,0), (-1,0)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < len(board) and 0 <= nc < len(board) and (nr, nc) not in path and (r, c, nr, nc) not in walls and (nr, nc, r, c) not in walls:
                if board[nr][nc] == curr_num + 1:
                    dfs(nr, nc, curr_num + 1, dest, board, path, all_paths)
                elif board[nr][nc] == 0:
                    dfs(nr, nc, curr_num, dest, board, path, all_paths)
    
    path.pop()

all_paths = []
path = []

dfs(sr, sc, 1, dest, board, path, all_paths)

print(all_paths)

