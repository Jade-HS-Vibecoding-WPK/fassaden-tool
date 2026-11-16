// 3D-Szene: Bühne, Kamera, Licht und Maussteuerung
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Szene {
  constructor(behaelter) {
    this.behaelter = behaelter;

    // Zeichenfläche (Renderer)
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xffffff);
    behaelter.prepend(this.renderer.domElement);

    this.szene = new THREE.Scene();

    // Kamera mit Blick schräg von oben
    this.kamera = new THREE.PerspectiveCamera(40, 1, 0.1, 5000);
    this.kamera.position.set(20, 15, 20);

    // Maus: links drehen, Rad zoomen, rechts verschieben
    this.steuerung = new OrbitControls(this.kamera, this.renderer.domElement);
    this.steuerung.enableDamping = true;
    this.steuerung.maxPolarAngle = Math.PI * 0.495; // nicht unter den Boden schauen

    // Licht: weiches Grundlicht plus eine Sonne für Helligkeitsunterschiede der Seiten
    this.szene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 2.2));
    const sonne = new THREE.DirectionalLight(0xffffff, 1.6);
    sonne.position.set(30, 50, 20);
    this.szene.add(sonne);

    this.modell = null;

    // Größe anpassen, wenn sich das Fenster ändert
    new ResizeObserver(() => this.groesseAnpassen()).observe(behaelter);
    this.groesseAnpassen();

    this.renderer.setAnimationLoop(() => {
      this.steuerung.update();
      this.renderer.render(this.szene, this.kamera);
    });
  }

  groesseAnpassen() {
    const breite = this.behaelter.clientWidth;
    const hoehe = this.behaelter.clientHeight;
    if (!breite || !hoehe) return;
    this.renderer.setSize(breite, hoehe, false);
    this.kamera.aspect = breite / hoehe;
    this.kamera.updateProjectionMatrix();
  }

  // Altes Modell entfernen, neues zeigen und die Kamera darauf ausrichten
  zeigeModell(gruppe) {
    if (this.modell) {
      this.szene.remove(this.modell);
      this.modell.traverse((teil) => teil.geometry?.dispose());
    }
    this.modell = gruppe;
    this.szene.add(gruppe);
    this.kameraEinpassen();
  }

  kameraEinpassen() {
    const box = new THREE.Box3().setFromObject(this.modell);
    if (box.isEmpty()) return;
    const mitte = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const abstand = radius / Math.sin(THREE.MathUtils.degToRad(this.kamera.fov / 2)) * 0.75;

    // Blick von Südosten schräg von oben (Norden = Plan-oben = -Z)
    const richtung = new THREE.Vector3(1, 0.7, 1).normalize();
    this.kamera.position.copy(mitte).addScaledVector(richtung, abstand);
    this.kamera.near = abstand / 100;
    this.kamera.far = abstand * 10;
    this.kamera.updateProjectionMatrix();
    this.steuerung.target.copy(mitte);
    this.steuerung.update();
  }
}
