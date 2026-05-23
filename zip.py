BOARD_SIZE = 7

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

sr = -1
sc = -1

dest = -1

for r in range(BOARD_SIZE):
    for c in range(BOARD_SIZE):
        if board[r][c] == 1:
            sr, sc = r, c
        if board[r][c] > dest:
            dest = board[r][c]

from collections import deque

stack = []

stack.append((sr, sc, f"({sr},{sc})->", 1))

visited = set()

curr_num = 1

paths = []

while stack:
    cr, cc, path, path_len = stack.pop()
    print(f"cr: {cr}, cc: {cc}, path: {path}, path_len: {path_len}")
    if board[cr][cc] == dest and path_len == BOARD_SIZE * BOARD_SIZE -1:
        paths.append(path)
    for dr, dc in [(0,1), (0,-1), (1,0), (-1,0)]:
        nr, nc = cr + dr, cc + dc
        if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE and \
            (cr,cc,nr,nc) not in walls and (nr,nc,cr,cc) not in walls \
                and (nr,nc) not in visited and (board[nr][nc] == curr_num + 1 or board[nr][nc] == 0):
                stack.append((nr,nc, path + f"({nr},{nc})->", path_len+1))
                visited.add((nr,nc))
                if board[nr][nc] == curr_num + 1:
                     curr_num += 1
                


    
          #  https://leetcode.com/discuss/post/5169569/rat-in-a-maze-backtracking-intuitive-sho-ryz0/



