"use strict";
// content.ts
console.log("Content script loaded on:", window.location.href);
// Function to fill Sudoku with 1s
function fillSudokuWithOnes() {
    const cells = document.querySelectorAll("input"); // adjust selector to match Sudoku cells
    cells.forEach(cell => {
        cell.value = "1";
        cell.dispatchEvent(new Event("input", { bubbles: true })); // trigger input event in case page listens
    });
    console.log("Sudoku filled with 1s!");
}
