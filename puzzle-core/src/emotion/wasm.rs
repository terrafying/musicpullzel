use wasm_bindgen::prelude::*;
use crate::emotion::{EmotionDetector, EmotionState};
use js_sys::{Uint8Array, Promise};
use wasm_bindgen_futures::JsFuture;

#[wasm_bindgen]
pub struct WasmEmotionDetector {
    detector: EmotionDetector,
}

#[wasm_bindgen]
impl WasmEmotionDetector {
    #[wasm_bindgen(constructor)]
    pub async fn new() -> Result<WasmEmotionDetector, JsValue> {
        let detector = EmotionDetector::new()
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
        Ok(Self { detector })
    }

    #[wasm_bindgen]
    pub async fn process_frame(&self, frame: Uint8Array, width: u32, height: u32) -> Result<JsValue, JsValue> {
        let frame_data = frame.to_vec();
        let emotion_state = self.detector
            .process_frame(&frame_data, width, height)
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(serde_wasm_bindgen::to_value(&emotion_state)?)
    }
}

#[wasm_bindgen]
pub struct WasmEmotionLLM {
    llm: crate::emotion::EmotionLLM,
}

#[wasm_bindgen]
impl WasmEmotionLLM {
    #[wasm_bindgen(constructor)]
    pub fn new(endpoint: &str) -> Self {
        Self {
            llm: crate::emotion::EmotionLLM::new(endpoint),
        }
    }

    #[wasm_bindgen]
    pub async fn analyze_emotion(&self, emotion_state: JsValue) -> Result<Promise, JsValue> {
        let state: EmotionState = serde_wasm_bindgen::from_value(emotion_state)?;
        
        let future = self.llm.analyze_emotion_context(&state)
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(Promise::resolve(&JsValue::from_str(&future)))
    }
} 