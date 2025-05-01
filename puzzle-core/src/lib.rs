//! # Musical Puzzle Core
//! 
//! This module implements the core logic for a musical puzzle game using WebAssembly.
//! 
//! ## WASM Compatibility Notes
//! 
//! ### Type Safety
//! - All types exposed to WASM must implement `Copy` or be explicitly marked with `#[wasm_bindgen]`
//! - Avoid using `String` in WASM-exposed structs - use numeric types or `&str` instead
//! - Complex types should be converted to simple types before WASM exposure
//! 
//! ### Common Pitfalls
//! 1. String handling: Use `u32` for colors, `&str` for static strings
//! 2. Struct fields: All fields must be `Copy` or explicitly handled
//! 3. Error handling: Convert Rust errors to simple types before WASM exposure
//! 4. Memory management: Be careful with `Vec` and other heap-allocated types
//! 
//! ### Performance Considerations
//! - Keep WASM-exposed functions small and focused
//! - Minimize data copying between JS and WASM
//! - Use numeric types for better performance
//! 
//! ### Testing
//! - Use `#[cfg(test)]` for Rust-only tests
//! - Use `wasm-bindgen-test` for WASM-specific tests
//! - Test both Rust and WASM paths

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;
use rand::prelude::*;
use serde::{Serialize, Deserialize};

// Notes in the chromatic scale (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
const NUM_POSITIONS: usize = 12;

// A bitmask with all positions set
const ALL_POSITIONS: u16 = 0b111111111111;

// Note frequencies in Hz for the chromatic scale starting from C4
// Using f32 for better WASM performance
const NOTE_FREQUENCIES: [f32; NUM_POSITIONS] = [
    261.63, // C4
    277.18, // C#4
    293.66, // D4
    311.13, // D#4
    329.63, // E4
    349.23, // F4
    369.99, // F#4
    392.00, // G4
    415.30, // G#4
    440.00, // A4
    466.16, // A#4
    493.88, // B4
];

// Color values for each note (RGB packed into u32)
// Using u32 instead of String for better WASM compatibility
const NOTE_COLORS: [u32; NUM_POSITIONS] = [
    0xFF6B6B, // C - Red
    0xFF9E6B, // C# - Orange-Red
    0xFFD166, // D - Yellow
    0xE6FF6B, // D# - Yellow-Green
    0x6BFF6B, // E - Green
    0x6BFFD1, // F - Green-Blue
    0x6BD1FF, // F# - Light Blue
    0x6B6BFF, // G - Blue
    0xD16BFF, // G# - Purple
    0xFF6BFF, // A - Pink
    0xFF6BD1, // A# - Pink-Red
    0xFF6B9E, // B - Pink-Orange
];

/// Difficulty levels for the puzzle
/// 
/// # WASM Notes
/// - Enum must be `Copy` and `Clone` for WASM compatibility
/// - All variants must be simple types
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[derive(Serialize, Deserialize, Copy, Clone, PartialEq, Debug)]
pub enum Difficulty {
    Easy,
    Medium,
    Hard,
    Expert,
}

/// Game statistics structure
/// 
/// # WASM Notes
/// - All fields must be simple numeric types
/// - No heap allocation in this struct
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[derive(Serialize, Deserialize, Debug)]
pub struct GameStats {
    pub moves: u32,
    pub time: f64,
    pub score: u32,
    pub difficulty: Difficulty,
    pub completed: bool,
}

/// Represents a musical note bubble
/// 
/// # WASM Notes
/// - All fields must be `Copy` types
/// - Using u32 for color instead of String
/// - Position is u8 to minimize memory usage
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[derive(Serialize, Deserialize, Copy, Clone, PartialEq, Debug)]
pub struct Bubble {
    pub position: u8,
    pub active: bool,
    pub frequency: f32,
    pub color: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl Bubble {
    /// Creates a new bubble for a given position
    /// 
    /// # Arguments
    /// * `position` - The position in the chromatic scale (0-11)
    /// 
    /// # Returns
    /// A new Bubble instance with default values
    /// 
    /// # Panics
    /// Will panic if position >= NUM_POSITIONS
    pub fn new(position: u8) -> Self {
        // Fix operator precedence with parentheses
        assert!((position as usize) < NUM_POSITIONS, "Position out of bounds");
        
        // Ensure we don't access out of bounds even if assert is disabled
        let pos = (position as usize).min(NUM_POSITIONS - 1);
        
        Bubble {
            position,
            active: false,
            frequency: NOTE_FREQUENCIES[pos],
            color: NOTE_COLORS[pos],
        }
    }

    /// Toggles the active state of the bubble
    pub fn toggle(&mut self) {
        self.active = !self.active;
    }
}

/// Main puzzle state
#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
pub struct PuzzleState {
    /// Bitfield representing the state of each position
    /// Each bit corresponds to one of the 12 notes in the chromatic scale
    bits: u16,
    
    /// The target state that would represent "solved"
    target: u16,
    
    /// Counter for the number of moves made
    moves: u32,

    /// Current difficulty level
    difficulty: Difficulty,

