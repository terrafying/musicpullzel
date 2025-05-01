extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;
use puzzle_core::PuzzleState;

// Configure the wasm-bindgen-test environment
wasm_bindgen_test_configure!(run_in_browser);

// Tests specifically for the WASM build
// These tests will only run in a WASM environment

#[wasm_bindgen_test]
fn test_wasm_puzzle_creation() {
    let puzzle = PuzzleState::new();
    
    // Verify initial state
    assert_eq!(puzzle.get_bits(), 0);
    assert_eq!(puzzle.get_moves(), 0);
}

#[wasm_bindgen_test]
fn test_wasm_puzzle_toggle() {
    let mut puzzle = PuzzleState::new();
    
    // Test a single toggle operation
    let result = puzzle.toggle(0);
    assert!(result);
    
    // Verify move counter incremented
    assert_eq!(puzzle.get_moves(), 1);
    
    // Position 0 and affected positions should be toggled
    assert!(puzzle.get_position(0));
}

#[wasm_bindgen_test]
fn test_wasm_invalid_input() {
    let mut puzzle = PuzzleState::new();
    
    // Test invalid toggle
    let result = puzzle.toggle(99);
    assert!(!result);
    
    // Move counter should not increment
    assert_eq!(puzzle.get_moves(), 0);
}

#[wasm_bindgen_test]
fn test_wasm_solving_puzzle() {
    let mut puzzle = PuzzleState::new();
    
    // Set a simple target (only position 0 on)
    puzzle.set_target(1);
    
    // Toggle position 0
    puzzle.toggle(0);
    
    // Check if solved
    let is_solved = puzzle.is_solved();
    
    // Outcome depends on the circle of fifths implementation
    // but we can at least verify the API call works
    assert_eq!(is_solved, puzzle.get_bits() == 1);
}

#[wasm_bindgen_test]
fn test_wasm_full_functionality() {
    let mut puzzle = PuzzleState::new();
    
    // Exercise the full API to ensure it all works in WASM context
    puzzle.reset();
    puzzle.set_target(0b101010101010);
    
    // Make some moves
    puzzle.toggle(0);
    puzzle.toggle(3);
    puzzle.toggle(6);
    puzzle.toggle(9);
    
    // Verify state
    assert_eq!(puzzle.get_moves(), 4);
    
    // Get current bits to check against target
    let current = puzzle.get_bits();
    let target = puzzle.get_target();
    
    // The test passes as long as the WASM API works
    // Whether the puzzle is solved depends on the specific moves
    assert_eq!(puzzle.is_solved(), current == target);
}

