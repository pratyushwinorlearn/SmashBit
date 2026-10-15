import * as THREE from 'three';
import { GbaSpriteFactory } from '../graphics/GbaSpriteFactory.js';

export const COURT = {
  LENGTH: 13.4,
  HALF_LENGTH: 6.7,
  SINGLES_WIDTH: 5.18,
  HALF_WIDTH: 2.59,
  DOUBLES_WIDTH: 6.1,
  NET_HEIGHT: 1.55,
  SHORT_SERVICE_LINE: 1.98
} as const;

export class CourtBounds {
  public group = new THREE.Group();
  private scoreboardMat!: THREE.MeshBasicMaterial;

  constructor() {
    this.buildCourtMesh();
    this.buildArenaWallsAndSponsors();
    this.buildUmpireHighChairAndPc();
    this.buildServiceJudgeAndLineJudges();
    this.buildCourtsideCrewAndProps();
  }

  public updateCourtsideScoreboard(
    p0: number,
    p1: number,
    p0Name = 'P1',
    p1Name = 'BOT'
  ): void {
    if (this.scoreboardMat) {
      this.scoreboardMat.map = GbaSpriteFactory.createScoreboardTexture(p0, p1, p0Name, p1Name);
      this.scoreboardMat.needsUpdate = true;
    }
  }

  private buildCourtMesh(): void {
    // 1. Outer Pink/Magenta Arena Floor uses MeshLambertMaterial so it is dimly lit outside the court spotlight!
    const arenaGeo = new THREE.PlaneGeometry(56, 44);
    const arenaMat = new THREE.MeshLambertMaterial({ color: 0xc81e68 });
    const arenaFloor = new THREE.Mesh(arenaGeo, arenaMat);
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.position.y = -0.02;
    this.group.add(arenaFloor);

    // 2. Soft Dark Vignette Apron around the green court mat for extra contrast
    const glowApron = new THREE.Mesh(
      new THREE.PlaneGeometry(COURT.DOUBLES_WIDTH + 2.4, COURT.LENGTH + 2.8),
      new THREE.MeshBasicMaterial({ color: 0x090d16, transparent: true, opacity: 0.35 })
    );
    glowApron.rotation.x = -Math.PI / 2;
    glowApron.position.y = -0.005;
    this.group.add(glowApron);

    // 3. BWF Tournament Green Mat (Full Bright Basic Material under the spotlight!)
    const matTex = GbaSpriteFactory.createTournamentCourtMatTexture();
    const matGeo = new THREE.PlaneGeometry(COURT.DOUBLES_WIDTH + 1.5, COURT.LENGTH + 1.9);
    const matMaterial = new THREE.MeshBasicMaterial({ map: matTex });
    const courtMat = new THREE.Mesh(matGeo, matMaterial);
    courtMat.rotation.x = -Math.PI / 2;
    courtMat.position.y = 0.001;
    this.group.add(courtMat);

    // 4. Crisp White Regulation Court Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const addLine = (w: number, l: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.006, z);
      this.group.add(m);
    };

    const lw = 0.055;
    addLine(lw, COURT.LENGTH, -COURT.HALF_WIDTH, 0);
    addLine(lw, COURT.LENGTH, COURT.HALF_WIDTH, 0);
    addLine(lw, COURT.LENGTH, -COURT.DOUBLES_WIDTH / 2, 0);
    addLine(lw, COURT.LENGTH, COURT.DOUBLES_WIDTH / 2, 0);