    /// Start time of the puzzle
    start_time: f64,

    /// Current score
    score: u32,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
impl PuzzleState {
    /// Creates a new puzzle state
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen(constructor))]
    pub fn new() -> Self {
        // Initialize with a random configuration
        let bits = 0b000000000000; // Start with all positions off
        let target = 0b111111111111; // Target is all positions on
        
        PuzzleState {
            bits,
            target,
            moves: 0,
            difficulty: Difficulty::Easy,
            start_time: get_current_time(),
            score: 0,
        }
    }
    
    /// Reset the puzzle to the initial state
    pub fn reset(&mut self) {
        self.bits = 0;
        self.moves = 0;
        self.start_time = get_current_time();
        self.score = 0;
    }
    
    /// Get the current state as a bitfield
    pub fn get_bits(&self) -> u16 {
        self.bits
    }
    
    /// Get the number of moves made
    pub fn get_moves(&self) -> u32 {
        self.moves
    }

    /// Get the current score
    pub fn get_score(&self) -> u32 {
        self.score
    }

    /// Get the current difficulty
    pub fn get_difficulty(&self) -> Difficulty {
        self.difficulty
    }

    /// Set the difficulty level
    pub fn set_difficulty(&mut self, difficulty: Difficulty) {
        self.difficulty = difficulty;
        self.generate_new_puzzle();
    }

    /// Generate a new puzzle based on difficulty
    fn generate_new_puzzle(&mut self) {
        let mut rng = rand::thread_rng();
        
        // Generate target pattern based on difficulty
        let target = match self.difficulty {
            Difficulty::Easy => {
                // Easy: 3-4 random notes
                let num_notes = rng.gen_range(3..5);
                let mut target = 0;
                for _ in 0..num_notes {
                    target |= 1 << rng.gen_range(0..NUM_POSITIONS);
                }
                target
            },
            Difficulty::Medium => {
                // Medium: 5-7 random notes
                let num_notes = rng.gen_range(5..8);
                let mut target = 0;
                for _ in 0..num_notes {
                    target |= 1 << rng.gen_range(0..NUM_POSITIONS);
                }
                target
            },
            Difficulty::Hard => {
                // Hard: 8-10 random notes
                let num_notes = rng.gen_range(8..11);
                let mut target = 0;
                for _ in 0..num_notes {
                    target |= 1 << rng.gen_range(0..NUM_POSITIONS);
                }
                target
            },
            Difficulty::Expert => {
                // Expert: All notes with some random toggles
                let mut target = ALL_POSITIONS;
                for _ in 0..3 {
                    target ^= 1 << rng.gen_range(0..NUM_POSITIONS);
                }
                target
            }
        };

        self.target = target;
        self.bits = 0;
        self.moves = 0;
        self.start_time = get_current_time();
        self.score = 0;
    }
    
    /// Toggle a position (0-11 representing the 12 notes)
    /// This will also affect other positions based on the circle of fifths
    pub fn toggle(&mut self, position: u8) -> bool {
        if position as usize >= NUM_POSITIONS {
            return false;
        }
        
        // Toggle the selected position and its circle of fifths relationships
        let pos_mask = 1 << position;
        let affected_positions = CIRCLE_OF_FIFTHS_MAP[position as usize];
        self.bits ^= pos_mask | affected_positions;
        
        // Increment move counter
        self.moves += 1;
        
        // Update score
        self.update_score();
        
        true
    }
    
    /// Check if the puzzle is solved
    pub fn is_solved(&self) -> bool {
        self.bits == self.target
    }
    
    /// Get the state of a specific position
    pub fn get_position(&self, position: u8) -> bool {
        if position as usize >= NUM_POSITIONS {
            return false;
        }
        (self.bits & (1 << position)) != 0
    }
    
    /// Get the target state
    pub fn get_target(&self) -> u16 {
        self.target
    }
    
    /// Set the target state
    pub fn set_target(&mut self, target: u16) {
        self.target = target;
        self.bits = 0;
        self.moves = 0;
        self.start_time = get_current_time();
        self.score = 0;
    }

    /// Update the score based on current game state
    fn update_score(&mut self) {
        let base_score: u32 = match self.difficulty {
            Difficulty::Easy => 1000,
            Difficulty::Medium => 2000,
            Difficulty::Hard => 3000,
            Difficulty::Expert => 5000,
        };

        let move_penalty: u32 = self.moves * 10;
        let time_elapsed = (get_current_time() - self.start_time) / 1000.0;
        let time_penalty: u32 = (time_elapsed * 5.0) as u32;

        self.score = base_score.saturating_sub(move_penalty).saturating_sub(time_penalty);
    }

    /// Get the frequency for a given position
    /// 
    /// # Arguments
    /// * `position` - The position in the chromatic scale (0-11)
    /// 
    /// # Returns
    /// The frequency in Hz for the note at the given position
    /// 
    /// # WASM Notes
    /// - Returns f32 which is automatically converted to a JS number
    /// - Returns 0.0 for invalid positions
    /// - Uses bounds checking to prevent panics
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
    pub fn get_frequency(&self, position: u8) -> f32 {
        if (position as usize) >= NUM_POSITIONS {
            0.0
        } else {
            NOTE_FREQUENCIES[position as usize]
        }
    }

