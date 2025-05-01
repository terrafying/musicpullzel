import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock AudioContext
const mockAudioContext = {
    createOscillator: jest.fn().mockReturnValue({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        type: 'sine',
        frequency: {
            setValueAtTime: jest.fn()
        }
    }),
    createGain: jest.fn().mockReturnValue({
        connect: jest.fn(),
        gain: {
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
        }
    }),
    createBiquadFilter: jest.fn().mockReturnValue({
        connect: jest.fn(),
        type: 'lowpass',
        frequency: {
            setValueAtTime: jest.fn()
        },
        Q: {
            setValueAtTime: jest.fn()
        }
    }),
    currentTime: 0,
    destination: {}
};
window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

// Mock speech synthesis
window.speechSynthesis = {
    speak: jest.fn()
} as any; 