    addLine(COURT.DOUBLES_WIDTH, lw, 0, -COURT.HALF_LENGTH);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, COURT.HALF_LENGTH);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, -COURT.SHORT_SERVICE_LINE);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, COURT.SHORT_SERVICE_LINE);

    addLine(COURT.DOUBLES_WIDTH, lw, 0, -(COURT.HALF_LENGTH - 0.76));
    addLine(COURT.DOUBLES_WIDTH, lw, 0, COURT.HALF_LENGTH - 0.76);

    const centerLen = COURT.HALF_LENGTH - COURT.SHORT_SERVICE_LINE;
    addLine(lw, centerLen, 0, -(COURT.SHORT_SERVICE_LINE + centerLen / 2));
    addLine(lw, centerLen, 0, COURT.SHORT_SERVICE_LINE + centerLen / 2);

    // 5. Orange Net Posts + Orange YONEX Base Weights
    const postGeo = new THREE.BoxGeometry(0.08, COURT.NET_HEIGHT, 0.08);
    const orangeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const darkBorderMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

    [-COURT.DOUBLES_WIDTH / 2, COURT.DOUBLES_WIDTH / 2].forEach((x) => {
      const dir = Math.sign(x);
      const post = new THREE.Mesh(postGeo, orangeMat);
      post.position.set(x, COURT.NET_HEIGHT / 2, 0);
      this.group.add(post);

      const baseWeight = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.32), orangeMat);
      baseWeight.position.set(x + dir * 0.32, 0.12, 0);
      this.group.add(baseWeight);

      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.67, 0.04, 0.34), darkBorderMat);
      baseTrim.position.set(x + dir * 0.32, 0.02, 0);
      this.group.add(baseTrim);
    });

    // 6. Crisp GBA Pixel Net
    const netTex = GbaSpriteFactory.createPixelNetTexture();
    const netGeo = new THREE.PlaneGeometry(COURT.DOUBLES_WIDTH, 0.78);
    const netMat = new THREE.MeshBasicMaterial({
      map: netTex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(0, COURT.NET_HEIGHT - 0.39, 0);
    this.group.add(netMesh);
  }

  private buildArenaWallsAndSponsors(): void {
    // Dimmed Lambert walls so they don't glow distractedly
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xb81b5e });
    const wallTrimMat = new THREE.MeshLambertMaterial({ color: 0xdb2777 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 2.2, 0.3), wallMat);
    backWall.position.set(0, 1.1, -9.8);
    this.group.add(backWall);

    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(36, 0.08, 0.34), wallTrimMat);
    topTrim.position.set(0, 2.2, -9.8);
    this.group.add(topTrim);

    [-12.6, 12.6].forEach((x) => {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 24), wallMat);
      sideWall.position.set(x, 1.1, -1.0);
      this.group.add(sideWall);
    });

    const makeToblerone = (text: string, x: number, z: number, rotY = 0) => {
      const bannerTex = GbaSpriteFactory.createSponsorBannerTexture(text);
      const group = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.62, 0.45),
        new THREE.MeshLambertMaterial({ color: 0xeab308 })
      );
      body.position.y = 0.31;

      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(2.45, 0.58),
        new THREE.MeshBasicMaterial({ map: bannerTex, color: 0xd4d4d8 })
      );
      face.position.set(0, 0.31, 0.23);

      group.add(body, face);
      group.position.set(x, 0, z);
      group.rotation.y = rotY;
      this.group.add(group);
    };

    makeToblerone('LONGINES', -2.1, -8.3, 0);
    makeToblerone('e.on  YONEX', 2.1, -8.3, 0);
    makeToblerone('SMASH 2026', -6.8, -3.5, Math.PI / 2.3);
    makeToblerone('YONEX', -6.8, 2.8, Math.PI / 2.3);
    makeToblerone('SMASH 2026', 6.8, -3.5, -Math.PI / 2.3);
    makeToblerone('LONGINES', 6.8, 2.8, -Math.PI / 2.3);

    this.scoreboardMat = new THREE.MeshBasicMaterial({
      map: GbaSpriteFactory.createScoreboardTexture(0, 0)
    });
    const boardStand = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.92, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x09090b })
    );
    boardStand.position.set(4.8, 0.48, -7.8);
    boardStand.rotation.y = -0.22;

    const boardScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 0.84), this.scoreboardMat);
    boardScreen.position.set(0, 0, 0.1);
    boardStand.add(boardScreen);
    this.group.add(boardStand);
  }

  private buildUmpireHighChairAndPc(): void {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(4.45, 0, 0);

    const blackMetal = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const seatMat = new THREE.MeshBasicMaterial({ color: 0x27272a });

    [
      [-0.35, -0.35],
      [0.35, -0.35],
      [-0.35, 0.35],
      [0.35, 0.35]
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.85, 0.07), blackMetal);
      leg.position.set(lx, 0.92, lz);
      chairGroup.add(leg);
    });

    for (let s = 1; s <= 4; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.72), blackMetal);
      step.position.set(-0.35, s * 0.36, 0);
      chairGroup.add(step);
    }

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.75), seatMat);
    seat.position.set(0, 1.65, 0);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.75), seatMat);
    backrest.position.set(0.35, 1.98, 0);
    chairGroup.add(seat, backrest);

    const deskTray = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.78), blackMetal);
    deskTray.position.set(-0.42, 1.95, 0);
    chairGroup.add(deskTray);

    const pcBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.03, 0.38),
      new THREE.MeshBasicMaterial({ color: 0x334155 })
    );
    pcBase.position.set(-0.42, 1.99, 0);
    chairGroup.add(pcBase);

    const pcMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.28, 0.38),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    pcMonitor.position.set(-0.54, 2.12, 0);
    pcMonitor.rotation.z = -0.25;

    const pcGlowScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    pcGlowScreen.rotation.y = Math.PI / 2;
    pcGlowScreen.position.set(0.025, 0, 0);
    pcMonitor.add(pcGlowScreen);
    chairGroup.add(pcMonitor);

    const umpireTex = GbaSpriteFactory.createUmpireSprite();
    const umpireSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 1.35),
      new THREE.MeshBasicMaterial({
        map: umpireTex,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide
      })
    );
    umpireSprite.position.set(0.02, 2.22, 0.05);
    umpireSprite.rotation.x = -0.15;
    chairGroup.add(umpireSprite);

    const yellowBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.65, 1.35),
      new THREE.MeshLambertMaterial({ color: 0xeab308 })
    );
    yellowBox.position.set(1.25, 0.325, 0.9);
    chairGroup.add(yellowBox);

    this.group.add(chairGroup);
  }

  private buildServiceJudgeAndLineJudges(): void {
    const officialTex = GbaSpriteFactory.createOfficialSprite();

    const createSeatedOfficial = (x: number, z: number, rotY = 0) => {
      const g = new THREE.Group();
      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.45, 0.48),
        new THREE.MeshBasicMaterial({ color: 0x1e293b })
      );
      chair.position.y = 0.225;

      const sprite = new THREE.Mesh(
        new THREE.PlaneGeometry(1.05, 1.18),
        new THREE.MeshBasicMaterial({
          map: officialTex,
          color: 0xdbe4f0,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.DoubleSide
        })
      );
      sprite.position.set(0, 0.76, 0);
      sprite.rotation.y = rotY;
      sprite.rotation.x = -0.15;

      g.add(chair, sprite);
      g.position.set(x, 0, z);
      this.group.add(g);
    };

    createSeatedOfficial(-4.55, 0.35, 0.25);

    const orangeDesk = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.62, 0.95),
      new THREE.MeshLambertMaterial({ color: 0xea580c })
    );
    orangeDesk.position.set(-4.35, 0.31, 1.15);
    this.group.add(orangeDesk);

    [-0.18, 0.18].forEach((zOff) => {
      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.15, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      pole.position.set(-3.85, 0.575, zOff);
      this.group.add(pole);
    });

    createSeatedOfficial(-2.8, -8.8, 0);
    createSeatedOfficial(2.8, -8.8, 0);
    createSeatedOfficial(-6.2, -1.8, 0.35);
    createSeatedOfficial(5.8, -0.4, -0.35);
  }

  private buildCourtsideCrewAndProps(): void {
    const cameramanTex = GbaSpriteFactory.createCameramanSprite();
    const photoTex = GbaSpriteFactory.createPhotographerSprite();
    const mopKidTex = GbaSpriteFactory.createCourtsideStaffSprite('MOP_KID');
    const stewardTex = GbaSpriteFactory.createCourtsideStaffSprite('STEWARD');
    const coachTex = GbaSpriteFactory.createCourtsideStaffSprite('COACH');

    const placeBillboard = (
      tex: THREE.CanvasTexture,
      x: number,
      z: number,
      w = 1.35,
      h = 1.45,
      flipX = false,
      rotY = 0
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          map: tex,
          color: 0xd4d4d8, // Subtle dim tint so courtside crew doesn't distract from court
          transparent: true,
          alphaTest: 0.1,
          side: THREE.DoubleSide
        })
      );
      mesh.position.set(x, h / 2, z);
      mesh.rotation.y = rotY;
      mesh.rotation.x = -0.15;
      if (flipX) mesh.scale.x = -1;

      const sh = new THREE.Mesh(
        new THREE.CircleGeometry(0.35, 10),
        new THREE.MeshBasicMaterial({ color: 0x4c0519, transparent: true, opacity: 0.55 })
      );
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(x, 0.008, z);

      this.group.add(sh, mesh);
    };

    placeBillboard(cameramanTex, -8.2, 0.6, 1.5, 1.5, false, 0.25);
    placeBillboard(cameramanTex, 8.4, -1.2, 1.5, 1.5, true, -0.25);
    placeBillboard(cameramanTex, -7.8, -5.8, 1.5, 1.5, false, 0.35);

    placeBillboard(photoTex, -5.4, 4.8, 1.25, 1.25, false, 0.3);
    placeBillboard(photoTex, 5.6, 4.9, 1.25, 1.25, true, -0.3);
    placeBillboard(photoTex, 7.2, -6.2, 1.25, 1.25, true, -0.2);

    placeBillboard(mopKidTex, -8.8, -7.6, 1.25, 1.38, false, 0.15);
    placeBillboard(mopKidTex, 8.8, -7.6, 1.25, 1.38, true, -0.15);

    [
      { x: -5.2, z: -6.8, flip: false },
      { x: 6.4, z: 2.2, flip: true }
    ].forEach((c) => {
      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.48, 0.55),
        new THREE.MeshBasicMaterial({ color: 0x1e293b })
      );
      chair.position.set(c.x, 0.24, c.z);

      const cooler = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.45, 0.45),
        new THREE.MeshLambertMaterial({ color: 0x2563eb })
      );
      cooler.position.set(c.x + (c.flip ? 0.65 : -0.65), 0.225, c.z);
      const lid = new THREE.Mesh(
        new THREE.BoxGeometry(0.67, 0.08, 0.47),
        new THREE.MeshLambertMaterial({ color: 0xf8fafc })
      );
      lid.position.set(c.x + (c.flip ? 0.65 : -0.65), 0.46, c.z);

      this.group.add(chair, cooler, lid);
      placeBillboard(coachTex, c.x, c.z + 0.05, 1.2, 1.32, c.flip, 0);
    });

    placeBillboard(stewardTex, -10.5, -8.9, 1.2, 1.35, false, 0);
    placeBillboard(stewardTex, 10.5, -8.9, 1.2, 1.35, true, 0);
    placeBillboard(stewardTex, -10.2, 4.2, 1.2, 1.35, false, 0.4);
    placeBillboard(stewardTex, 10.2, 4.2, 1.2, 1.35, true, -0.4);
  }

  public static isShuttleInBounds(
    x: number,
    z: number,
    targetSide: 0 | 1,
    isDoubles = false
  ): boolean {
    const maxHalfWidth = isDoubles ? COURT.DOUBLES_WIDTH / 2 : COURT.HALF_WIDTH;
    const inWidth = Math.abs(x) <= maxHalfWidth + 0.06;
    const inLength =
      targetSide === 0
        ? z >= 0 && z <= COURT.HALF_LENGTH + 0.06
        : z <= 0 && z >= -COURT.HALF_LENGTH - 0.06;
    return inWidth && inLength;
  }
}