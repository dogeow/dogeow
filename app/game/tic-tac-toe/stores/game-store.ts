import { create } from 'zustand'

export type Player = 'X' | 'O' | null
export type Board = Player[]
export type GameMode = 'pvp' | 'ai'
export type Difficulty = 'easy' | 'medium' | 'hard'

interface GameState {
  board: Board
  currentPlayer: 'X' | 'O'
  winner: Player
  gameOver: boolean
  gameMode: GameMode
  difficulty: Difficulty
  scores: {
    X: number
    O: number
    draws: number
  }
  isAiThinking: boolean
}

interface GameActions {
  makeMove: (index: number) => void
  resetGame: () => void
  resetScores: () => void
  setGameMode: (mode: GameMode) => void
  setDifficulty: (difficulty: Difficulty) => void
  makeAiMove: () => void
}

const initialState: GameState = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  winner: null,
  gameOver: false,
  gameMode: 'pvp',
  difficulty: 'medium',
  scores: { X: 0, O: 0, draws: 0 },
  isAiThinking: false,
}

// 检查获胜条件
const checkWinner = (board: Board): Player => {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // 行
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // 列
    [0, 4, 8],
    [2, 4, 6], // 对角线
  ]

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }

  return null
}

// 获取空位置
const getEmptyPositions = (board: Board): number[] => {
  return board.map((cell, index) => (cell === null ? index : -1)).filter(index => index !== -1)
}

// Minimax 算法（困难模式）
const minimax = (
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha = -Infinity,
  beta = Infinity
): number => {
  const winner = checkWinner(board)

  if (winner === 'O') return 10 - depth
  if (winner === 'X') return depth - 10
  if (board.every(cell => cell !== null)) return 0

  if (isMaximizing) {
    let maxEval = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O'
        const evaluation = minimax(board, depth + 1, false, alpha, beta)
        board[i] = null
        maxEval = Math.max(maxEval, evaluation)
        alpha = Math.max(alpha, evaluation)
        if (beta <= alpha) break
      }
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X'
        const evaluation = minimax(board, depth + 1, true, alpha, beta)
        board[i] = null
        minEval = Math.min(minEval, evaluation)
        beta = Math.min(beta, evaluation)
        if (beta <= alpha) break
      }
    }
    return minEval
  }
}

// AI 移动策略
const getAiMove = (board: Board, difficulty: Difficulty): number => {
  const emptyPositions = getEmptyPositions(board)

  if (emptyPositions.length === 0) return -1

  switch (difficulty) {
    case 'easy':
      // 随机移动
      return emptyPositions[Math.floor(Math.random() * emptyPositions.length)]

    case 'medium':
      // 50% 最优移动，50% 随机移动
      if (Math.random() < 0.5) {
        return emptyPositions[Math.floor(Math.random() * emptyPositions.length)]
      }
    // 继续执行困难模式逻辑

    case 'hard':
      // 使用 Minimax 算法找最优移动
      let bestMove = -1
      let bestValue = -Infinity

      for (const position of emptyPositions) {
        board[position] = 'O'
        const moveValue = minimax([...board], 0, false)
        board[position] = null

        if (moveValue > bestValue) {
          bestValue = moveValue
          bestMove = position
        }
      }

      return bestMove

    default:
      return emptyPositions[0]
  }
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  makeMove: (index: number) => {
    const state = get()
    if (state.board[index] || state.winner || state.gameOver) return

    const newBoard = [...state.board]
    newBoard[index] = state.currentPlayer

    const gameWinner = checkWinner(newBoard)
    const isBoardFull = newBoard.every(cell => cell !== null)

    if (gameWinner) {
      set({
        board: newBoard,
        winner: gameWinner,
        gameOver: true,
        scores: {
          ...state.scores,
          [gameWinner]: state.scores[gameWinner] + 1,
        },
      })
    } else if (isBoardFull) {
      set({
        board: newBoard,
        gameOver: true,
        scores: {
          ...state.scores,
          draws: state.scores.draws + 1,
        },
      })
    } else {
      const nextPlayer = state.currentPlayer === 'X' ? 'O' : 'X'
      set({
        board: newBoard,
        currentPlayer: nextPlayer,
      })

      // 如果是 AI 模式且轮到 O（AI）
      if (state.gameMode === 'ai' && nextPlayer === 'O') {
        setTimeout(() => {
          get().makeAiMove()
        }, 500) // 延迟让 AI 看起来在思考
      }
    }
  },

  makeAiMove: () => {
    const state = get()
    if (state.gameOver || state.currentPlayer !== 'O') return

    set({ isAiThinking: true })

    const aiMoveIndex = getAiMove([...state.board], state.difficulty)

    if (aiMoveIndex !== -1) {
      setTimeout(() => {
        set({ isAiThinking: false })
        get().makeMove(aiMoveIndex)
      }, 300)
    } else {
      set({ isAiThinking: false })
    }
  },

  resetGame: () => {
    set({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameOver: false,
      isAiThinking: false,
    })
  },

  resetScores: () => {
    set({
      scores: { X: 0, O: 0, draws: 0 },
    })
  },

  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode })
    get().resetGame()
  },

  setDifficulty: (difficulty: Difficulty) => {
    set({ difficulty })
  },
}))
