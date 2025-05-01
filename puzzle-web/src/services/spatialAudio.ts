import { Logger } from './logger';
import { SpatialPosition } from './audio/types';

export class SpatialAudioProcessor {
  private context: AudioContext;
  private listener: AudioListener;
  private currentPosition: SpatialPosition;
  private moveSpeed: number;
  private rotationSpeed: number;
  private logger: Logger;

  constructor(context: AudioContext) {
    this.context = context;
    this.listener = context.listener;
    this.currentPosition = { x: 0, y: 0, z: 0 };
    this.moveSpeed = 0.1;
    this.rotationSpeed = 0.05;
    this.logger = Logger.create('SpatialAudioProcessor');

    // Configure listener
    this.listener.setOrientation(0, 0, -1, 0, 1, 0);
    this.listener.setPosition(0, 0, 0);
  }

  public createPanner(): PannerNode {
    const panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    return panner;
  }

  public moveListener(direction: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down'): void {
    const { x, y, z } = this.currentPosition;
    const now = this.context.currentTime;
    
    switch (direction) {
      case 'forward':
        this.currentPosition.z = Math.min(1, z + this.moveSpeed);
        break;
      case 'backward':
        this.currentPosition.z = Math.max(-1, z - this.moveSpeed);
        break;
      case 'left':
        this.currentPosition.x = Math.max(-1, x - this.moveSpeed);
        break;
      case 'right':
        this.currentPosition.x = Math.min(1, x + this.moveSpeed);
        break;
      case 'up':
        this.currentPosition.y = Math.min(1, y + this.moveSpeed);
        break;
      case 'down':
        this.currentPosition.y = Math.max(-1, y - this.moveSpeed);
        break;
    }

    // Update listener position with smooth transition
    this.listener.setPosition(
      this.currentPosition.x,
      this.currentPosition.y,
      this.currentPosition.z
    );
  }

  public rotateListener(direction: 'left' | 'right'): void {
    const rotation = direction === 'left' ? -this.rotationSpeed : this.rotationSpeed;
    const { x, y, z } = this.currentPosition;
    
    // Calculate new orientation based on current position
    const angle = Math.atan2(x, z) + rotation;
    const newX = Math.sin(angle);
    const newZ = Math.cos(angle);
    
    // Update listener orientation
    this.listener.setOrientation(newX, 0, newZ, 0, 1, 0);
  }

  public updatePannerPosition(panner: PannerNode, position: SpatialPosition): void {
    if (!panner) return;
    
    // Scale position for better spatial effect
    const scale = 10;
    panner.setPosition(
      position.x * scale,
      position.y * scale,
      position.z * scale
    );
  }

  public getCurrentPosition(): SpatialPosition {
    return { ...this.currentPosition };
  }
} 