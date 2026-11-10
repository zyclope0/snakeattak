/** Explicit playback uses an already installed French voice; no remote voice. */
export function capriceSpeech() {
  const synth = globalThis.speechSynthesis;
  const voice = () => synth?.getVoices().find((v) => v.localService && /^fr(?:-|$)/i.test(v.lang));
  return {
    available: () => !!voice(),
    cancel: () => synth?.cancel(),
    speak(text: string) {
      const v = voice();
      if (!v) return;
      synth.cancel();
      const line = new SpeechSynthesisUtterance(text);
      line.voice = v;
      line.lang = v.lang;
      synth.speak(line);
    },
  };
}
