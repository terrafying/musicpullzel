import * as faceapi from 'face-api.js';

export interface EmotionData {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  timestamp: number;
}

export interface EmotionFeedback {
  dominantEmotion: string;
  intensity: number;
  confidence: number;
  timestamp: number;
}

export class EmotionService {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized = false;
  private isProcessing = false;
  private emotionHistory: EmotionFeedback[] = [];
  private readonly MAX_HISTORY = 50;
  private readonly EMOTION_THRESHOLD = 0.5;
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  // Add cybernetic emotional state
  private emotionalHomeostasis = {
    stability: 0.5,
    adaptation: 0.3,
    resonance: 0.4,
    coherence: 0.6
  };

  // Add emotional resonance tracking
  private emotionalResonance = {
    current: 0.5,
    target: 0.5,
    rate: 0.1
  };

  constructor() {
    this.initializeModels();
  }

  private async initializeModels() {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      this.isInitialized = true;
      console.log('Emotion detection models loaded');
    } catch (error) {
      console.error('Failed to load emotion detection models:', error);
    }
  }

  public async startEmotionDetection(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Emotion detection not initialized');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.autoplay = true;
      
      this.canvas = document.createElement('canvas');
      this.canvas.style.display = 'none';
      document.body.appendChild(this.canvas);

      await this.video.play();
      this.processEmotions();
    } catch (error) {
      console.error('Failed to start emotion detection:', error);
      throw error;
    }
  }

  private async processEmotions() {
    if (!this.video || !this.canvas || this.isProcessing) return;

    this.isProcessing = true;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Set canvas size to match video
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(this.video, 0, 0);

      // Detect faces and emotions
      const detections = await faceapi.detectAllFaces(
        this.canvas,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceExpressions();

      if (detections.length > 0) {
        const emotions = detections[0].expressions;
        const feedback = this.processEmotionData(emotions);
        
        // Update emotional homeostasis
        this.updateEmotionalHomeostasis(feedback);
        
        // Update emotional resonance
        this.updateEmotionalResonance(feedback);
        
        this.emotionHistory.push(feedback);
        
        if (this.emotionHistory.length > this.MAX_HISTORY) {
          this.emotionHistory.shift();
        }
      }
    } catch (error) {
      console.error('Error processing emotions:', error);
    }

    this.isProcessing = false;
    requestAnimationFrame(() => this.processEmotions());
  }

  private processEmotionData(emotions: any): EmotionFeedback {
    const emotionEntries = Object.entries(emotions) as [string, number][];
    const [dominantEmotion, intensity] = emotionEntries.reduce(
      (max, [emotion, value]) => value > max[1] ? [emotion, value] : max,
      ['neutral', 0]
    );

    return {
      dominantEmotion,
      intensity,
      confidence: this.calculateConfidence(emotions),
      timestamp: Date.now()
    };
  }

  private calculateConfidence(emotions: any): number {
    const values = Object.values(emotions) as number[];
    const sum = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values);
    return max / sum;
  }

  private updateEmotionalHomeostasis(feedback: EmotionFeedback) {
    const learningRate = 0.1;
    
    // Calculate stability based on emotion transitions
    const stability = this.calculateEmotionalStability();
    
    // Calculate adaptation based on emotion intensity changes
    const adaptation = this.calculateEmotionalAdaptation();
    
    // Calculate resonance based on emotion coherence
    const resonance = this.calculateEmotionalResonance();
    
    // Calculate coherence based on emotion patterns
    const coherence = this.calculateEmotionalCoherence();
    
    // Update homeostasis state
    this.emotionalHomeostasis.stability = 
      this.emotionalHomeostasis.stability * (1 - learningRate) + 
      stability * learningRate;
      
    this.emotionalHomeostasis.adaptation = 
      this.emotionalHomeostasis.adaptation * (1 - learningRate) + 
      adaptation * learningRate;
      
    this.emotionalHomeostasis.resonance = 
      this.emotionalHomeostasis.resonance * (1 - learningRate) + 
      resonance * learningRate;
      
    this.emotionalHomeostasis.coherence = 
      this.emotionalHomeostasis.coherence * (1 - learningRate) + 
      coherence * learningRate;
  }

  private updateEmotionalResonance(feedback: EmotionFeedback) {
    // Calculate target resonance based on current emotional state
    const targetResonance = this.calculateTargetResonance(feedback);
    
    // Smoothly adjust current resonance towards target
    this.emotionalResonance.current = 
      this.emotionalResonance.current * (1 - this.emotionalResonance.rate) + 
      targetResonance * this.emotionalResonance.rate;
  }

  private calculateEmotionalStability(): number {
    if (this.emotionHistory.length < 2) return 0.5;
    
    const recentEmotions = this.emotionHistory.slice(-10);
    const transitions = recentEmotions.filter((e, i) => 
      i > 0 && e.dominantEmotion !== recentEmotions[i-1].dominantEmotion
    ).length;
    
    return 1 - (transitions / recentEmotions.length);
  }

  private calculateEmotionalAdaptation(): number {
    if (this.emotionHistory.length < 2) return 0.3;
    
    const recentEmotions = this.emotionHistory.slice(-5);
    const intensityChanges = recentEmotions.slice(1).map((e, i) => 
      Math.abs(e.intensity - recentEmotions[i].intensity)
    );
    
    return 1 - (intensityChanges.reduce((sum, val) => sum + val, 0) / intensityChanges.length);
  }

  private calculateEmotionalResonance(): number {
    if (this.emotionHistory.length < 3) return 0.4;
    
    const recentEmotions = this.emotionHistory.slice(-5);
    const resonanceScores = recentEmotions.map(e => 
      e.confidence * e.intensity
    );
    
    return resonanceScores.reduce((sum, val) => sum + val, 0) / resonanceScores.length;
  }

  private calculateEmotionalCoherence(): number {
    if (this.emotionHistory.length < 3) return 0.6;
    
    const recentEmotions = this.emotionHistory.slice(-5);
    const dominantEmotion = this.getDominantEmotion(recentEmotions);
    
    const coherenceScores = recentEmotions.map(e => 
      e.dominantEmotion === dominantEmotion ? 1 : 0
    );
    
    return coherenceScores.reduce((sum: number, val: number) => sum + val, 0) / coherenceScores.length;
  }

  private calculateTargetResonance(feedback: EmotionFeedback): number {
    const baseResonance = feedback.confidence * feedback.intensity;
    const stabilityFactor = this.emotionalHomeostasis.stability;
    const coherenceFactor = this.emotionalHomeostasis.coherence;
    
    return baseResonance * (0.4 + stabilityFactor * 0.3 + coherenceFactor * 0.3);
  }

  private getDominantEmotion(emotions: EmotionFeedback[]): string {
    const emotionCounts = emotions.reduce((counts: Record<string, number>, e) => {
      counts[e.dominantEmotion] = (counts[e.dominantEmotion] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  public getRecentEmotions(): EmotionFeedback[] {
    return this.emotionHistory;
  }

  public getEmotionalState(): {
    currentEmotion: string;
    emotionalStability: number;
    engagement: number;
    homeostasis: typeof this.emotionalHomeostasis;
    resonance: number;
  } {
    if (this.emotionHistory.length === 0) {
      return {
        currentEmotion: 'neutral',
        emotionalStability: 0,
        engagement: 0,
        homeostasis: this.emotionalHomeostasis,
        resonance: this.emotionalResonance.current
      };
    }

    const recentEmotions = this.emotionHistory.slice(-10);
    const currentEmotion = recentEmotions[recentEmotions.length - 1].dominantEmotion;
    
    // Calculate emotional stability based on emotion changes
    const stability = 1 - (recentEmotions.filter((e, i, arr) => 
      i > 0 && e.dominantEmotion !== arr[i - 1].dominantEmotion
    ).length / recentEmotions.length);

    // Calculate engagement based on emotion intensity and confidence
    const engagement = recentEmotions.reduce((sum, e) => 
      sum + (e.intensity * e.confidence), 0
    ) / recentEmotions.length;

    return {
      currentEmotion,
      emotionalStability: stability,
      engagement,
      homeostasis: this.emotionalHomeostasis,
      resonance: this.emotionalResonance.current
    };
  }

  public stopEmotionDetection(): void {
    if (this.video?.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (this.canvas) {
      document.body.removeChild(this.canvas);
    }
    
    this.video = null;
    this.canvas = null;
    this.emotionHistory = [];
  }
} 