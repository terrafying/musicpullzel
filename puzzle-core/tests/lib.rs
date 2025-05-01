use puzzle_core::PuzzleState;

// Basic integration tests for the puzzle core functionality
// These tests run in the normal Rust test environment

#[test]
fn test_puzzle_creation() {
    let puzzle = PuzzleState::new();
    
    // A new puzzle should start with all positions off
    assert_eq!(puzzle.get_bits(), 0);
    
    // Should have no moves yet
    assert_eq!(puzzle.get_moves(), 0);
    
    // The default target is all positions on
    assert_eq!(puzzle.get_target(), 0b111111111111);
}

#[test]
fn test_puzzle_toggle_sequence() {
    // This test performs a sequence of toggles and verifies the puzzle state
    let mut puzzle = PuzzleState::new();
    
    // Perform a sequence of toggles
    puzzle.toggle(0); // C
    puzzle.toggle(4); // E
    puzzle.toggle(7); // G
    
    // The resulting state should reflect these toggles and their circle of fifths effects
    assert_eq!(puzzle.get_moves(), 3);
    
    // Check specific positions to ensure they're in the expected state
    assert!(puzzle.get_position(0) != puzzle.get_position(4));
    
    // Check if the puzzle is solved (likely not after just a few random toggles)
    assert!(!puzzle.is_solved());
}

#[test]
fn test_puzzle_reset() {
    let mut puzzle = PuzzleState::new();
    
    // Make some moves
    puzzle.toggle(0);
    puzzle.toggle(5);
    assert_eq!(puzzle.get_moves(), 2);
    assert_ne!(puzzle.get_bits(), 0);
    
    // Reset the puzzle
    puzzle.reset();
    
    // State should be back to initial
    assert_eq!(puzzle.get_moves(), 0);
    assert_eq!(puzzle.get_bits(), 0);
}

#[test]
fn test_custom_target() {
    let mut puzzle = PuzzleState::new();
    
    // Set a custom target pattern
    let target = 0b010101010101; // Alternating notes
    puzzle.set_target(target);
    
    // Verify target was set correctly
    assert_eq!(puzzle.get_target(), target);
    
    // Set the same bit pattern to the puzzle state
    // (In a real game, this would happen through a sequence of toggles)
    for i in 0..12 {
        if ((target >> i) & 1) != (puzzle.get_bits() >> i & 1) {
            puzzle.toggle(i as u8);
        }
    }
    
    // The puzzle should now be solved
    assert!(puzzle.is_solved());
}

