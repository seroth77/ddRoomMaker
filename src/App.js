import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import logo from './logo.svg';
import './App.css';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function App() {
  const [grid, setGrid] = useState([]);
  const [size, setSize] = useState('small');
  const [goldCircle, setGoldCircle] = useState(null);
  const gridRef = useRef(null);

  const createGrid = () => {
    let cols, rows, minCircles, maxCircles;
    if (size === 'small') {
      cols = 4;
      rows = 4;
      minCircles = 5;
      maxCircles = 7; // Limit for small grids
    } else if (size === 'medium') {
      cols = getRandomInt(5, 6);
      rows = getRandomInt(4, 6);
      minCircles = 7;
      maxCircles = cols * rows; // No upper limit for medium/large
    } else if (size === 'large') {
      cols = 7;
      rows = 7;
      minCircles = 9;
      maxCircles = cols * rows;
    }

    // Create empty grid
    let newGrid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 0)
    );

    // Helper to check if a cell is orthogonally adjacent to any circle
    function isOrthogonallyAdjacent(row, col, grid) {
      const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0]
      ];
      for (let [dr, dc] of directions) {
        const nr = row + dr, nc = col + dc;
        if (
          nr >= 0 && nr < rows &&
          nc >= 0 && nc < cols &&
          grid[nr][nc] === 1
        ) {
          return true;
        }
      }
      return false;
    }

    // Helper to check if a cell is within 2 cells of another circle (orthogonally)
    function isWithinTwoCells(row, col, grid) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (Math.abs(dr) + Math.abs(dc) === 0 || Math.abs(dr) + Math.abs(dc) > 2) continue;
          const nr = row + dr, nc = col + dc;
          if (
            nr >= 0 && nr < rows &&
            nc >= 0 && nc < cols &&
            grid[nr][nc] === 1
          ) {
            return true;
          }
        }
      }
      return false;
    }

    // Place circles with constraints
    let placed = 0;
    let attempts = 0;
    while (
      placed < minCircles &&
      placed < maxCircles &&
      attempts < 10000
    ) {
      // Find all valid cells
      let validCells = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (
            newGrid[row][col] === 0 &&
            !isOrthogonallyAdjacent(row, col, newGrid) &&
            (placed === 0 || isWithinTwoCells(row, col, newGrid))
          ) {
            validCells.push([row, col]);
          }
        }
      }
      if (validCells.length === 0) break;
      const [row, col] = validCells[getRandomInt(0, validCells.length - 1)];
      newGrid[row][col] = 1;
      placed++;
      attempts++;
    }

    // Guarantee at least 2 circles per row if possible, but do not exceed maxCircles for small
    for (let row = 0; row < rows; row++) {
      let rowCircles = newGrid[row].filter(cell => cell === 1).length;
      let rowAttempts = 0;
      while (
        rowCircles < 2 &&
        rowAttempts < 100 &&
        placed < maxCircles
      ) {
        let possibleCols = [];
        for (let col = 0; col < cols; col++) {
          if (
            newGrid[row][col] === 0 &&
            !isOrthogonallyAdjacent(row, col, newGrid) &&
            isWithinTwoCells(row, col, newGrid)
          ) {
            possibleCols.push(col);
          }
        }
        if (possibleCols.length === 0) break;
        const col = possibleCols[getRandomInt(0, possibleCols.length - 1)];
        newGrid[row][col] = 1;
        rowCircles++;
        placed++;
        rowAttempts++;
      }
    }

    // Find all edge circle positions
    let edgeCircles = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (
          newGrid[row][col] === 1 &&
          (row === 0 || row === rows - 1 || col === 0 || col === cols - 1)
        ) {
          edgeCircles.push([row, col]);
        }
      }
    }

    // Randomly pick one edge circle to be gold
    let goldCircle = null;
    if (edgeCircles.length > 0) {
      goldCircle = edgeCircles[getRandomInt(0, edgeCircles.length - 1)];
    }

    setGrid(newGrid);
    setGoldCircle(goldCircle);
  };

  // Save grid as JPG
  const saveGridAsJpg = async () => {
    if (!gridRef.current) return;
    const canvas = await html2canvas(gridRef.current, { backgroundColor: "#000" });
    const link = document.createElement('a');
    link.download = 'grid.jpg';
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="no-print">
          <select value={size} onChange={e => setSize(e.target.value)}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <button onClick={createGrid}>Create Grid</button>
          <button onClick={() => window.print()}>Print</button>
          <button onClick={saveGridAsJpg}>Save as JPG</button>
        </div>
        {/* Printable grid */}
        <div style={{ marginTop: 20 }} ref={gridRef}>
          {grid.length > 0 && (
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {grid.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => {
                      // --- HORIZONTAL: between two circles in the same row, two cells apart ---
                      let isHorizontalDashed = false;
                      if (
                        colIndex > 0 &&
                        colIndex < grid[0].length - 1 &&
                        grid[rowIndex][colIndex - 1] === 1 &&
                        grid[rowIndex][colIndex + 1] === 1
                      ) {
                        isHorizontalDashed = true;
                      }
                      // --- VERTICAL: between two circles in the same column, two cells apart ---
                      let isVerticalDashed = false;
                      if (
                        rowIndex > 0 &&
                        rowIndex < grid.length - 1 &&
                        grid[rowIndex - 1][colIndex] === 1 &&
                        grid[rowIndex + 1][colIndex] === 1
                      ) {
                        isVerticalDashed = true;
                      }

                      // --- HALF VERTICAL: if a circle is vertically below a cell with a horizontal dashed line, draw a half vertical dashed line up to the cell above ---
                      let isHalfVerticalDashed = false;
                      if (
                        cell === 1 &&
                        rowIndex > 0 &&
                        colIndex > 0 &&
                        colIndex < grid[0].length - 1 &&
                        grid[rowIndex - 1][colIndex - 1] === 1 &&
                        grid[rowIndex - 1][colIndex + 1] === 1
                      ) {
                        isHalfVerticalDashed = true;
                      }

                      // Check if this is the gold circle
                      const isGold =
                        goldCircle &&
                        goldCircle[0] === rowIndex &&
                        goldCircle[1] === colIndex;

                      return (
                        <td
                          key={colIndex}
                          style={{
                            border: '1px solid #61dafb',
                            width: 40,
                            height: 40,
                            textAlign: 'center',
                            position: 'relative',
                            padding: 0,
                          }}
                        >
                          {cell === 1 ? (
                            <>
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background: isGold ? 'gold' : '#61dafb',
                                  margin: '0 auto',
                                  marginTop: 7,
                                  border: isGold ? '2px solid #bfa100' : undefined,
                                }}
                              ></div>
                              {isHalfVerticalDashed && (
                                <div
                                  style={{
                                    borderLeft: '2px dashed #61dafb',
                                    height: '50%',
                                    position: 'absolute',
                                    left: '50%',
                                    top: 0,
                                    transform: 'translateX(-50%)',
                                  }}
                                ></div>
                              )}
                            </>
                          ) : isHorizontalDashed ? (
                            <div
                              style={{
                                borderTop: '2px dashed #61dafb',
                                width: '100%',
                                position: 'absolute',
                                top: '50%',
                                left: 0,
                                transform: 'translateY(-50%)',
                              }}
                            ></div>
                          ) : isVerticalDashed ? (
                            <div
                              style={{
                                borderLeft: '2px dashed #61dafb',
                                height: '100%',
                                position: 'absolute',
                                left: '50%',
                                top: 0,
                                transform: 'translateX(-50%)',
                              }}
                            ></div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Print styles */}
        <style>
          {`
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}
        </style>
      </header>
    </div>
  );
}

export default App;
