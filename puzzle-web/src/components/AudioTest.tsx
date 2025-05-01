import { useState, useCallback } from 'react';

export function AudioTest() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const playTestTone = useCallback(() => {
    if (!audioContext) {
      const context = new AudioContext();
      setAudioContext(context);
    }

    const oscillator = audioContext?.createOscillator();
    const gainNode = audioContext?.createGain();

    if (oscillator && gainNode) {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext!.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, audioContext!.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext!.destination);

      oscillator.start();
      oscillator.stop(audioContext!.currentTime + 0.5);
    }
  }, [audioContext]);

  return (
    <div className="audio-test">
      <button onClick={playTestTone}>
        Play Test Tone (A4)
      </button>
    </div>
  );
} 