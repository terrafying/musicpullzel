import { Logger } from './logger';

export interface TestCase {
  id: string;
  name: string;
  status: 'passing' | 'pending' | 'failed';
  timestamp: number;
}

export class TestService {
  private testCases: Map<string, TestCase> = new Map();
  private logger = Logger.create('TestService');
  private listeners: Set<(testCases: TestCase[]) => void> = new Set();

  constructor() {
    // Initialize with some example test cases
    this.addTestCase({
      id: 'pattern-generation',
      name: 'Pattern Generation',
      status: 'passing',
      timestamp: Date.now()
    });

    this.addTestCase({
      id: 'emotion-detection',
      name: 'Emotion Detection',
      status: 'passing',
      timestamp: Date.now()
    });

    this.addTestCase({
      id: 'audio-synthesis',
      name: 'Audio Synthesis',
      status: 'passing',
      timestamp: Date.now()
    });
  }

  addTestCase(testCase: TestCase): void {
    this.testCases.set(testCase.id, testCase);
    this.notifyListeners();
    this.logger.info('TestService', `Added test case: ${testCase.name}`);
  }

  updateTestCase(id: string, status: 'passing' | 'pending' | 'failed'): void {
    const testCase = this.testCases.get(id);
    if (testCase) {
      testCase.status = status;
      testCase.timestamp = Date.now();
      this.notifyListeners();
      this.logger.info('TestService', `Updated test case: ${testCase.name} to ${status}`);
    }
  }

  getTestCases(): TestCase[] {
    return Array.from(this.testCases.values());
  }

  addListener(listener: (testCases: TestCase[]) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (testCases: TestCase[]) => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const testCases = this.getTestCases();
    this.listeners.forEach(listener => listener(testCases));
  }

  // Simulate test case updates
  simulateTestUpdates(): void {
    const testCases = this.getTestCases();
    testCases.forEach(testCase => {
      // Randomly update test status
      const statuses: ('passing' | 'pending' | 'failed')[] = ['passing', 'pending', 'failed'];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      this.updateTestCase(testCase.id, newStatus);
    });
  }
} 