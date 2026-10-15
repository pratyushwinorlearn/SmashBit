# Physics & Gameplay Mechanics

## 1. Shuttlecock Aerodynamic Drag
Updated at fixed `dt = 1 / 60` seconds:
- `a = g - k_drag * |v| * v`
- High initial velocity decays rapidly due to feather skirt drag (`k_drag = 0.085`), causing deep clears to decelerate at the peak and drop almost vertically near the back boundary line.
- **Net Tape Dribble:** Contact with the top tape (`y` between 1.42m and 1.56m, `|z| < 0.12m`) dampens horizontal speed by 82% and pops the shuttle upward.

## 2. Controls & Emergent Shot Matrix
- **Move:** `W A S D` or `Arrow Keys`
- **Jump (for Overhead Smash):** `Spacebar`
- **Power Strike (Smash / Clear / Drive / Lift):** `J` or `Left Click`
- **Finesse Strike (Drop Shot / Hairpin Net Shot):** `K` or `Right Click`

| Contact Height (y) | Input Combination | Shot Produced | Flight Profile |
| :--- | :--- | :--- | :--- |
| > 2.05m (Airborne) | Power (`J`) | **Jump Smash** | Steep downward rocket (-19 deg), triggers crowd gasp |
| > 1.65m | Power (`J`) + Hold Back | **Attacking Clear** | High deep trajectory to opponent baseline |
| > 1.65m | Power (`J`) | **Fast Drive / Half-Smash** | Flat, aggressive mid-court punch |
| > 1.65m | Finesse (`K`) | **Overhead Drop** | Deceptive slow arc landing just past net |
| <= 1.65m | Power (`J`) | **Defensive High Lift** | High recovery arc to deep backcourt |
| <= 1.65m | Finesse (`K`) | **Hairpin Net Shot** | Tight tumbling shot barely clearing the tape |