    /// Get all bubbles in their current state
    /// 
    /// # WASM Notes
    /// - Returns a Vec<Bubble> that is automatically converted to a JS array
    /// - Each Bubble is converted to a JS object with matching properties
    /// - Uses safe array access to prevent panics
    #[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
    pub fn get_bubbles(&self) -> Vec<Bubble> {
        (0..NUM_POSITIONS as u8)
            .map(|pos| {
                let mut bubble = Bubble::new(pos);
                bubble.active = self.get_position(pos);
                bubble
            })
            .collect()
    }
}

/// The circle of fifths relationships
/// Each index maps to the positions that should be affected
/// when the note at that index is toggled
const CIRCLE_OF_FIFTHS_MAP: [u16; NUM_POSITIONS] = [
    0b000000000101, // C affects F and G
    0b000000010001, // C# affects G# and C
    0b000001000001, // D affects A and C#
    0b000100000001, // D# affects A# and D
    0b010000000001, // E affects B and D#
    0b100000000010, // F affects C and E
    0b000000001010, // F# affects C# and F
    0b000000100010, // G affects D and F#
    0b000010000010, // G# affects D# and G
    0b001000000010, // A affects E and G#
    0b100000000100, // A# affects F and A
    0b000000010100, // B affects F# and A#
];

// Helper function to get current time that works in both WASM and non-WASM environments
/// 
/// # WASM Notes
/// - Uses js_sys::Date::now() in WASM
/// - Uses std::time in native Rust
/// - Returns milliseconds for consistency
#[cfg(target_arch = "wasm32")]
fn get_current_time() -> f64 {
    js_sys::Date::now()
}

#[cfg(not(target_arch = "wasm32"))]
fn get_current_time() -> f64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs_f64() * 1000.0 // Convert to milliseconds to match js_sys::Date::now()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_toggle_position() {
        let mut puzzle = PuzzleState::new();
        
        // Toggle position 0 (C)
        puzzle.toggle(0);
        
        // Check that position 0 and its circle of fifths neighbors are toggled
        assert!(puzzle.get_position(0)); // C should be on
        assert!(puzzle.get_position(5)); // F should be on
        assert!(puzzle.get_position(7)); // G should be on
    }

    #[test]
    fn test_is_solved() {
        let mut puzzle = PuzzleState::new();
        
        // Set a simple target (only position 0 on)
        puzzle.set_target(1);
        
        // Toggle position 0
        puzzle.toggle(0);
        
        // Check if solved
        assert!(puzzle.is_solved());
    }

    #[test]
    fn test_circle_of_fifths_relationships() {
        let mut puzzle = PuzzleState::new();
        
        // Test each position's circle of fifths relationships
        for i in 0..NUM_POSITIONS {
            puzzle.reset();
            puzzle.toggle(i as u8);
            
            // Get the expected affected positions
            let affected = CIRCLE_OF_FIFTHS_MAP[i];
            
            // Check that only the expected positions are toggled
            for j in 0..NUM_POSITIONS {
                let expected = (affected & (1 << j)) != 0;
                let actual = puzzle.get_position(j as u8);
                assert_eq!(expected, actual, "Position {} should be {} when toggling {}", j, expected, i);
            }
        }
    }

    #[test]
    fn test_get_position() {
        let mut puzzle = PuzzleState::new();
        
        // Test valid positions
        puzzle.toggle(0);
        assert!(puzzle.get_position(0));
        
        puzzle.toggle(5);
        assert!(puzzle.get_position(5));
        
        // Test invalid positions
        assert!(!puzzle.get_position(12));
        assert!(!puzzle.get_position(255));
    }

    #[test]
    fn test_invalid_inputs() {
        let mut puzzle = PuzzleState::new();
        
        // Test invalid toggle
        assert!(!puzzle.toggle(12));
        assert!(!puzzle.toggle(255));
        
        // Move counter should not increment
        assert_eq!(puzzle.get_moves(), 0);
    }

    #[test]
    fn test_move_counter() {
        let mut puzzle = PuzzleState::new();
        
        // Initial state
        assert_eq!(puzzle.get_moves(), 0);
        
        // Make some moves
        puzzle.toggle(0);
        assert_eq!(puzzle.get_moves(), 1);
        
        puzzle.toggle(1);
        assert_eq!(puzzle.get_moves(), 2);
        
        // Reset should clear moves
        puzzle.reset();
        assert_eq!(puzzle.get_moves(), 0);
    }

    #[test]
    fn test_target_setting() {
        let mut puzzle = PuzzleState::new();
        
        // Set a custom target
        let target = 0b010101010101;
        puzzle.set_target(target);
        
        // Verify target was set
        assert_eq!(puzzle.get_target(), target);
        
        // State should be reset
        assert_eq!(puzzle.get_bits(), 0);
        assert_eq!(puzzle.get_moves(), 0);
    }
}
