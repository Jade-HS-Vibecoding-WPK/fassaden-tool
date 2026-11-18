// 3D-Szene: Bühne, Kamera, Licht und Maussteuerung
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { realistischesMaterial, himmelHintergrund, himmelUmgebung } from './realistisch.js?v=25';

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
    // 3D-Fenster fast weiß mit einem Hauch Kühle (Sitzung 15b); die gespeicherten Bilder bleiben reinweiß (s. bilderAufnehmen)
    this.HINTERGRUND = 0xf4f5f8;
    this.renderer.setClearColor(this.HINTERGRUND);
    // Schatten (Sitzung 15): weiche Kanten; berechnet wird nur, wenn die Sonne an ist
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Schatten hängen nicht vom Blick ab: nur neu berechnen, wenn sich Sonne oder Bauteile ändern (spart viel Rechenzeit)
    this.renderer.shadowMap.autoUpdate = false;
    this.schattenFingerabdruck = null;
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
    this.grundlicht = new THREE.HemisphereLight(0xffffff, 0xdddddd, 2.2);
    this.szene.add(this.grundlicht);
    this.sonne = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sonne.position.set(30, 50, 20);
    this.szene.add(this.sonne, this.sonne.target);
    this.sonne.shadow.mapSize.set(4096, 4096);
    this.sonne.shadow.bias = -0.0004;
    this.sonne.shadow.normalBias = 0.03;

    // Sonnenstand und Schatten (Sitzung 15): null = Sonne aus (Licht wie bisher, keine Schatten),
    // sonst { azimut, hoehe } in Grad. Gilt im 3D-Fenster und für die gespeicherten Bilder.
    this.sonnenstand = null;
    // Unsichtbarer Boden, der nur den Schatten zeigt (auch wenn die IFC kein Gelände hat)
    this.schattenBoden = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.22, depthWrite: false }));
    this.schattenBoden.rotation.x = -Math.PI / 2;
    this.schattenBoden.receiveShadow = true;
    this.schattenBoden.visible = false;
    this.schattenBoden.raycast = () => {};
    this.szene.add(this.schattenBoden);

    // Umschalter „Zeichnung | Realistisch“: gilt nur fürs 3D-Fenster, nicht für die gespeicherten Bilder
    this.realistisch = false;

    this.modell = null;
    this.mausAnklickenEinrichten();

    // Größe anpassen, wenn sich das Fenster ändert
    new ResizeObserver(() => this.groesseAnpassen()).observe(behaelter);
    this.groesseAnpassen();

    this.renderer.setAnimationLoop(() => {
      this.steuerung.update();
      if (this.sonneScheint()) this.schattenBauteileMarkieren();
      if (this.realistisch && this.modell) this.realistischZeichnen();
      else this.renderer.render(this.szene, this.kamera);
    });
  }

  // Ein Bild „realistisch“: Materialien kurz tauschen, Linien ausblenden, Himmel und Licht umstellen,
  // zeichnen und sofort alles zurück. So merkt der Rest der App nichts davon
  // (Hervorheben, Auswahl und die gespeicherten Bilder arbeiten weiter mit dem Zeichenstil).
  realistischZeichnen() {
    if (!this.himmel) {
      this.himmel = himmelHintergrund();
      this.umgebung = himmelUmgebung(this.renderer);
    }
    const netze = [], linien = [];
    this.modell.traverse((teil) => {
      if (teil.isMesh) { netze.push(teil, teil.material); teil.material = realistischesMaterial(teil.material); }
      else if (teil.isLineSegments && teil.visible) { linien.push(teil); teil.visible = false; }
    });
    this.szene.background = this.himmel;
    this.szene.environment = this.umgebung;
    // Sonne tiefer und von Südwesten: Südseite hell, Ostseite im Schatten (deutliche Licht- und Schattenseiten).
    // Ist die Sonne (Sitzung 15) an, bleibt sie, wo sie laut Datum und Uhrzeit steht.
    const sonnenLage = this.sonne.position.clone();
    const sonnenKraft = this.sonne.intensity;
    const grundKraft = this.grundlicht.intensity;
    const scheint = this.sonneScheint();
    if (!scheint) this.sonne.position.set(-20, 30, 35);
    this.grundlicht.intensity = scheint ? 0.7 : 0.8;
    // Himmelslicht von oben leicht kühl, vom Boden zurückgeworfenes Licht warm und dunkler (wie draußen)
    this.grundlicht.color.set(0xdfe9f7);
    this.grundlicht.groundColor.set(0x8c8270);
    this.sonne.color.set(0xfff3e2); // Sonne leicht warm
    // tief stehende Sonne: wärmer (morgens/abends) – nur, wenn die Sonne an ist
    if (scheint && this.sonnenstand.hoehe < 15) this.sonne.color.lerp(new THREE.Color(0xffc890), 1 - this.sonnenstand.hoehe / 15);
    // Sonne an, aber untergegangen: kein Sonnenlicht
    this.sonne.intensity = this.sonnenstand && !scheint ? 0 : 2.8;
    // weiche Belichtung wie bei einer Kamera, damit helle Flächen nicht ausbrennen
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    try {
      this.renderer.render(this.szene, this.kamera);
    } finally {
      for (let i = 0; i < netze.length; i += 2) netze[i].material = netze[i + 1];
      for (const linie of linien) linie.visible = true;
      this.szene.background = null;
      this.szene.environment = null;
      this.grundlicht.intensity = grundKraft;
      this.grundlicht.color.set(0xffffff);
      this.grundlicht.groundColor.set(0xdddddd);
      this.sonne.color.set(0xffffff);
      this.sonne.intensity = sonnenKraft;
      this.sonne.position.copy(sonnenLage);
      this.renderer.toneMapping = THREE.NoToneMapping;
    }
  }

  // Bauteile mit der Maus anfahren und anklicken.
  // Wer mitmachen will, setzt: istAnklickbar(bauteil), beiHover(bauteil oder null), beiKlick(bauteil oder null, ereignis)
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
      // Bauteil = das nächste übergeordnete Teil mit einer Art (neu gezeichnete Fenster liegen eine Ebene tiefer)
      let bauteil = treffer?.object.parent;
      while (bauteil && !bauteil.userData.art) bauteil = bauteil.parent;
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
      // Auch ein Klick ins Leere wird gemeldet (bauteil = null), z. B. um eine Auswahl aufzuheben
      this.beiKlick(bauteilUnterMaus(e), e);
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
    this.sonneSetzen(this.sonnenstand);
  }

  // ---------- Sonne und Schatten (Sitzung 15) ----------

  // Ist die Sonne an und steht sie über dem Horizont? (sonst: keine Schatten)
  sonneScheint() {
    return !!(this.modell && this.sonnenstand && this.sonnenstand.hoehe > 0);
  }

  // stand = { azimut, hoehe } in Grad oder null (= Sonne aus, Licht wie bisher)
  sonneSetzen(stand) {
    const vorher = this.renderer.shadowMap.enabled;
    this.sonnenstand = stand;
    const scheint = this.sonneScheint();
    this.renderer.shadowMap.enabled = scheint;
    this.sonne.castShadow = scheint;
    this.schattenBoden.visible = scheint;
    if (!this.modell || !stand) {
      // wie bisher: Sonne fest von oben rechts, gleichmäßiges Grundlicht
      this.sonne.position.set(30, 50, 20);
      this.sonne.target.position.set(0, 0, 0);
      this.sonne.intensity = 1.6;
      this.grundlicht.intensity = 2.2;
    } else if (!scheint) {
      // Sonne untergegangen: nur Himmelslicht, keine Schatten
      this.sonne.intensity = 0;
      this.grundlicht.intensity = 2.6;
    } else {
      // Zeichenstil mit Sonne: etwas weniger Grundlicht, damit die Schatten ruhig, aber deutlich sind
      this.sonne.intensity = 2.4;
      this.grundlicht.intensity = 1.6;
      this.schattenEinpassen();
    }
    this.renderer.shadowMap.needsUpdate = true; // Sonne hat sich bewegt
    if (this.modell) this.schattenBauteileMarkieren();
    // Gehen Schatten an oder aus, müssen die Materialien einmal neu vorbereitet werden
    if (vorher !== scheint) {
      this.szene.traverse((teil) => { if (teil.material) teil.material.needsUpdate = true; });
    }
  }

  // Richtung zur Sonne (Norden = -Z = Plan-oben, Osten = +X)
  static sonnenRichtung({ azimut, hoehe }) {
    const a = THREE.MathUtils.degToRad(azimut), h = THREE.MathUtils.degToRad(hoehe);
    return new THREE.Vector3(Math.cos(h) * Math.sin(a), Math.sin(h), -Math.cos(h) * Math.cos(a));
  }

  // Sonne und Schattenkamera so stellen, dass Gebäude und Schatten (bis zu einer Höchstlänge) hineinpassen
  schattenEinpassen() {
    const box = this.gebaeudeBox();
    const mitte = box.getCenter(new THREE.Vector3());
    const diagonale = box.getSize(new THREE.Vector3()).length();
    const richtung = Szene.sonnenRichtung(this.sonnenstand);
    const bodenHoehe = box.min.y;
    // Ecken des Gebäudes und Schattenspitzen der Ecken auf dem Boden; sehr lange Schatten (tiefe Sonne) werden gekappt
    const hoechstens = diagonale * 4;
    const punkte = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const p = new THREE.Vector3(x, y, z);
      const laenge = Math.min(hoechstens, (y - bodenHoehe) / Math.max(richtung.y, 1e-3));
      punkte.push(p, p.clone().addScaledVector(richtung, -laenge).setY(bodenHoehe));
    }
    this.sonne.target.position.copy(mitte);
    this.sonne.position.copy(mitte).addScaledVector(richtung, diagonale * 3);
    this.sonne.updateMatrixWorld();
    this.sonne.target.updateMatrixWorld();
    // Schattenkamera blickt von der Sonne zur Mitte; Ausschnitt = alle Punkte
    const kamera = this.sonne.shadow.camera;
    kamera.position.copy(this.sonne.position);
    kamera.lookAt(mitte);
    kamera.updateMatrixWorld();
    const bild = new THREE.Box3();
    for (const p of punkte) bild.expandByPoint(p.clone().applyMatrix4(kamera.matrixWorldInverse));
    const rand = diagonale * 0.05;
    kamera.left = bild.min.x - rand; kamera.right = bild.max.x + rand;
    kamera.bottom = bild.min.y - rand; kamera.top = bild.max.y + rand;
    kamera.near = Math.max(0.1, -bild.max.z - diagonale);
    kamera.far = -bild.min.z + diagonale;
    kamera.updateProjectionMatrix();
    // Schattenboden: so groß wie der Bereich, in dem es Schatten gibt
    const flaeche = new THREE.Box3().setFromPoints(punkte);
    const bodenMitte = flaeche.getCenter(new THREE.Vector3());
    const bodenGroesse = flaeche.getSize(new THREE.Vector3());
    this.schattenBoden.position.set(bodenMitte.x, bodenHoehe - 0.01, bodenMitte.z);
    this.schattenBoden.scale.set(bodenGroesse.x + 2 * rand, bodenGroesse.z + 2 * rand, 1);
  }

  // Alle Bauteile werfen und empfangen Schatten, durchsichtige (Glas) werfen keinen.
  // Läuft bei jedem Bild, weil die App beim Ändern der Fenster neue Teile anlegt oder Wände ausblendet.
  // Ein „Fingerabdruck“ der sichtbaren Teile zeigt, ob der Schatten neu berechnet werden muss.
  schattenBauteileMarkieren() {
    const an = this.sonneScheint();
    this.modell.traverse((teil) => {
      if (!teil.isMesh) return;
      teil.castShadow = an && !teil.material.transparent;
      teil.receiveShadow = an;
    });
    let abdruck = 0;
    this.modell.traverseVisible((teil) => { if (teil.castShadow) abdruck = (abdruck * 31 + teil.id) % 2147483647; });
    if (abdruck !== this.schattenFingerabdruck) {
      this.schattenFingerabdruck = abdruck;
      this.renderer.shadowMap.needsUpdate = true;
    }
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

  // Richtung vom Gebäude zur Kamera für die Perspektive.
  // blick = { aus: Himmelsrichtung in Grad (z. B. 135 = Südost), hoehe: Grad über der Waagerechten };
  // drehung: Drehung des Gebäudes im Plan in Grad (die Kamera dreht sich mit)
  static blickRichtung(blick, drehung = 0) {
    const rad = THREE.MathUtils.degToRad(blick.aus + drehung);
    const hoehe = THREE.MathUtils.degToRad(blick.hoehe);
    return new THREE.Vector3(Math.cos(hoehe) * Math.sin(rad), Math.sin(hoehe), -Math.cos(hoehe) * Math.cos(rad));
  }

  // Perspektiv-Kamera so stellen, dass die sichtbaren Bauteile knapp ins Bild passen (Haus mittig).
  // Gibt den Punkt zurück, auf den die Kamera schaut.
  perspektiveEinpassen(kamera, richtung, punkte, rand = 1.12) {
    const box = this.gebaeudeBox();
    const ziel = box.getCenter(new THREE.Vector3());
    let abstand = box.getSize(new THREE.Vector3()).length() * 2;
    const stellen = () => {
      kamera.position.copy(ziel).addScaledVector(richtung, abstand);
      kamera.lookAt(ziel);
      kamera.near = abstand / 100;
      kamera.far = abstand * 10;
      kamera.updateProjectionMatrix();
      kamera.updateMatrixWorld();
    };
    for (let versuch = 0; versuch < 5; versuch++) {
      stellen();
      // Ausdehnung im Bild (-1 … 1 = Bildrand) messen
      const bild = new THREE.Box2();
      const p = new THREE.Vector3();
      for (const punkt of punkte) bild.expandByPoint(p.copy(punkt).project(kamera));
      // Ziel zur Mitte der Ausdehnung verschieben, dann Abstand anpassen
      const versatz = bild.getCenter(new THREE.Vector2());
      const halbH = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)) * abstand;
      ziel.addScaledVector(new THREE.Vector3().setFromMatrixColumn(kamera.matrixWorld, 0), versatz.x * halbH * kamera.aspect);
      ziel.addScaledVector(new THREE.Vector3().setFromMatrixColumn(kamera.matrixWorld, 1), versatz.y * halbH);
      const ausdehnung = bild.getSize(new THREE.Vector2());
      abstand *= (Math.max(ausdehnung.x, ausdehnung.y) / 2) * rand;
    }
    stellen();
    return ziel;
  }

  // Das 3D-Fenster auf den eingestellten Blick der Perspektive stellen (danach frei drehbar)
  blickZeigen(blick, drehung = 0) {
    if (!this.modell) return;
    const ziel = this.perspektiveEinpassen(this.kamera, Szene.blickRichtung(blick, drehung), this.sichtbarePunkte(), 1.05);
    this.steuerung.target.copy(ziel);
    this.steuerung.update();
  }

  // 5 Bilder aus fester Kamera, unabhängig von der aktuellen Blickrichtung:
  // Perspektive (eingestellter Blick, s. blickRichtung) und die Ansichten Nord/Ost/Süd/West als Parallelprojektion.
  // drehung: um wie viel Grad das Gebäude im Plan gedreht ist (im Uhrzeigersinn positiv).
  // Die Kameras drehen sich mit, damit die Ansichten gerade auf die Fassade schauen.
  // Liefert { perspektive, N, O, S, W } als JPEG-Bilder (Blob).
  async bilderAufnehmen(breite = 1500, hoehe = 1000, drehung = 0, blick = { aus: 135, hoehe: 15 }) {
    const box = this.gebaeudeBox();
    const mitte = box.getCenter(new THREE.Vector3());
    const groesse = box.getSize(new THREE.Vector3());
    const seitenverhaeltnis = breite / hoehe;
    const rand = 1.12; // etwas Luft ums Gebäude
    const punkte = this.sichtbarePunkte();

    // Perspektive: Abstand und Bildmitte so wählen, dass die sichtbaren Bauteile knapp ins Bild passen
    const perspektive = new THREE.PerspectiveCamera(this.kamera.fov, seitenverhaeltnis, 0.1, 5000);
    this.perspektiveEinpassen(perspektive, Szene.blickRichtung(blick, drehung), punkte, rand);

    // Ansichten: Blick waagerecht und senkrecht auf die jeweilige Seite (Norden = -Z = Plan-oben),
    // um die Drehung des Gebäudes mitgedreht
    const ANSICHTEN = { N: 0, O: 90, S: 180, W: 270 }; // Himmelsrichtung in Grad, 0 = Nord, im Uhrzeigersinn
    const ansichtKamera = (grad) => {
      const rad = THREE.MathUtils.degToRad(grad + drehung);
      const tiefe = groesse.length();
      const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, tiefe * 3);
      kamera.position.copy(mitte).add(new THREE.Vector3(Math.sin(rad), 0, -Math.cos(rad)).multiplyScalar(tiefe));
      kamera.lookAt(mitte);
      kamera.updateMatrixWorld();
      // Ausdehnung des Gebäudes in dieser Blickrichtung messen (im Bild: x = waagerecht, y = senkrecht)
      const bild = new THREE.Box2();
      const p = new THREE.Vector3();
      for (const punkt of punkte) {
        p.copy(punkt).applyMatrix4(kamera.matrixWorldInverse);
        bild.expandByPoint(new THREE.Vector2(p.x, p.y));
      }
      const bildMitte = bild.getCenter(new THREE.Vector2());
      const ausdehnung = bild.getSize(new THREE.Vector2()).multiplyScalar(rand);
      // Bildausschnitt aufs Seitenverhältnis bringen, ohne etwas abzuschneiden
      const halbB = Math.max(ausdehnung.x, ausdehnung.y * seitenverhaeltnis) / 2;
      const halbH = halbB / seitenverhaeltnis;
      kamera.left = bildMitte.x - halbB; kamera.right = bildMitte.x + halbB;
      kamera.bottom = bildMitte.y - halbH; kamera.top = bildMitte.y + halbH;
      kamera.updateProjectionMatrix();
      return kamera;
    };

    // Zeichenfläche kurz auf Bildgröße stellen, danach zurück
    const alteGroesse = this.renderer.getSize(new THREE.Vector2());
    const alteDichte = this.renderer.getPixelRatio();
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(breite, hoehe, false);
    this.renderer.setClearColor(0xffffff); // Bilder, Vergleich und PDF bleiben weiß

    const bilder = {};
    if (this.sonneScheint()) { // gerade neu gebaute Fenster und Wände werfen auch Schatten
      this.schattenBauteileMarkieren();
      this.renderer.shadowMap.needsUpdate = true;
    }
    try {
      const kameras = { perspektive, ...Object.fromEntries(Object.entries(ANSICHTEN).map(([r, v]) => [r, ansichtKamera(v)])) };
      for (const [name, kamera] of Object.entries(kameras)) {
        this.renderer.render(this.szene, kamera);
        // Bild sofort abholen, solange es noch auf der Zeichenfläche liegt
        // (toDataURL statt toBlob: toBlob braucht in manchen Browsern ca. 1 s pro Bild)
        bilder[name] = alsBlob(this.renderer.domElement.toDataURL('image/jpeg', 0.85));
      }
    } finally {
      this.renderer.setClearColor(this.HINTERGRUND);
      this.renderer.setPixelRatio(alteDichte);
      this.renderer.setSize(alteGroesse.x, alteGroesse.y, false);
    }
    return bilder;
  }
}
