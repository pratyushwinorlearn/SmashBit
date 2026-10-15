import * as THREE from 'three';

/**
 * Creates a true BWF Tournament TV lighting rig:
 * - The green court mat is brightly lit by an overhead spotlight cone.
 * - Everything outside the court (pink floor, bleachers, crowd, back walls)
 *   is dimly lit so players can track the shuttlecock in complete visual comfort.
 */
export class StadiumLighting {
  public static setup(scene: THREE.Scene): void {
    // 1. Low, moody ambient light for the outer stadium bowl & bleachers (~35% brightness)
    const dimAmbient = new THREE.AmbientLight(0x94a3b8, 0.42);
    scene.add(dimAmbient);

    // 2. Soft cool rim light from the upper rafters
    const rafterFill = new THREE.DirectionalLight(0x64748b, 0.28);
    rafterFill.position.set(0, 18, -12);
    scene.add(rafterFill);

    // 3. Focused High-Intensity Overhead Court Spotlight (Illuminates only the green mat!)
    const courtSpot = new THREE.SpotLight(0xfffbeb, 65);
    courtSpot.position.set(0, 16.5, 0);
    courtSpot.target.position.set(0, 0, 0);
    courtSpot.angle = Math.PI / 4.2; // Tight cone around the green court
    courtSpot.penumbra = 0.65; // Smooth falloff into the dimmed pink periphery
    courtSpot.decay = 1.35;
    courtSpot.distance = 32;
    scene.add(courtSpot);
    scene.add(courtSpot.target);
  }
}