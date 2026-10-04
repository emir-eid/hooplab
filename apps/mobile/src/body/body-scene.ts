// Mankenin three.js sahnesi (expo-gl bağlamında; web'de aynı kod tarayıcının WebGL'iyle çalışır).
// Sahne yalnız istendiğinde çizilir (render); döndürme ve renkler bileşenden gelir.

import { spotKey, type BodySpot } from '@hooplab/engine';
import type { Hex } from '@hooplab/theme';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

import type { BodyColors } from './body-colors.ts';
import { bodyFrame, bodyParts, type BodyPart, type Vec3 } from './body-model.ts';

const FOV = 28;
/** Mankenin üstünde ve altında bırakılan pay (boyun oranı). */
const MARGIN = 0.1;
/** Kamera hafif yukarıdan bakar (radyan). */
const CAMERA_TILT = 0.08;

const up = new THREE.Vector3(0, 1, 0);

export class BodyScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 20);
  private readonly pivot = new THREE.Group();
  private readonly meshes: THREE.Mesh[] = [];
  private readonly materials = new Map<string, THREE.MeshStandardMaterial>();
  private readonly floor: { material: THREE.MeshBasicMaterial; opacity: number }[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.4);

  constructor(private readonly gl: ExpoWebGLRenderingContext) {
    this.renderer = createRenderer(gl);
    this.renderer.setPixelRatio(1);

    this.pivot.position.y = bodyFrame.centerY;
    this.scene.add(this.pivot);
    const figure = new THREE.Group();
    figure.position.y = -bodyFrame.centerY;
    this.pivot.add(figure);

    for (const part of bodyParts) {
      const material = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 });
      this.materials.set(part.id, material);
      const holder = meshFor(part, material);
      figure.add(holder);
      holder.traverse((o) => {
        if (o instanceof THREE.Mesh) this.meshes.push(o);
      });
    }

    // Zeminde yumuşak gölge: üst üste binen saydam halkalar (doku kullanılmaz).
    for (const [radius, opacity] of [
      [0.34, 0.05],
      [0.25, 0.06],
      [0.17, 0.07],
    ] as const) {
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity, depthWrite: false });
      this.floor.push({ material, opacity });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), material);
      disc.rotation.x = -Math.PI / 2;
      disc.scale.set(1, 0.62, 1);
      disc.position.y = 0.002;
      figure.add(disc);
    }

    this.scene.add(this.hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(1.6, 3, 3.2);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.1);
    rim.position.set(-2.2, 1.8, -2.6);
    this.scene.add(rim);

    this.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  /** Çizim tamponu boyutu (piksel); kamera mankeni kadraja sığdırır. */
  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    const aspect = width / Math.max(1, height);
    this.camera.aspect = aspect;
    const halfH = (bodyFrame.height / 2) * (1 + MARGIN);
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    // Dar kadrajda omuz genişliği (yaklaşık 0,7 m) de sığmalı.
    const distance = Math.max(halfH / tan, 0.45 / (tan * aspect));
    this.camera.position.set(0, bodyFrame.centerY + Math.sin(CAMERA_TILT) * distance, Math.cos(CAMERA_TILT) * distance);
    this.camera.lookAt(0, bodyFrame.centerY, 0);
    this.camera.updateProjectionMatrix();
  }

  setColors(colors: BodyColors): void {
    this.renderer.setClearColor(new THREE.Color(colors.background), 1);
    this.hemi.color.set(0xffffff);
    this.hemi.groundColor.set(colors.background);
    for (const { material, opacity } of this.floor) {
      material.color.set(colors.shadow);
      material.opacity = Math.min(1, opacity * colors.shadowStrength);
    }
  }

  /**
   * Parçaların rengi. `paint`: spotKey → renk (ağrılı / işaretli bölgeler); diğer bölgeler ped rengi.
   * Seçili bölge hafifçe parlar.
   */
  setPaint(colors: BodyColors, paint: Readonly<Record<string, Hex>>, selected: BodySpot | null): void {
    const selectedKey = selected ? spotKey(selected) : null;
    for (const part of bodyParts) {
      const material = this.materials.get(part.id);
      if (!material) continue;
      const key = part.spot ? spotKey(part.spot) : null;
      const color = key ? (paint[key] ?? colors.pad) : colors.skin;
      const painted = key !== null && paint[key] !== undefined;
      material.color.set(color);
      material.emissive.set(painted ? color : '#000000');
      material.emissiveIntensity = painted ? 0.32 : 0;
      // Seçili bölge metin rengine doğru belirgin bir ton kayar (açık temada koyulaşır, koyuda açılır).
      if (key !== null && key === selectedKey) {
        material.color.lerp(new THREE.Color(colors.selected), 0.35);
        material.emissive.copy(material.color);
        material.emissiveIntensity = 0.18;
      }
    }
  }

  /** Dikey eksende dönüş (radyan); 0 = sporcu kameraya bakıyor. */
  setYaw(yaw: number): void {
    this.pivot.rotation.y = yaw;
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
    this.gl.endFrameEXP();
  }

  /** Görünüm içindeki oransal nokta (0-1) altındaki bölge; bölgesiz parça veya boşluksa null. */
  pick(fx: number, fy: number): BodySpot | null {
    this.pivot.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(fx * 2 - 1, -(fy * 2 - 1)), this.camera);
    const [hit] = this.raycaster.intersectObjects(this.meshes, false);
    const spot = hit?.object.userData.spot as BodySpot | null | undefined;
    return spot ?? null;
  }

  dispose(): void {
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.renderer.dispose();
  }
}

