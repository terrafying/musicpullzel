import { EmergentPattern } from './types';

export interface SharedState {
  patterns: EmergentPattern[];
  transformations: Array<{
    patternId: string;
    type: 'move' | 'scale' | 'rotate' | 'merge' | 'split';
    params: any;
    timestamp: number;
  }>;
  users: Map<string, {
    position: { x: number; y: number };
    selectedPattern: string | null;
    lastActive: number;
  }>;
}

export class SharedStateService {
  private ws: WebSocket | null = null;
  private state: SharedState = {
    patterns: [],
    transformations: [],
    users: new Map()
  };
  private userId: string;
  private onStateUpdate: ((state: SharedState) => void) | null = null;

  constructor() {
    this.userId = Math.random().toString(36).substring(7);
  }

  public connect(url: string, onStateUpdate: (state: SharedState) => void) {
    this.onStateUpdate = onStateUpdate;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(url, onStateUpdate), 1000);
    };
  }

  public updateUserPosition(position: { x: number; y: number }) {
    this.broadcast({
      type: 'userPosition',
      userId: this.userId,
      position
    });
  }

  public updateSelectedPattern(patternId: string | null) {
    this.broadcast({
      type: 'selectPattern',
      userId: this.userId,
      patternId
    });
  }

  public transformPattern(patternId: string, type: SharedState['transformations'][0]['type'], params: any) {
    const transformation = {
      patternId,
      type,
      params,
      timestamp: Date.now()
    };

    this.broadcast({
      type: 'transformPattern',
      transformation
    });
  }

  private broadcast(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'stateUpdate':
        this.state = message.state;
        this.onStateUpdate?.(this.state);
        break;

      case 'userPosition':
        this.state.users.set(message.userId, {
          ...this.state.users.get(message.userId),
          position: message.position,
          lastActive: Date.now()
        });
        this.onStateUpdate?.(this.state);
        break;

      case 'selectPattern':
        this.state.users.set(message.userId, {
          ...this.state.users.get(message.userId),
          selectedPattern: message.patternId,
          lastActive: Date.now()
        });
        this.onStateUpdate?.(this.state);
        break;

      case 'transformPattern':
        this.state.transformations.push(message.transformation);
        this.onStateUpdate?.(this.state);
        break;
    }
  }

  public getState(): SharedState {
    return this.state;
  }

  public getUserId(): string {
    return this.userId;
  }
} 