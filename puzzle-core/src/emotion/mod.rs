use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use js_sys::{Date, Error as JsError};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum EmotionError {
    #[error("Invalid frame dimensions: width={width}, height={height}")]
    InvalidDimensions {
        width: u32,
        height: u32,
    },
    #[error("Frame buffer is empty")]
    EmptyBuffer,
    #[error("Processing error: {0}")]
    ProcessingError(String),
    #[error("LLM error: {0}")]
    LLMError(String),
}

impl From<EmotionError> for JsValue {
    fn from(error: EmotionError) -> Self {
        JsError::new(&error.to_string()).into()
    }
}

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionState {
    #[wasm_bindgen(skip)]
    pub dominant_emotion: String,
    pub intensity: f32,
    pub confidence: f32,
    pub timestamp: f64,
}

#[wasm_bindgen]
impl EmotionState {
    #[wasm_bindgen(getter)]
    pub fn dominant_emotion(&self) -> String {
        self.dominant_emotion.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_dominant_emotion(&mut self, value: String) {
        self.dominant_emotion = value;
    }

    pub fn validate(&self) -> Result<(), EmotionError> {
        if self.intensity < 0.0 || self.intensity > 1.0 {
            return Err(EmotionError::ProcessingError(
                "Intensity must be between 0 and 1".to_string(),
            ));
        }
        if self.confidence < 0.0 || self.confidence > 1.0 {
            return Err(EmotionError::ProcessingError(
                "Confidence must be between 0 and 1".to_string(),
            ));
        }
        Ok(())
    }
}

#[wasm_bindgen]
pub struct WasmEmotionDetector {
    frame_buffer: Vec<u8>,
}

#[wasm_bindgen]
impl WasmEmotionDetector {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            frame_buffer: Vec::new(),
        }
    }

    fn validate_dimensions(&self, width: u32, height: u32) -> Result<(), EmotionError> {
        if width == 0 || height == 0 {
            return Err(EmotionError::InvalidDimensions { width, height });
        }
        if (width * height * 4) as usize != self.frame_buffer.len() {
            return Err(EmotionError::ProcessingError(
                "Frame buffer size doesn't match dimensions".to_string(),
            ));
        }
        Ok(())
    }

    #[wasm_bindgen]
    pub fn process_frame(&mut self, frame: &[u8], width: u32, height: u32) -> Result<EmotionState, JsValue> {
        // Store and validate frame data
        self.frame_buffer = frame.to_vec();
        self.validate_dimensions(width, height)?;

        if self.frame_buffer.is_empty() {
            return Err(EmotionError::EmptyBuffer.into());
        }

        // Mock emotion detection for now
        // TODO: Implement actual emotion detection using WASM-compatible ML
        let state = EmotionState {
            dominant_emotion: "happy".to_string(),
            intensity: 0.8,
            confidence: 0.9,
            timestamp: Date::now(),
        };

        state.validate()?;
        Ok(state)
    }
}

#[wasm_bindgen]
pub struct WasmEmotionLLM {
    endpoint: String,
}

#[wasm_bindgen]
impl WasmEmotionLLM {
    #[wasm_bindgen(constructor)]
    pub fn new(endpoint: String) -> Self {
        Self { endpoint }
    }

    fn validate_endpoint(&self) -> Result<(), EmotionError> {
        if self.endpoint.is_empty() {
            return Err(EmotionError::LLMError("Empty endpoint URL".to_string()));
        }
        // Add more endpoint validation as needed
        Ok(())
    }

    #[wasm_bindgen]
    pub fn analyze_emotion(&self, emotion_state: EmotionState) -> Result<String, JsValue> {
        self.validate_endpoint()?;
        emotion_state.validate()?;

        // Mock LLM analysis for now
        // TODO: Implement actual LLM integration
        Ok(format!(
            "Analysis of {} emotion with intensity {:.2} and confidence {:.2}",
            emotion_state.dominant_emotion,
            emotion_state.intensity,
            emotion_state.confidence
        ))
    }
} 