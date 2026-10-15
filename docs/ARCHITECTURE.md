# System & Network Architecture

## 1. Visual Pipeline (HD-2D Pixel Shader)
- **World Space:** Regulation BWF Singles Court (13.4m length x 5.18m singles width, net height 1.55m).
- **Aesthetic:** Pitch-black arena void (#050508) with dramatic overhead stadium spotlighting, rendered through Three.js `RenderPixelatedPass` (pixelSize = 4).
- **Depth Readability:** High-contrast floor shadow and dynamic landing ring directly beneath the shuttlecock (`y = 0.02m`) so players can judge deep clears vs. tight drops effortlessly.

## 2. Deterministic Projectile Netcode
Streaming shuttle coordinates at 60Hz over WebSockets causes rubber-banding because shuttlecocks exceed 70 m/s off the racket. Instead, we synchronize **events**:
1. **Player Movement (`PLAYER_STATE`, 25Hz):** Streams `{ x, y, z, vx, vz, anim, facing }` with client-side linear interpolation.
2. **Shuttle Hit (`SHUTTLE_HIT`, Event-Driven):** Emits `{ pos, vel, drag, spin, timestamp, shotType }`. Both clients run the exact same 60Hz deterministic drag integrator locally.
3. **Authoritative Referee (`MatchReferee.ts`):** Tracks BWF 21-point scoring, 2-point deuce advantage (cap at 30), and odd/even service box switching.
