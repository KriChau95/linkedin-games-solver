export function solve_tango(board, equals, crosses) {
    let SIZE = board.length;
    let old_board = [];
    for (let r = 0; r < SIZE; r++) {
        let row = [];
        for (let c = 0; c < SIZE; c++) {
            row.push(board[r][c]);
        }
        old_board.push(row);
    }
    let equal_map = new Map();
    let cross_map = new Map();
    for (let [r1, c1, r2, c2] of equals) {
        let cell1 = `${r1},${c1}`;
        let cell2 = `${r2},${c2}`;
        if (!equal_map.has(cell1)) {
            equal_map.set(cell1, []);
        }
        equal_map.get(cell1).push(cell2);
        if (!equal_map.has(cell2)) {
            equal_map.set(cell2, []);
        }
        equal_map.get(cell2).push(cell1);
    }
    for (let [r1, c1, r2, c2] of crosses) {
        let cell1 = `${r1},${c1}`;
        let cell2 = `${r2},${c2}`;
        if (!cross_map.has(cell1)) {
            cross_map.set(cell1, []);
        }
        cross_map.get(cell1).push(cell2);
        if (!cross_map.has(cell2)) {
            cross_map.set(cell2, []);
        }
        cross_map.get(cell2).push(cell1);
    }
    let rows = new Map();
    let cols = new Map();
    for (let i = 0; i < SIZE; i++) {
        rows.set(i, new Map([[1, 0], [2, 0]]));
        cols.set(i, new Map([[1, 0], [2, 0]]));
    }
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            let num = board[r][c];
            if (num != 0) {
                rows.get(r).set(num, rows.get(r).get(num) + 1);
                cols.get(c).set(num, cols.get(c).get(num) + 1);
            }
        }
    }
    function next_place(r, c) {
        if (c == SIZE - 1) {
            return [r + 1, 0];
        }
        else {
            return [r, c + 1];
        }
    }
    function check_three_b2b(n, r, c) {
        let one_left = c - 1 >= 0 ? board[r][c - 1] : 67;
        let two_left = c - 2 >= 0 ? board[r][c - 2] : 67;
        let one_right = c + 1 < board.length ? board[r][c + 1] : 67;
        let two_right = c + 2 < board.length ? board[r][c + 2] : 67;
        let one_above = r - 1 >= 0 ? board[r - 1][c] : 67;
        let two_above = r - 2 >= 0 ? board[r - 2][c] : 67;
        let one_below = r + 1 < board.length ? board[r + 1][c] : 67;
        let two_below = r + 2 < board.length ? board[r + 2][c] : 67;
        if (one_left == n && one_right == n)
            return true;
        if (two_left == n && one_left == n)
            return true;
        if (one_right == n && two_right == n)
            return true;
        if (one_above == n && one_below == n)
            return true;
        if (one_above == n && two_above == n)
            return true;
        if (one_below == n && two_below == n)
            return true;
        return false;
    }
    function check_equals_crosses(n, r, c) {
        let equal_coordinate_list = equal_map.get(`${r},${c}`) || [];
        for (let coord of equal_coordinate_list) {
            let [otr, otc] = coord.split(',').map(Number);
            if (board[otr][otc] != 0 && board[otr][otc] != n) {
                return false;
            }
        }
        let cross_coordinate_list = cross_map.get(`${r},${c}`) || [];
        for (let coord of cross_coordinate_list) {
            let [otr, otc] = coord.split(',').map(Number);
            if (board[otr][otc] != 0 && board[otr][otc] == n) {
                return false;
            }
        }
        return true;
    }
    function backtrack(r, c) {
        if (r >= SIZE) {
            return true;
        }
        let [nr, nc] = next_place(r, c);
        if (board[r][c] != 0) {
            return backtrack(nr, nc);
        }
        for (let i = 1; i < 3; i++) {
            if (rows.get(r).get(i) <= 2 && cols.get(c).get(i) <= 2 && !check_three_b2b(i, r, c) && check_equals_crosses(i, r, c)) {
                board[r][c] = i;
                rows.get(r).set(i, rows.get(r).get(i) + 1);
                cols.get(c).set(i, cols.get(c).get(i) + 1);
                if (backtrack(nr, nc)) {
                    return true;
                }
                board[r][c] = 0;
                rows.get(r).set(i, rows.get(r).get(i) - 1);
                cols.get(c).set(i, cols.get(c).get(i) - 1);
            }
        }
        return false;
    }
    backtrack(0, 0);
    let clicks = [];
    for (let r = 0; r < SIZE; r++) {
        let row = [];
        for (let c = 0; c < SIZE; c++) {
            if (old_board[r][c] != 0) {
                row.push(0);
            }
            else {
                row.push(board[r][c]);
            }
        }
        clicks.push(row);
    }
    return clicks;
}
