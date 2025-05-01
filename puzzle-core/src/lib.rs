use wasm_bindgen::prelude::*;
use rand::prelude::*;
use serde::{Serialize, Deserialize};
use rand_chacha::ChaCha8Rng;
use rand::SeedableRng;

mod emotion;
pub use emotion::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Notes in the chromatic scale (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
const NUM_POSITIONS: usize = 12;

// A bitmask with all positions set
const ALL_POSITIONS: u16 = 0b111111111111;

#[wasm_bindgen]
#[derive(Serialize, Deserialize, Copy, Clone, PartialEq, Debug)]
pub enum Difficulty {
    Easy,
    Medium,
    Hard,
    Expert,
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize, Debug)]
pub struct GameStats {
    pub moves: u32,
    pub time: f64,
    pub score: u32,
    pub difficulty: Difficulty,
    pub completed: bool,
}

#[wasm_bindgen]
pub struct Game {
    difficulty: Difficulty,
    moves: u32,
    start_time: f64,
    score: u32,
    completed: bool,
    rng: ChaCha8Rng,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Game {
        Game {
            difficulty: Difficulty::Easy,
            moves: 0,
            start_time: js_sys::Date::now(),
            score: 0,
            completed: false,
            rng: ChaCha8Rng::from_entropy(),
        }
    }

    #[wasm_bindgen]
    pub fn get_difficulty(&self) -> Difficulty {
        self.difficulty
    }

    #[wasm_bindgen]
    pub fn set_difficulty(&mut self, difficulty: Difficulty) {
        self.difficulty = difficulty;
    }

    #[wasm_bindgen]
    pub fn make_move(&mut self) {
        self.moves += 1;
        self.update_score();
    }

    #[wasm_bindgen]
    pub fn complete_game(&mut self) {
        self.completed = true;
        self.update_score();
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> GameStats {
        GameStats {
            moves: self.moves,
            time: (js_sys::Date::now() - self.start_time) / 1000.0,
            score: self.score,
            difficulty: self.difficulty,
            completed: self.completed,
        }
    }

    fn update_score(&mut self) {
        let base_score: u32 = match self.difficulty {
            Difficulty::Easy => 1000,
            Difficulty::Medium => 2000,
            Difficulty::Hard => 3000,
            Difficulty::Expert => 5000,
        };

        let move_penalty: u32 = self.moves * 10;
        let time_elapsed = (js_sys::Date::now() - self.start_time) / 1000.0;
        let time_penalty: u32 = (time_elapsed * 5.0) as u32;

        self.score = base_score.saturating_sub(move_penalty).saturating_sub(time_penalty);
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

/// Main puzzle state
#[wasm_bindgen]
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

    /// Random number generator
    rng: ChaCha8Rng
}

#[wasm_bindgen]
impl PuzzleState {
    /// Creates a new puzzle state
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        // Initialize with a random configuration
        let bits = 0b000000000000; // Start with all positions off
        let target = 0b111111111111; // Target is all positions on
        
        PuzzleState {
            bits,
            target,
            moves: 0,
            difficulty: Difficulty::Easy,
            start_time: js_sys::Date::now(),
            score: 0,
            rng: ChaCha8Rng::from_entropy()
        }
    }
    
    /// Reset the puzzle to the initial state
    pub fn reset(&mut self) {
        self.bits = 0;
        self.moves = 0;
        self.start_time = js_sys::Date::now();
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
        let rng = &mut self.rng;
        
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
        self.start_time = js_sys::Date::now();
        self.score = 0;
    }
    
    /// Toggle a position (0-11 representing the 12 notes)
    /// This will also affect other positions based on the circle of fifths
    pub fn toggle(&mut self, position: u8) -> bool {
        if position as usize >= NUM_POSITIONS {
            return false;
        }
        
        // Toggle the selected position
        let pos_mask = 1 << position;
        self.bits ^= pos_mask;
        
        // Apply the circle of fifths relationship
        // Toggle positions that are affected by the current position
        let affected_positions = CIRCLE_OF_FIFTHS_MAP[position as usize];
        self.bits ^= affected_positions;
        
        // Increment the move counter
        self.moves += 1;

        // Update score based on difficulty and moves
        self.update_score();
        
        // Return true if the operation was successful
        true
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
        let time_elapsed = (js_sys::Date::now() - self.start_time) / 1000.0;
        let time_penalty: u32 = (time_elapsed * 5.0) as u32;

        self.score = base_score.saturating_sub(move_penalty).saturating_sub(time_penalty);
    }
    
    /// Check if the puzzle is solved (all positions match the target)
    pub fn is_solved(&self) -> bool {
        self.bits == self.target
    }
    
    /// Get the state of a specific position
    pub fn get_position(&self, position: u8) -> bool {
        if position as usize >= NUM_POSITIONS {
            return false;
        }
        
        let pos_mask = 1 << position;
        (self.bits & pos_mask) != 0
    }
    
    /// Get the target state
    pub fn get_target(&self) -> u16 {
        self.target
    }
    
    /// Set a custom target state
    pub fn set_target(&mut self, target: u16) {
        // Ensure only valid bits are set (only the first 12 bits)
        self.target = target & ALL_POSITIONS;
    }
}

/// Test module
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_toggle_position() {
        let mut state = PuzzleState::new();
        assert_eq!(state.get_bits(), 0);
        
        // Toggle position 0 (C)
        state.toggle(0);
        // Position 0 should be toggled, as well as positions defined in the map
        assert_ne!(state.get_bits(), 0);
        
        // Specifically, C (position 0) affects F (position 5) and G (position 7)
        // So bits 0, 5, and 7 should be set
        let expected_bits = (1 << 0) | (1 << 5) | (1 << 7);
        assert_eq!(state.get_bits(), expected_bits);
    }
    
