import { Piece, GridState, GRID_SIZE } from '../types';

/**
 * Piece'in verilen koordinatta yerleştirilebilir mi kontrol eder.
 * canPlacePiece store fonksiyonuna gerek duymadan kullanılabilir.
 */
function canFit(grid: GridState, piece: Piece, ox: number, oy: number): boolean {
  for (let dy = 0; dy < piece.shape.length; dy++) {
    for (let dx = 0; dx < piece.shape[dy].length; dx++) {
      if (!piece.shape[dy][dx]) continue;
      const gx = ox + dx;
      const gy = oy + dy;
      if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return false;
      if (grid[gy]?.[gx]?.filled) return false;
    }
  }
  return true;
}

/**
 * Verilen ham koordinat yakınında en geçerli yerleştirme konumunu bulur.
 *
 * Strateji: merkezdeki konumdan başlayarak 1 hücre yarıçapında spiral arama yapar.
 * Geçerli bir konum bulunursa döner; bulunamazsa null döner.
 *
 * @param grid     - Mevcut oyun tahtası
 * @param piece    - Sürüklenen piece
 * @param rawX     - Ham X koordinatı (grid biriminde, merkezlenmiş)
 * @param rawY     - Ham Y koordinatı (grid biriminde, merkezlenmiş)
 * @param radius   - Arama yarıçapı (default: 1)
 * @returns Geçerli koordinat veya null
 */
export function findBestPlacement(
  grid: GridState,
  piece: Piece,
  rawX: number,
  rawY: number,
  radius = 1
): { x: number; y: number } | null {
  // Önce tam konumu dene
  if (canFit(grid, piece, rawX, rawY)) {
    return { x: rawX, y: rawY };
  }

  // Spiral arama — kareye göre önce köşeler sonra kenarlar
  const candidates: Array<{ x: number; y: number; dist: number }> = [];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue; // zaten yukarıda denendi
      const nx = rawX + dx;
      const ny = rawY + dy;
      if (canFit(grid, piece, nx, ny)) {
        candidates.push({ x: nx, y: ny, dist: dx * dx + dy * dy });
      }
    }
  }

  if (candidates.length === 0) return null;

  // En yakın geçerli konumu seç
  candidates.sort((a, b) => a.dist - b.dist);
  return { x: candidates[0].x, y: candidates[0].y };
}

/* ──────────────────────────────────────────────────────────── */
/* Velocity Tracking                                            */
/* ──────────────────────────────────────────────────────────── */

const VELOCITY_WINDOW_MS = 80; // Son 80ms'deki hareketi kullan

interface VelocitySample {
  x: number;
  y: number;
  t: number;
}

const samples: VelocitySample[] = [];

/**
 * Her pointermove olayında çağrılır; örnek kaydeder.
 */
export function recordPointerSample(x: number, y: number): void {
  const now = performance.now();
  samples.push({ x, y, t: now });

  // Pencere dışındaki eski örnekleri temizle
  const cutoff = now - VELOCITY_WINDOW_MS;
  while (samples.length > 0 && samples[0].t < cutoff) {
    samples.shift();
  }
}

/**
 * Son örneklere bakarak px/ms cinsinden hızı hesaplar.
 * Drag bırakılınca çağrılır.
 *
 * @returns Hız büyüklüğü px/ms
 */
export function getDragVelocity(): number {
  if (samples.length < 2) return 0;

  const first = samples[0];
  const last = samples[samples.length - 1];
  const dt = last.t - first.t;
  if (dt <= 0) return 0;

  const dx = last.x - first.x;
  const dy = last.y - first.y;
  return Math.sqrt(dx * dx + dy * dy) / dt;
}

/**
 * Örnek tamponunu sıfırla (drag başladığında çağır).
 */
export function resetVelocityTracking(): void {
  samples.length = 0;
}

/**
 * Hız eşiği: bu değerin üzerindeyse "hızlı swipe" sayılır.
 * px/ms cinsinden — 0.8 px/ms ≈ 800 px/s
 */
export const FAST_SWIPE_THRESHOLD = 0.8;

/* ──────────────────────────────────────────────────────────── */
/* Shared Hover Coord                                           */
/* Grid.tsx'in render loop'u bu değeri yazar,                  */
/* Piece.tsx'in handlePointerUp'ı buradan okur.                */
/* Bu sayede window.pointerup listener'a gerek kalmaz.         */
/* ──────────────────────────────────────────────────────────── */

let _sharedHoverCoord: { x: number; y: number } | null = null;
let _activeDragPointerId: number | null = null;
let _sharedPointerPosition: { x: number; y: number } | null = null;

export function setSharedHoverCoord(coord: { x: number; y: number } | null): void {
  _sharedHoverCoord = coord;
}

export function getSharedHoverCoord(): { x: number; y: number } | null {
  return _sharedHoverCoord;
}

export function setActiveDragPointerId(pointerId: number | null): void {
  _activeDragPointerId = pointerId;
}

export function getActiveDragPointerId(): number | null {
  return _activeDragPointerId;
}

export function setSharedPointerPosition(position: { x: number; y: number } | null): void {
  _sharedPointerPosition = position;
}

export function getSharedPointerPosition(): { x: number; y: number } | null {
  return _sharedPointerPosition;
}
