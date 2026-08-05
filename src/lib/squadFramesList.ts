export const SQUAD_FRAMES_LIST: string[] = Array.from(
  { length: 240 },
  (_, i) => `/squad-frames/frame_${String(i + 1).padStart(3, '0')}.webp`
);