    #[test]
    fn test_is_solved() {
        let mut state = PuzzleState::new();
        state.set_target(0b111111111111); // All positions on
        
        // Initially not solved
        assert!(!state.is_solved());
        
        // Set bits to match target
        // In a real game, this would happen through a sequence of toggles
        state.bits = 0b111111111111;
        assert!(state.is_solved());
        
        // Test with a different target
        state.set_target(0b101010101010); // Alternating positions
        state.bits = 0b101010101010;
        assert!(state.is_solved());
        
        // Not solved when bits don't match target
        state.bits = 0b111111111111;
        assert!(!state.is_solved());
    }
    
    #[test]
    fn test_circle_of_fifths_relationships() {
        let mut state = PuzzleState::new();
        
        // Test that C# (position 1) affects C (position 0) and G# (position 8)
        state.toggle(1);
        let expected_bits = (1 << 1) | (1 << 0) | (1 << 8);
        assert_eq!(state.get_bits(), expected_bits);
        
        // Toggle another position and verify relationships
        // D (position 2) affects C# (position 1) and A (position 9)
        // Since C# is already toggled, this will turn it off
        state.toggle(2);
        let expected_bits = (1 << 2) | (1 << 0) | (1 << 8) | (1 << 9);
        assert_eq!(state.get_bits(), expected_bits);
        
        // Reset and test E (position 4) which should affect B (11) and D# (3)
        state.reset();
        state.toggle(4);
        let expected_bits = (1 << 4) | (1 << 11) | (1 << 3);
        assert_eq!(state.get_bits(), expected_bits);
    }
    
    #[test]
    fn test_get_position() {
        let mut state = PuzzleState::new();
        
        // Toggle position 3 (D#)
        state.toggle(3);
        
        // Check each position's state
        for i in 0..NUM_POSITIONS {
            let expected = match i {
                3 => true, // D# toggled directly
                2 => true, // D affected by D#
                10 => true, // A# affected by D#
                _ => false,
            };
            assert_eq!(state.get_position(i as u8), expected, "Position {} should be {}", i, expected);
        }
    }
    
    #[test]
    fn test_invalid_inputs() {
        let mut state = PuzzleState::new();
        
        // Test invalid position toggle
        assert!(!state.toggle(12)); // Out of bounds
        assert!(!state.toggle(255)); // Far out of bounds
        
        // Test get_position with invalid index
        assert!(!state.get_position(12));
        assert!(!state.get_position(255));
        
        // Test that invalid inputs don't change the state
        assert_eq!(state.get_bits(), 0);
        assert_eq!(state.get_moves(), 0);
    }
    
    #[test]
    fn test_move_counter() {
        let mut state = PuzzleState::new();
        assert_eq!(state.get_moves(), 0);
        
        // Each valid toggle should increment the counter
        state.toggle(0);
        assert_eq!(state.get_moves(), 1);
        
        state.toggle(3);
        assert_eq!(state.get_moves(), 2);
        
        // Invalid toggle should not increment counter
        state.toggle(12);
        assert_eq!(state.get_moves(), 2);
        
        // Reset should clear the counter
        state.reset();
        assert_eq!(state.get_moves(), 0);
    }
    
    #[test]
    fn test_target_setting() {
        let mut state = PuzzleState::new();
        
        // Default target should be all bits on
        assert_eq!(state.get_target(), 0b111111111111);
        
        // Test setting a custom target
        state.set_target(0b010101010101);
        assert_eq!(state.get_target(), 0b010101010101);
        
        // Test that bits outside the valid range are masked
        state.set_target(0xFFFF); // 16 bits all set
        assert_eq!(state.get_target(), 0b111111111111); // Only 12 bits should remain
    }
}
