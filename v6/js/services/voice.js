/**
 * Voice Service
 * Handles speech recognition using the Web Speech API.
 */
export class VoiceService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onResult = null;
        this.onError = null;
        this.onEnd = null;
        // Do NOT init here. Wait for user interaction.
    }

    initialize() {
        if (this.recognition) return; // Already initialized

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                console.log("Voice started");
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.onEnd) this.onEnd();
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.stop(); // Auto-stop after getting result
                if (this.onResult) this.onResult(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                let msg = "Voice Error: " + event.error;

                if (event.error === 'not-allowed') {
                    msg = "Microphone access denied. 🚫\nPlease allow microphone access in your browser settings.";
                } else if (event.error === 'audio-capture') {
                    msg = "No microphone found or audio capture failed. 🎤\nPlease check your system sound settings.";
                } else if (event.error === 'no-speech') {
                    return; // Ignore no-speech errors (just silence)
                }

                alert(msg);
                this.stop(); // Ensure we stop on error
                if (this.onError) this.onError(event.error);
            };
        } else {
            console.warn("Web Speech API not supported in this browser.");
        }
    }

    async requestMicAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Close stream immediately
            return true;
        } catch (error) {
            console.error("Microphone access error:", error);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                alert("Microphone permission denied. 🚫\nPlease go to your browser settings and allow microphone access for this site.");
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                alert("No microphone found. 🎤\nPlease check your system sound settings.");
            } else {
                alert("Microphone Error: " + error.message);
            }
            return false;
        }
    }

    async start() {
        this.initialize(); // Lazy init

        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (e) {
                console.error("Failed to start recognition:", e);
                this.stop(); // Ensure cleanup on fail
            }
        }
    }

    stop() {
        if (this.recognition) {
            try {
                this.recognition.stop();
                this.recognition.abort(); // Force stop
            } catch (e) {
                console.warn("Error stopping recognition:", e);
            }
            this.isListening = false;
        }
    }

    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
}
