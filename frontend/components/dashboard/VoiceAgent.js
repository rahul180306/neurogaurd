"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchApiJson } from "@/lib/api";

export default function VoiceAgent() {
    const [isListening, setIsListening] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("Microphone muted. Click to enable Neuro.");

    const recognitionRef = useRef(null);
    const isActiveRef = useRef(false);
    const router = useRouter();

    const speakText = (text) => {
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        const speech = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();
        // Prioritize premium Indian English natively built into the browser
        const preferredVoice = voices.find(v =>
            v.name.includes("Google UK English Female") ||
            v.name.includes("Google हिन्दी") || // Often includes an English variant
            v.lang === 'en-IN' || // Universal code for Indian English
            v.name.includes("Veena") || // macOS premium Indian voice
            v.name.includes("Rishi") || // macOS premium Indian voice
            v.name.includes("Aditi") || // Common AWS-like Indian voice via browser
            v.lang === 'en-GB'
        );
        if (preferredVoice) speech.voice = preferredVoice;

        speech.rate = 1.05;
        speech.pitch = 0.9;

        speech.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(speech);
    };

    const playPollyAudio = (base64Audio) => {
        setIsSpeaking(true);
        try {
            const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
            const audio = new Audio(audioSrc);

            audio.onended = () => setIsSpeaking(false);
            audio.onerror = (e) => {
                console.error("Polly Audio playback failed", e);
                setIsSpeaking(false);
            };

            audio.play().catch(e => {
                console.error("Browser blocked Polly Audio autoplay", e);
                setIsSpeaking(false);
            });
        } catch (e) {
            console.error("Failed to decode Polly Audio", e);
            setIsSpeaking(false);
        }
    };

    useEffect(() => {
        // Initialize Speech Recognition
        if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setTranscript("Neuro is active. Say 'Neuro, <command>'");
            };

            recognitionRef.current.onresult = async (event) => {
                const current = event.resultIndex;
                const commandText = event.results[current][0].transcript.trim();
                const lowerCmd = commandText.toLowerCase();

                // Always show what the mic is hearing so the user knows it's working
                setTranscript(`Heard: "${commandText}"`);

                // Process any spoken command, as Web Speech API sometimes cuts off the first word
                window.speechSynthesis.cancel();
                setIsSpeaking(false);

                // Check for wake word "Neuro" (and common mic misspellings)
                const hasWakeWord = lowerCmd.includes("neuro") || lowerCmd.includes("nero") || lowerCmd.includes("nuero");

                if (!hasWakeWord) {
                    // Ignore background conversation if wake word isn't spoken
                    return;
                }

                // Strip the wake word so we just pass the raw command to the backend
                let cleanCommand = lowerCmd;
                if (lowerCmd.includes("neuro")) {
                    cleanCommand = lowerCmd.substring(lowerCmd.indexOf("neuro") + 5);
                } else if (lowerCmd.includes("nero")) {
                    cleanCommand = lowerCmd.substring(lowerCmd.indexOf("nero") + 4);
                } else if (lowerCmd.includes("nuero")) {
                    cleanCommand = lowerCmd.substring(lowerCmd.indexOf("nuero") + 5);
                }

                cleanCommand = cleanCommand.replace(/^[,\.\!\?\s]*/, "").trim();

                if (cleanCommand.length === 0) {
                    setTranscript("Neuro is awake and listening...");
                    return; // Wake up but no command given
                }

                setTranscript(`Processing: "${cleanCommand}"`);

                // Frontend Local Commands
                if (cleanCommand.includes("go to") || cleanCommand.includes("navigate") || cleanCommand.includes("open") || cleanCommand.includes("take me")) {
                    let target = null;
                    let targetName = "";

                    if (cleanCommand.includes("home")) { target = "/"; targetName = "home page"; }
                    else if (cleanCommand.includes("dashboard")) { target = "/dashboard"; targetName = "dashboard"; }
                    else if (cleanCommand.includes("network")) { target = "/network"; targetName = "network portal"; }
                    else if (cleanCommand.includes("device")) { target = "/devices"; targetName = "devices overview"; }
                    else if (cleanCommand.includes("threat")) { target = "/threats"; targetName = "threats radar"; }
                    else if (cleanCommand.includes("investigation")) { target = "/investigations"; targetName = "investigation suite"; }
                    else if (cleanCommand.includes("report")) { target = "/reports"; targetName = "reports center"; }

                    if (target) {
                        speakText(`Navigating to ${targetName}.`);
                        router.push(target);
                        return; // Stop here, no backend needed
                    }
                }

                // Send unknown commands to FastAPI Backend
                setIsThinking(true);
                try {
                    const data = await fetchApiJson("/api/agent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ command: cleanCommand })
                    });
                    setIsThinking(false);

                    // Speak the AI's explanation natively or via Amazon Polly
                    if (data.audio_base64) {
                        playPollyAudio(data.audio_base64);
                    } else if (data.message) {
                        speakText(data.message);
                    }

                    // Execute autonomous actions sent by the AI
                    if (data.actions && Array.isArray(data.actions)) {
                        for (const action of data.actions) {
                            if (action.type === "navigate" && action.page) {
                                // Wait a tiny bit so the speech starts before jumping pages
                                setTimeout(() => {
                                    router.push(action.page);
                                }, 1000);
                            }
                        }
                    }

                } catch (err) {
                    console.error("AI Agent Backend Error", err);
                    setTranscript("Connection to AI Core failed.");
                    setIsThinking(false);
                }
            };

            recognitionRef.current.onerror = (event) => {
                if (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted') return; // Ignore transient errors

                console.error("Speech Recognition Error", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    setTranscript("Mic access blocked. Please allow permissions.");
                    isActiveRef.current = false;
                    setIsActive(false);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                // Auto restart if still in active mode
                if (isActiveRef.current) {
                    try { recognitionRef.current?.start(); } catch (e) { }
                }
            };

            // Auto-start listening automatically on mount if browser permissions allow it
            setTimeout(() => {
                if (!isActiveRef.current) {
                    try {
                        isActiveRef.current = true;
                        setIsActive(true);
                        recognitionRef.current.start();
                    } catch (e) {
                        isActiveRef.current = false;
                        setIsActive(false);
                    }
                }
            }, 1000);
        }
    }, [router]);

    const toggleListening = () => {
        if (isActiveRef.current) {
            // Turn off persistent listening
            isActiveRef.current = false;
            setIsActive(false);
            recognitionRef.current?.stop();
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setTranscript("Microphone muted. Click to allow Neuro to listen.");
        } else {
            // Wake up persistent listening
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            isActiveRef.current = true;
            setIsActive(true);
            try { recognitionRef.current?.start(); } catch (e) { }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-[99]"
        >
            <div className="relative flex items-center justify-end">
                {/* Expandable Transcript Box (Only shows when active/speaking) */}
                <motion.div
                    initial={{ opacity: 0, width: 0, scale: 0.9 }}
                    animate={{
                        opacity: transcript !== "Microphone muted. Click to allow Neuro to listen." ? 1 : 0,
                        width: transcript !== "Microphone muted. Click to allow Neuro to listen." ? 'auto' : 0,
                        scale: transcript !== "Microphone muted. Click to allow Neuro to listen." ? 1 : 0.9,
                        x: transcript !== "Microphone muted. Click to allow Neuro to listen." ? -16 : 0 // push to the left of the orb
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute right-[80px] origin-right mr-4 overflow-hidden pointer-events-none whitespace-nowrap"
                >
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl flex flex-col items-end min-w-[200px] max-w-[300px]">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">Neuro AI</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-purple-400 animate-pulse' : isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
                        </div>
                        <p className="text-sm font-medium text-white/90 truncate w-full text-right" title={transcript}>
                            {transcript}
                        </p>
                    </div>
                </motion.div>

                {/* The Floating Orb Component */}
                <button
                    onClick={toggleListening}
                    className="relative group outline-none"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                >
                    <motion.div
                        className="w-[90px] h-[90px] flex items-center justify-center relative transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                            filter: isActive ? (isSpeaking ? "drop-shadow(0 0 25px rgba(52, 211, 153, 0.8))" : isListening ? "drop-shadow(0 0 25px rgba(167, 139, 250, 0.6))" : "drop-shadow(0 0 15px rgba(255,255,255,0.4))") : "drop-shadow(0 0 10px rgba(0,0,0,0.5))"
                        }}
                    >
                        {/* Wavy rotating ring 1 (Purple / Blue) */}
                        <motion.div
                            className={`absolute inset-0 rounded-[40%_60%_70%_30%] border-[3px] border-[#7c3aed]/80 blur-[2px] transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        />
                        {/* Wavy rotating ring 2 (Pink) */}
                        <motion.div
                            className={`absolute inset-[-4px] rounded-[60%_40%_30%_70%] border-[3px] border-[#f472b6]/70 blur-[3px] transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                        />
                        {/* Wavy rotating ring 3 (Light Blue) */}
                        <motion.div
                            className={`absolute inset-[2px] rounded-[50%_50%_40%_60%] border-[4px] border-[#7dd3fc]/80 blur-[1px] transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        />

                        {/* Core Glass Sphere */}
                        <div
                            className={`absolute inset-2 rounded-full border transition-all duration-1000 overflow-hidden ${isActive ? 'border-white/40 opacity-100' : 'border-white/10 opacity-60 grayscale'}`}
                            style={{
                                background: "radial-gradient(circle at 35% 35%, #e0f2fe 0%, #a5b4fc 40%, #818cf8 80%, #4f46e5 100%)",
                                boxShadow: "inset -10px -10px 20px rgba(0,0,0,0.1), inset 10px 10px 20px rgba(255,255,255,0.9)"
                            }}>
                            {/* Glossy reflection highlight to make it look 3D */}
                            <div className="absolute top-[8%] left-[15%] w-[45%] h-[35%] bg-white/70 rounded-full blur-[2px] rotate-[-40deg]" style={{ boxShadow: "0 0 10px white" }} />
                        </div>

                        {/* Overlaid Interaction Glow (Reacts to Voice State) */}
                        <motion.div
                            className="absolute inset-2 rounded-full mix-blend-overlay"
                            animate={{
                                backgroundColor: isListening && !isThinking ? 'rgba(45, 212, 191, 0.4)' : // Teal
                                    isThinking ? 'rgba(192, 132, 252, 0.6)' : // Purple
                                        isSpeaking ? 'rgba(52, 211, 153, 0.6)' : 'rgba(255, 255, 255, 0)', // Green
                            }}
                            transition={isActive ? { repeat: Infinity, duration: 1.2, repeatType: "reverse" } : {}}
                        />

                        {/* Microphone Icon (Hidden when listening so the orb looks pure, appears on hover or when muted) */}
                        <div className={`absolute inset-2 z-10 transition-opacity duration-500 rounded-full flex items-center justify-center overflow-hidden ${isActive ? 'opacity-0 group-hover:opacity-100 hover:bg-black/20' : 'opacity-100 bg-black/40'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white drop-shadow-lg">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                        </div>
                    </motion.div>
                </button>
            </div>
        </motion.div>
    );
}
