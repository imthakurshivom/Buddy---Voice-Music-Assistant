/**
 * Audio Context helper - completely deactivating synthetic instrumental sounds
 * so only 100% authentic original songs play.
 */

let audioCtx: AudioContext | null = null;

export function getMusicAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Disabled to ensure only original songs are played via YouTube/audio stream.
 */
export function playSynthMusic(_trackId: string, _volumeLevel = 80) {
  // Intentionally no-op: user requested original song vocals, not instrumental beeps
}

export function stopSynthMusic() {
  // No-op
}

export function setSynthVolume(_vol: number) {
  // No-op
}

export function isSynthPlaying(): boolean {
  return false;
}

export function getActiveTrackId(): string | null {
  return null;
}
