// 3D-Szene: Bühne, Kamera, Licht und Maussteuerung
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Ist das Teil zu sehen? (es selbst und alle, zu denen es gehört)
function istSichtbar(teil) {
  for (let t = teil; t; t = t.parent) if (!t.visible) return false;
  return true;
}

// Bild als Text (data:image/jpeg;base64,…) in eine kompakte Bilddatei (Blob) umwandeln
function alsBlob(datenAdresse) {
  const [kopf, inhalt] = datenAdresse.split(',');
  const zeichen = atob(inhalt);
  const bytes = new Uint8Array(zeichen.length);
  for (let i = 0; i < zeichen.length; i++) bytes[i] = zeichen.charCodeAt(i);
  return new Blob([bytes], { type: kopf.slice(5, kopf.indexOf(';')) });
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

  // Umriss des Gebäudes (Wände und Dach), nicht des oft riesigen Geländes
  gebaeudeBox() {
    const box = new THREE.Box3();
    for (const bauteil of this.modell.children) {
      if (['wand', 'dach'].includes(bauteil.userData.art)) box.expandByObject(bauteil);
    }
    if (box.isEmpty()) box.setFromObject(this.modell);
    return box;
  }

  // Kamera auf das Gebäude ausrichten
  kameraEinpassen() {
    const box = this.gebaeudeBox();
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

  // Eckpunkte der sichtbaren Gebäudeteile (ohne Gelände und Sonstiges), höchstens ca. 20 000 Stück
  sichtbarePunkte() {
    const netze = [];
    for (const bauteil of this.modell.children) {
      if (!['wand', 'dach', 'stuetze', 'fenster', 'tuer'].includes(bauteil.userData.art)) continue;
      bauteil.traverse((teil) => { if (teil.isMesh && istSichtbar(teil)) netze.push(teil); });
    }
    const gesamt = netze.reduce((summe, netz) => summe + netz.geometry.attributes.position.count, 0);
    const schritt = Math.max(1, Math.ceil(gesamt / 20000));
    const punkte = [];
    for (const netz of netze) {
      netz.updateWorldMatrix(true, false);
      const lage = netz.geometry.attributes.position;
      for (let i = 0; i < lage.count; i += schritt) {
        punkte.push(new THREE.Vector3().fromBufferAttribute(lage, i).applyMatrix4(netz.matrixWorld));
      }
    }
    if (punkte.length === 0) { // Notfall: Ecken der Gebäudebox
      const box = this.gebaeudeBox();
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        punkte.push(new THREE.Vector3(x, y, z));
      }
    }
    return punkte;
  }

  // 5 Bilder aus fester Kamera, unabhängig von der aktuellen Blickrichtung:
  // Perspektive (schräg von oben aus Südosten) und die Ansichten Nord/Ost/Süd/West als Parallelprojektion.
  // Liefert { perspektive, N, O, S, W } als JPEG-Bilder (Blob).
  async bilderAufnehmen(breite = 1500, hoehe = 1000) {
    const box = this.gebaeudeBox();
    const mitte = box.getCenter(new THREE.Vector3());
    const groesse = box.getSize(new THREE.Vector3());
    const seitenverhaeltnis = breite / hoehe;
    const rand = 1.12; // etwas Luft ums Gebäude

    // Perspektive: Abstand und Bildmitte so wählen, dass die sichtbaren Bauteile knapp ins Bild passen
    const perspektive = new THREE.PerspectiveCamera(this.kamera.fov, seitenverhaeltnis, 0.1, 5000);
    const richtung = new THREE.Vector3(1, 0.7, 1).normalize();
    const punkte = this.sichtbarePunkte();
    const ziel = mitte.clone();
    let abstand = groesse.length() * 2;
    for (let versuch = 0; versuch < 5; versuch++) {
      perspektive.position.copy(ziel).addScaledVector(richtung, abstand);
      perspektive.lookAt(ziel);
      perspektive.near = abstand / 100;
      perspektive.far = abstand * 10;
      perspektive.updateProjectionMatrix();
      perspektive.updateMatrixWorld();
      // Ausdehnung im Bild (-1 … 1 = Bildrand) messen
      const bild = new THREE.Box2();
      const p = new THREE.Vector3();
      for (const punkt of punkte) bild.expandByPoint(p.copy(punkt).project(perspektive));
      // Ziel zur Mitte der Ausdehnung verschieben, dann Abstand anpassen
      const versatz = bild.getCenter(new THREE.Vector2());
      const halbH = Math.tan(THREE.MathUtils.degToRad(perspektive.fov / 2)) * abstand;
      ziel.addScaledVector(new THREE.Vector3().setFromMatrixColumn(perspektive.matrixWorld, 0), versatz.x * halbH * seitenverhaeltnis);
      ziel.addScaledVector(new THREE.Vector3().setFromMatrixColumn(perspektive.matrixWorld, 1), versatz.y * halbH);
      const ausdehnung = bild.getSize(new THREE.Vector2());
      abstand *= (Math.max(ausdehnung.x, ausdehnung.y) / 2) * rand;
    }
    perspektive.position.copy(ziel).addScaledVector(richtung, abstand);
    perspektive.lookAt(ziel);
    perspektive.near = abstand / 100;
    perspektive.far = abstand * 10;
    perspektive.updateProjectionMatrix();

    // Ansichten: Blick waagerecht auf die jeweilige Seite (Norden = -Z = Plan-oben)
    const ANSICHTEN = { N: [0, 0, -1], O: [1, 0, 0], S: [0, 0, 1], W: [-1, 0, 0] };
    const ansichtKamera = ([x, , z]) => {
      const bildBreite = (x === 0 ? groesse.x : groesse.z) * rand;
      const bildHoehe = groesse.y * rand;
      // Bildausschnitt aufs Seitenverhältnis bringen, ohne etwas abzuschneiden
      const halbB = Math.max(bildBreite, bildHoehe * seitenverhaeltnis) / 2;
      const halbH = halbB / seitenverhaeltnis;
      const tiefe = groesse.length();
      const kamera = new THREE.OrthographicCamera(-halbB, halbB, halbH, -halbH, 0.1, tiefe * 3);
      kamera.position.copy(mitte).add(new THREE.Vector3(x, 0, z).multiplyScalar(tiefe));
      kamera.lookAt(mitte);
      kamera.updateProjectionMatrix();
      return kamera;
    };

    // Zeichenfläche kurz auf Bildgröße stellen, danach zurück
    const alteGroesse = this.renderer.getSize(new THREE.Vector2());
    const alteDichte = this.renderer.getPixelRatio();
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(breite, hoehe, false);

    const bilder = {};
    try {
      const kameras = { perspektive, ...Object.fromEntries(Object.entries(ANSICHTEN).map(([r, v]) => [r, ansichtKamera(v)])) };
      for (const [name, kamera] of Object.entries(kameras)) {
        this.renderer.render(this.szene, kamera);
        // Bild sofort abholen, solange es noch auf der Zeichenfläche liegt
        // (toDataURL statt toBlob: toBlob braucht in manchen Browsern ca. 1 s pro Bild)
        bilder[name] = alsBlob(this.renderer.domElement.toDataURL('image/jpeg', 0.85));
      }
    } finally {
      this.renderer.setPixelRatio(alteDichte);
      this.renderer.setSize(alteGroesse.x, alteGroesse.y, false);
    }
    return bilder;
  }
}
