const gridContainer = document.getElementById('sudoku-grid');

// Create input grid
for (let i = 0; i < 81; i++) {
  const input = document.createElement('input');
  input.setAttribute('type', 'number');
  input.setAttribute('min', '1');
  input.setAttribute('max', '9');
  input.classList.add('cell');
  gridContainer.appendChild(input);
}

// Read input into matrix
function getMatrix() {
  const inputs = document.querySelectorAll('.sudoku-grid input');
  let matrix = [];
  for (let i = 0; i < 9; i++) {
    let row = [];
    for (let j = 0; j < 9; j++) {
      let val = parseInt(inputs[i * 9 + j].value);
      row.push(isNaN(val) ? 0 : val);
    }
    matrix.push(row);
  }
  return matrix;
}

// Write matrix back to grid
function setMatrix(matrix) {
  const inputs = document.querySelectorAll('.sudoku-grid input');
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      inputs[i * 9 + j].value = matrix[i][j] || '';
    }
  }
}

function solve() {
  const matrix = getMatrix();
  const solved = solveSudoku(matrix);
  setMatrix(solved);
}

function reset() {
  const inputs = document.querySelectorAll('.sudoku-grid input');
  inputs.forEach(input => input.value = '');
}