/**
 * expo-gl, WebGL2 bağlamını WebGL1 sınıfından türetir (tarayıcıda ikisi kardeştir); three.js r163+
 * `context instanceof WebGLRenderingContext` denetimiyle bunu WebGL1 sanıp durur. Bağlam gerçekten
 * WebGL2 ise (expo-gl `supportsWebGL2`) denetim yalnız oluşturma anında atlatılır. three.js bu sınıfa
 * başka yerde bakmaz (three.module.js, 0.186). Kanıt: LESSONS "Expo / React Native".
 */
function createRenderer(gl: ExpoWebGLRenderingContext): THREE.WebGLRenderer {
  const params = {
    canvas: canvasFor(gl),
    context: gl as unknown as WebGL2RenderingContext,
    antialias: true,
  };
  const expo = gl as { supportsWebGL2?: boolean };
  if (expo.supportsWebGL2 === undefined) return new THREE.WebGLRenderer(params);
  if (!expo.supportsWebGL2) throw new Error('Bu cihazda WebGL2 (OpenGL ES 3) yok.');
  const scope = globalThis as { WebGLRenderingContext?: unknown };
  const saved = scope.WebGLRenderingContext;
  scope.WebGLRenderingContext = undefined;
  try {
    return new THREE.WebGLRenderer(params);
  } finally {
    scope.WebGLRenderingContext = saved;
  }
}

/** Kapsül veya küre; ölçek dünya eksenlerinde uygulanır (dış grup), yönelim içteki ağda. */
function meshFor(part: BodyPart, material: THREE.Material): THREE.Group {
  const holder = new THREE.Group();
  let mesh: THREE.Mesh;
  if (part.shape === 'capsule') {
    const from = vec(part.from);
    const dir = vec(part.to).sub(from);
    const length = dir.length();
    mesh = new THREE.Mesh(new THREE.CapsuleGeometry(part.radius, length, 10, 24), material);
    mesh.quaternion.setFromUnitVectors(up, dir.normalize());
    holder.position.copy(from.add(vec(part.to)).multiplyScalar(0.5));
  } else if (part.shape === 'sphere') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(part.radius, 32, 20), material);
    holder.position.copy(vec(part.center));
  } else {
    const points = part.profile.map(([r, y]) => new THREE.Vector2(r, y));
    mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 40), material);
    holder.position.copy(vec(part.center));
  }
  if (part.scale) holder.scale.set(...part.scale);
  mesh.userData.spot = part.spot;
  holder.add(mesh);
  return holder;
}

function vec([x, y, z]: Vec3): THREE.Vector3 {
  return new THREE.Vector3(x, y, z);
}

/**
 * three.js bir canvas bekler. Web'de bağlamın gerçek canvas'ı var; native'de (expo-gl) yalnız
 * boyut ve olay yöntemleri taşıyan bir yer tutucu yeter.
 */
function canvasFor(gl: ExpoWebGLRenderingContext): HTMLCanvasElement {
  const real = (gl as { canvas?: unknown }).canvas;
  if (real && typeof (real as { getContext?: unknown }).getContext === 'function') return real as HTMLCanvasElement;
  const stub = {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    clientWidth: gl.drawingBufferWidth,
    clientHeight: gl.drawingBufferHeight,
    getContext: () => gl,
  };
  return stub as unknown as HTMLCanvasElement;
}
