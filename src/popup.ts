document.getElementById("solve-btn")?.addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab || !tab.id) {
        console.error("No active tab found!");
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // Find the currently active cell
            const activeCell = document.querySelector<HTMLDivElement>(".sudoku-cell-active");
            if (!activeCell) {
                console.warn("No active cell found!");
                return;
            }

            // Get all cells in row-major order
            const cells = Array.from(document.querySelectorAll<HTMLDivElement>(".sudoku-cell-content"));

            const index = cells.indexOf(activeCell);
            if (index === -1) {
                console.warn("Active cell not in cells list");
                return;
            }

            // Activate the next cell to the right, if any
            const nextIndex = index + 1 < cells.length ? index + 1 : index;
            const nextCell = cells[nextIndex];
            nextCell.classList.add("sudoku-cell-active"); // add active class
            activeCell.classList.remove("sudoku-cell-active"); // remove from previous

            console.log("Moved active cell right:", nextCell);
        }
    });
});
