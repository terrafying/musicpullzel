import { EnglishFeedback } from '../types/strokeOrder';
import { TelemetryService } from '../../../services/telemetry';

export class EnglishStrokeMappings {
    private mappings: Map<string, EnglishFeedback>;
    private telemetry: TelemetryService;

    constructor() {
        this.telemetry = TelemetryService.getInstance();
        this.mappings = new Map([
            ['horizontal', {
                visual: 'Draw a smooth line from left to right',
                audio: 'Smooth horizontal line',
                haptic: [50, 100, 50]
            }],
            ['vertical', {
                visual: 'Draw a strong line from top to bottom',
                audio: 'Strong vertical stroke',
                haptic: [100, 50, 100]
            }],
            ['dot', {
                visual: 'Make a quick dot',
                audio: 'Quick dot',
                haptic: [30]
            }],
            ['hook', {
                visual: 'Draw a curved hook',
                audio: 'Curved hook',
                haptic: [50, 30, 50, 30, 50]
            }],
            ['slant', {
                visual: 'Draw a diagonal line',
                audio: 'Diagonal slant',
                haptic: [70, 50, 70]
            }]
        ]);
    }

    getFeedback(strokeType: string): EnglishFeedback {
        const feedback = this.mappings.get(strokeType) || this.mappings.get('horizontal')!;
        this.telemetry.debug('Retrieved English feedback', { strokeType, feedback });
        return feedback;
    }

    addFeedback(strokeType: string, feedback: EnglishFeedback): void {
        this.mappings.set(strokeType, feedback);
        this.telemetry.debug('Added English feedback', { strokeType, feedback });
    }

    removeFeedback(strokeType: string): void {
        this.mappings.delete(strokeType);
        this.telemetry.debug('Removed English feedback', { strokeType });
    }

    getAllFeedback(): Map<string, EnglishFeedback> {
        return new Map(this.mappings);
    }

    speakHint(hint: string): void {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(hint);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
            this.telemetry.debug('Spoke English hint', { hint });
        }
    }

    showHint(hint: string): void {
        const hintElement = document.createElement('div');
        hintElement.className = 'stroke-hint';
        hintElement.textContent = hint;
        document.body.appendChild(hintElement);
        
        setTimeout(() => {
            hintElement.remove();
        }, 2000);
        
        this.telemetry.debug('Showed English hint', { hint });
    }
} 