let board = [
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', 'B', 'W', '', '', ''],
    ['', '', '', 'W', 'B', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '']
  ];
  let currentPlayer = 'B';
  
  function setup() {
    createCanvas(windowWidth, windowHeight);
    drawBoard();
    frameRate(15);
  }
  
  function draw() {
    if (checkGameOver() || frameCount%6 == 0) {
      board = [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', 'B', 'W', '', '', ''],
        ['', '', '', 'W', 'B', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '']
      ];
      currentPlayer = 'B';
      drawBoard();
      return;
    }
    
    let possibleMoves = getValidMoves();
    if (possibleMoves.length === 0) {
      currentPlayer = (currentPlayer === 'B') ? 'W' : 'B';
      possibleMoves = getValidMoves();
    }
    
    if (possibleMoves.length > 0) {
      setTimeout(function() {
        let move = random(possibleMoves);
        placeStone(move[0], move[1], currentPlayer);
        currentPlayer = (currentPlayer === 'B') ? 'W' : 'B';
      }, 10);
    }
  }
  
  function drawBoard() {
    background(0, 150, 0);
    let size = width/8;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          fill(0, 100, 0);
        } else {
          fill(255);
        }
        rect(j * size, i * size, size, size);
        if (board[i][j] === 'B') {
          fill(0);
          ellipse(j * size + size/2, i * size + size/2, size-10, size-10);
        } else if (board[i][j] === 'W') {
          fill(255);
          ellipse(j * size + size/2, i * size + size/2, size-10, size-10);
        }
      }
    }
  }
  
  function getValidMoves() {
    let moves = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (isValidMove(i, j, currentPlayer)) {
          moves.push([i, j]);
        }
      }
    }
    return moves;
  }
  
  function isValidMove(row, col, player) {
    if (board[row][col] !== '') {
      return false;
    }
    
    let directions = [
      [0, 1], [1, 1], [1, 0], [1, -1],
      [0, -1], [-1, -1], [-1, 0], [-1, 1]
    ];
    
    let valid = false;
    for (let i = 0; i < directions.length; i++) {
      let dr = directions[i][0];
      let dc = directions[i][1];
      
      let r = row + dr;
      let c = col + dc;
      let count = 0;
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] !== '') {
        if (board[r][c] === player) {
          if (count > 0) {
            valid = true;
          }
          break;
        }
        count++;
        r += dr;
        c += dc;
      }
    }
    
    return valid;
  }
  
  function placeStone(row, col, player) {
    board[row][col] = player;
    flipStones(row, col, player);
    drawBoard();
  }
  
  
  
  function flipStones(row, col, player) {
    let directions = [
      [0, 1], [1, 1], [1, 0], [1, -1],
      [0, -1], [-1, -1], [-1, 0], [-1, 1]
    ];
    
    for (let i = 0; i < directions.length; i++) {
      let dr = directions[i][0];
      let dc = directions[i][1];
      
      let r = row + dr;
      let c = col + dc;
      let flipped = false;
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] !== '') {
        if (board[r][c] === player) {
          if (flipped) {
            break;
          } else {
            flipped = true;
            r = row + dr;
            c = col + dc;
            continue;
          }
        }
        board[r][c] = player;
        r += dr;
        c += dc;
      }
    }
  }
  
  
  
  function checkGameOver() {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === '') {
          return false;
        }
      }
    }
    return true;
  }
  