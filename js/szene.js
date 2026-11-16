// 3D-Szene: Bühne, Kamera, Licht und Maussteuerung
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Ist das Teil zu sehen? (es selbst und alle, zu denen es gehört)
function istSichtbar(teil) {
  for (let t = teil; t; t = t.parent) if (!t.visible) return false;
  return true;
}

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
    this.mausAnklickenEinrichten();

    // Größe anpassen, wenn sich das Fenster ändert
    new ResizeObserver(() => this.groesseAnpassen()).observe(behaelter);
    this.groesseAnpassen();

    this.renderer.setAnimationLoop(() => {
      this.steuerung.update();
      this.renderer.render(this.szene, this.kamera);
    });
  }

  // Bauteile mit der Maus anfahren und anklicken.
  // Wer mitmachen will, setzt: istAnklickbar(bauteil), beiHover(bauteil oder null), beiKlick(bauteil)
  mausAnklickenEinrichten() {
    this.istAnklickbar = () => false;
    this.beiHover = () => {};
    this.beiKlick = () => {};
    this.hoverBauteil = null;

    const leinwand = this.renderer.domElement;
    const strahl = new THREE.Raycaster();
    const maus = new THREE.Vector2();
    let gedrueckt = null;

    const bauteilUnterMaus = (e) => {
      if (!this.modell) return null;
      const rahmen = leinwand.getBoundingClientRect();
      maus.set(((e.clientX - rahmen.left) / rahmen.width) * 2 - 1, -((e.clientY - rahmen.top) / rahmen.height) * 2 + 1);
      strahl.setFromCamera(maus, this.kamera);
      // Ausgeblendete Teile (z. B. Original-Wand hinter einer nachgebauten Scheibe) zählen nicht
      const treffer = strahl.intersectObject(this.modell, true).find((t) => istSichtbar(t.object));
      const bauteil = treffer?.object.parent;
      return bauteil && this.istAnklickbar(bauteil) ? bauteil : null;
    };

    leinwand.addEventListener('pointermove', (e) => {
      if (e.buttons !== 0) return; // beim Drehen nicht hervorheben
      const bauteil = bauteilUnterMaus(e);
      if (bauteil === this.hoverBauteil) return;
      this.hoverBauteil = bauteil;
      leinwand.style.cursor = bauteil ? 'pointer' : '';
      this.beiHover(bauteil);
    });
    leinwand.addEventListener('pointerdown', (e) => { gedrueckt = e.button === 0 ? { x: e.clientX, y: e.clientY } : null; });
    leinwand.addEventListener('pointerup', (e) => {
      // Nur ein Klick, wenn die Maus dabei kaum bewegt wurde (sonst war es Drehen)
      if (!gedrueckt || Math.hypot(e.clientX - gedrueckt.x, e.clientY - gedrueckt.y) > 4) return;
      gedrueckt = null;
      const bauteil = bauteilUnterMaus(e);
      if (bauteil) this.beiKlick(bauteil);
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
    this.hoverBauteil = null;
    this.szene.add(gruppe);
    this.kameraEinpassen();
  }

  // Kamera auf das Gebäude (Wände und Dach) ausrichten, nicht auf das oft riesige Gelände
  kameraEinpassen() {
    const box = new THREE.Box3();
    for (const bauteil of this.modell.children) {
      if (['wand', 'dach'].includes(bauteil.userData.art)) box.expandByObject(bauteil);
    }
    if (box.isEmpty()) box.setFromObject(this.modell);
    if (box.isEmpty()) return;
    const mitte = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const abstand = radius / Math.sin(THREE.MathUtils.degToRad(this.kamera.fov / 2)) * 1.1;

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
