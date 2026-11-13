/** A stand-in for the browser's audio engine: it keeps what would be heard, as short lines. */
export function fakeAudioContext() {
  /** Synthesizer notes: `from>to wave at start`. */
  const notes: string[] = [];
  /** Files played: `file volume`. */
  const files: string[] = [];
  /** Volume changes asked of the gains, in order. */
  const fades: number[] = [];
  const playing: { onended: (() => void) | null }[] = [];
  const param = () => {
    const self = {
      value: 1,
      target: 0,
      setValueAtTime(value: number) {
        self.value = value;
      },
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime(value: number) {
        self.target = value;
      },
      setTargetAtTime(value: number) {
        fades.push(value);
      },
    };
    return self;
  };
  const gain = () => ({ gain: param(), connect() {}, disconnect() {} });
  const clock = {
    currentTime: 0,
    state: 'running',
    destination: {},
    createGain: gain,
    createMediaElementSource: () => ({ connect() {} }),
    decodeAudioData: async (data: unknown) => data,
    createOscillator() {
      const frequency = param();
      const oscillator = {
        type: 'sine',
        frequency,
        onended: null,
        connect() {},
        disconnect() {},
        stop() {},
        start(at: number) {
          const start = Math.round(at * 1000) / 1000;
          notes.push(`${frequency.value}>${frequency.target} ${oscillator.type} at ${start}`);
          playing.push(oscillator);
        },
      };
      return oscillator;
    },
    createBufferSource() {
      let output = gain();
      const source = {
        buffer: '',
        onended: null,
        disconnect() {},
        connect(node: ReturnType<typeof gain>) {
          output = node;
        },
        start() {
          files.push(`${source.buffer} ${output.gain.value}`);
          playing.push(source);
        },
      };
      return source;
    },
  };
  return {
    context: clock as unknown as AudioContext,
    clock,
    notes,
    files,
    fades,
    /** Every sound in progress reaches its end. */
    finishAll() {
      for (const voice of playing.splice(0)) voice.onended?.();
    },
  };
}

/** Lets the pending promises of the code under test run. */
export const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
