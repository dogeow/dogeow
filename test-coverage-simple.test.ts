import { describe, it, expect } from 'vitest'

// 简单的测试函数
function add(a: number, b: number): number {
  return a + b
}

function multiply(a: number, b: number): number {
  return a * b
}

function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero')
  }
  return a / b
}

describe('Simple Math Functions', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
    expect(add(-1, 1)).toBe(0)
    expect(add(0, 0)).toBe(0)
  })

  it('should multiply two numbers correctly', () => {
    expect(multiply(2, 3)).toBe(6)
    expect(multiply(-2, 3)).toBe(-6)
    expect(multiply(0, 5)).toBe(0)
  })

  it('should divide two numbers correctly', () => {
    expect(divide(6, 2)).toBe(3)
    expect(divide(5, 2)).toBe(2.5)
    expect(divide(-6, 2)).toBe(-3)
  })

  it('should throw error when dividing by zero', () => {
    expect(() => divide(5, 0)).toThrow('Division by zero')
  })
})
