function solveSudoku(matrix) {
  function findEmptyLocation(matrix) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (matrix[row][col] === 0) {
          return [row, col];
        }
      }
    }
    return null;
  }

  function isValidMove(matrix, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (matrix[row][i] === num || matrix[i][col] === num) {
        return false;
      }
    }

    let startRow = Math.floor(row / 3) * 3;
    let startCol = Math.floor(col / 3) * 3;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (matrix[startRow + i][startCol + j] === num) {
          return false;
        }
      }
    }

    return true;
  }

  function solve() {
    let emptyLocation = findEmptyLocation(matrix);
    if (!emptyLocation) return true;

    let [row, col] = emptyLocation;

    for (let num = 1; num <= 9; num++) {
      if (isValidMove(matrix, row, col, num)) {
        matrix[row][col] = num;

        if (solve()) return true;

        matrix[row][col] = 0;
      }
    }

    return false;
  }

  solve();
  return matrix;
}
