# Umsetzungsplan Fassaden-Tool

## Idee
Werkzeug fürs Architekturstudium: Den eigenen Entwurf als recht einfaches 3D-Modell als IFC
exportieren (z. B. aus Revit oder ArchiCAD), in der App hochladen, die Außenwände mit verschiedenen
Fassadenmaterialien belegen, Fenstergrößen ändern und daraus Varianten machen, die man
nebeneinander vergleicht und als PDF mitnimmt.

## Must (läuft spätestens Do 12 Uhr)
- [ ] IFC-Datei des eigenen Entwurfs hochladen (Button oder Datei ins Fenster ziehen) und in 3D ansehen
- [x] Außenwände automatisch erkennen (IFC-Eigenschaft „IsExternal“ + Lage im Gebäude), per Klick korrigierbar
- [x] Norden = Plan-oben (keine Einstellung)
- [x] Material pro Himmelsrichtung (N/O/S/W): Klinker, Holz, Sichtbeton, Putz, Metall, Glas (je 1–2 Farbtöne)
- [x] Fenster pro Himmelsrichtung: Breite und Höhe in % (Sturz bleibt, Brüstung wandert, 0 % = Fenster zu)
- [x] Kennwerte je Himmelsrichtung und gesamt: Fassadenfläche, Fensterfläche, Fensterflächenanteil
- [ ] Darstellung mit klarem Unterschied zwischen Rohmodell und Entwurf:
      - Alles aus der IFC (Decken, Innenwände, nicht gestaltete Wände) hellgrau-weiß wie ein Arbeitsmodell
      - Dächer in einem festen, ruhigen Dunkelgrau mit Zeichenlinien (nicht weiß) – **seit Sitzung 17b wählbar, Start hellgrau**
      - Gestaltete Fassade „farbig + Zeichenlinien“: gedeckte, ruhige Materialfarben (nicht knallig), dunkle Kantenlinien
        und gezeichnete Struktur (Fugen, Bretter, Raster), wie eine kolorierte Architekturzeichnung –
        künstlerisch, nicht realistisch
- [ ] Varianten speichern (Name + Bilder) und nebeneinander vergleichen;
      pro Variante automatisch 5 Bilder aus fester Kamera: Perspektive + Ansichten Nord/Ost/Süd/West
- [x] PDF-Übersichtsseite: bis zu 4 Varianten auf **A3 quer**, mit Perspektive + 4 Ansichten,
      Kennwerten (Materialien bewusst nicht, Wunsch der Nutzerin); im Kopf Standort (Nordpfeil gestrichen, s. Sitzung 10)
- [x] Für Kommiliton*innen: kurze Anleitung beim ersten Öffnen und Hinweise, wie man die IFC exportiert

## Should (wenn Must steht, Ziel Mittwoch) – in dieser Reihenfolge abarbeiten
**1. Feinjustierung**
- [x] 2. Schritt: einzelne Wand anklicken und anderes Material geben
- [x] 2. Schritt: einzelnes Fenster anklicken, Breite/Höhe in cm ändern

**2. Pfosten-Riegel**
- [x] Pfosten-Riegel-Fassade als eigenes Material für eine ganze Seite;
      Anzahl der Felder einstellbar (z. B. 8 breit × 3 hoch), Pfosten und Riegel werden gleichmäßig verteilt

**3. Sonne & Standort** (kommt erst nach 4a + 4b, Wunsch der Nutzerin 17.11.)
- [ ] Sonnenstand und Schatten in 3D: Datum und Uhrzeit frei wählbar, Schnelltasten 21.3. / 21.6. / 21.12.
- [ ] Standort per Ortssuche (OpenStreetMap, Namensnennung in der App) – *darf notfalls zu Could*;
      Ersatz dann: Koordinaten von Hand eintippen (Schatten gibt es trotzdem)

**4. Darstellung & Extras**
- [x] Darstellung umschaltbar auf „realistisch“: Texturen mit Klinkerfugen, Holzmaserung, Glasspiegelung
- [ ] Eigene Farbe pro Material
- [ ] PDF zusätzlich mit einer eigenen Seite pro Variante – *darf notfalls zu Could*

## Could (wenn Zeit bleibt)
- [ ] Zusätzlicher Kennwert: Fensterfläche / Grundfläche (z. B. Belichtung nach 1/8-Regel);
      braucht Räume (IfcSpace) oder Decken in der IFC, sonst zeigt die App „nicht berechenbar“
- [ ] Varianten als Arbeitsdatei sichern und später wieder laden (ein PDF kann die App nicht zurücklesen)
- [ ] Sonnenverlauf als Animation über den Tag
- [ ] Grobe Kosten und CO₂ pro Variante
- [ ] Geänderte Fassade wieder als IFC speichern

## Wie es technisch gelöst wird (einfach erklärt)
- **Webseite ohne Installation:** eine `index.html` mit Aussehen (`style.css`) und Logik (`js/`).
  Läuft im Browser und später kostenlos auf GitHub Pages.
- **3D-Ansicht:** Bibliothek three.js. **IFC lesen:** Bibliothek web-ifc. Beide werden aus dem Internet geladen.
- **Fassade:** Die App liest die Außenwände aus der IFC und baut sie als eigene „Scheiben“ nach.
  So kann sie Material und Fensterlöcher frei ändern und die Flächen genau ausrechnen.
- **Materialien:** werden als Muster im echten Maßstab gezeichnet (z. B. Klinker 24 × 7,1 cm).
- **Varianten:** werden im Browser-Speicher dieses Rechners abgelegt (IndexedDB, fasst auch die Bilder).
- **Gerät:** gebaut für Laptop/Desktop, nicht für Handy oder Tablet.
- **Nutzer*innen:** du und deine Kommiliton*innen, deshalb muss die App ohne Erklärung verständlich sein.
- **Fensterflächenanteil:** Fensterfläche ÷ Fassadenfläche der jeweiligen Seite (Rohbaumaße).

## Bekannte Grenzen (bewusst in Kauf genommen)
- Gebogene oder L-förmige Wände bleiben unverändert.
- Norden ist immer Plan-oben, der Nordpfeil aus der IFC wird nicht ausgewertet.
- Ohne IFC-Datei zeigt die App nichts an (kein Beispielhaus, bewusst so entschieden).

## Tipps für den IFC-Export aus dem Entwurf
- Außenwände als Wände modellieren (nicht als Volumen/Masse), Fenster und Türen als echte Bauteile.
- Außenwände als „extern“ markieren (IsExternal), dann erkennt die App sie sicher.
- Räume mit exportieren (IfcSpace), wenn der Kennwert Fenster/Grundfläche gebraucht wird.
- Einfach halten: eine Wand pro Seite und Geschoss reicht, Details stören eher.

## Speicherstände und GitHub
- Nach jedem fertigen Feature ein Commit (Speicherstand) und gleich danach hochladen zu GitHub.
- **Geändert (17.11.):** Zwischenstände sollen laut Werkstatt doch laufend auf GitHub liegen, nicht erst ab Donnerstag.
  Repo: https://github.com/Jade-HS-Vibecoding-WPK/fassaden-tool (öffentlich, MIT-Lizenz, README von GitHub).
  Erstes Hochladen am 17.11. nach Sitzung 8. GitHub Pages (Veröffentlichung der App) kommt weiter in Sitzung 21.
- `testdaten/` wird nicht hochgeladen (Beispiel-IFC stammt von der Bundesingenieurkammer, Nutzungsbedingungen nicht geklärt).

## Sitzungsplan (ein Feature pro Sitzung)
Ablauf jeder Sitzung: `/clear` → ein Feature bauen → testen → Commit + Hochladen → Stand hier in PLAN.md festhalten.
Erledigte Sitzungen abhaken, die oberste offene Zeile ist dran (die Nummern bleiben, auch wenn Zeilen umgestellt werden).

**Mo 16.11.**
- [x] 0. PLAN.md und CLAUDE.md fertig

**Di 17.11. – Grundgerüst**
- [x] 1. Git im Projekt einrichten und erster Commit (16.11.)
- [x] 2. IFC hochladen und in 3D ansehen (16.11.)
- [x] 3. Außenwände erkennen und per Klick korrigieren (16.11.)
- [x] 4. Darstellung: Rohmodell hellgrau-weiß, Dach dunkelgrau, Zeichenstil mit Kantenlinien (16.11.)
- [x] 5. Material pro Himmelsrichtung (16.11.)

**Mi 18.11. – Must fertig, dann Should 1 + 2**
- [x] 6. Fenster pro Himmelsrichtung (Breite/Höhe in %) (16.11.)
- [x] 6b. Material: Schalter „Alle Seiten gleich“ (Wunsch der Nutzerin, wie die Oberflächen-Überschreibung in ArchiCAD) (16.11.)
- [x] 6c. Fenster: Schalter „Alle Seiten gleich“ (wie 6b, Wunsch der Nutzerin) (16.11.)
- [x] 6d. Stützen: ein Material für alle Stützen (Wunsch der Nutzerin) (16.11.)
- [x] 7. Kennwerte (Fassadenfläche, Fensterfläche, Fensterflächenanteil) (16.11.)
- [x] 8. Varianten speichern, mit 5 Bildern (Perspektive + N/O/S/W) (16.11.)
- [x] 9. Variantenvergleich nebeneinander (17.11.)
- [x] 9b. Ansichten gerade auf die Fassade, auch wenn das Gebäude im Plan gedreht ist (Wunsch der Nutzerin) (17.11.)
- [x] 10. PDF-Übersichtsseite A3 quer (17.11.)
- [x] 10b. Perspektive: Blick weniger steil von oben, und selbst einstellbar (Wunsch der Nutzerin, 17.11.)
- [x] 10c. Seitenleiste ruhiger: Nebensächliches und Erklärtexte ausklappbar (Wunsch der Nutzerin, 17.11.)
- [x] 11. Kurze Anleitung beim ersten Öffnen + IFC-Export-Hinweise → **Must komplett** (17.11.)
- [x] 12. Should 1a: einzelne Wand → anderes Material (17.11.)
- [x] 13. Should 1b: einzelnes Fenster → Maße ändern (17.11.)
- [x] 14. Should 2: Pfosten-Riegel-Fassade (17.11.)

**Do 19.11. – bis 12 Uhr fertig**
- [x] 17. Should 4a: Umschalter „realistisch“ (umgestellt 17.11., Wunsch der Nutzerin) (17.11.)
- [x] 17b. Dachmaterial wählbar (Wunsch der Nutzerin 17.11.: dunkle Dächer stechen heraus) (17.11.)
- [ ] 18. Should 4b: eigene Farbe pro Material ← **als Nächstes**
- [ ] 15. Should 3a: Sonnenstand und Schatten (nach hinten gestellt, Wunsch der Nutzerin 17.11.)
- [ ] 16. Should 3b: Standort per Ortssuche (darf notfalls wegfallen)
- [ ] 19. Should 4c: PDF-Einzelseiten (fällt als Erstes weg, wenn es eng wird)
- [ ] 20. Ab ca. 10:30: Test mit eigener IFC, Fehler beheben
- [ ] 21. Auf GitHub hochladen und über GitHub Pages veröffentlichen → **12 Uhr Freeze**
- [ ] 22. Nachmittag: README (Poster macht die Nutzerin selbst nach Moodle-Vorlage)

**Fr 20.11.** – Polieren & präsentieren, Abgabe bis 16 Uhr

Wenn es eng wird, zuerst streichen: 19 (PDF-Einzelseiten), dann 16 (Ortssuche).
Was bis Do 10:30 nicht fertig ist, wandert zu Could.

## Stand (17.11.2026, nach Sitzung 17b)
- CLAUDE.md und PLAN.md angelegt, Plan mit der Nutzerin abgestimmt.
- Test-IFC liegt in `testdaten/` (Einfamilienhaus, Revit 2023, IFC2x3: 192 Wände, 57 Fenster, 49 Türen).
  Quelle: Bundesingenieurkammer, Seite „BIM-Praxisbeispiele“ (Download zum Betrachten angeboten).
  Weder in der Datei noch auf der Seite steht eine Erlaubnis zum Weiterverbreiten. Deshalb nicht hochladen;
  wer es doch will, fragt vorher bei der Kammer (info@bingk.de) nach.
- Git ist im Projekt eingerichtet (Zweig `main`, Name Paulina Awick, Uni-E-Mail, nur für dieses Projekt hinterlegt).
- `.gitignore` schließt `testdaten/` aus. Erster Commit gemacht (Sitzung 1).
- Sitzung 2 (16.11.): IFC hochladen (Knopf oder ins Fenster ziehen) und in 3D ansehen läuft.
  Test-IFC lädt in ca. 5 s: 192 Wände, 57 Fenster, 49 Türen, 316 weitere Bauteile. Drehen/Zoomen/Verschieben geht,
  falsche Dateien (z. B. .pdf) bekommen eine verständliche Meldung.
- Früher Entwurf verschlankt: Oberfläche zeigt nur, was schon funktioniert; weitere Bereiche kommen in ihrer Sitzung dazu.
  Akzentfarbe jetzt Dunkelblau (#1f3a68). Name der App: „Fassaden-Tool“.
- Bauteile sind schon nach Art sortiert (Wand/Fenster/Tür/Rest), vorläufig nur grau eingefärbt.
- Lokaler Testserver: `.claude/launch.json` (python -m http.server 8000).
- Sitzung 3 (16.11.): Außenwände werden erkannt und blau markiert, Klick auf eine Wand schaltet außen ↔ innen,
  „Erkennung zurücksetzen“ macht alle Klicks rückgängig. Neue Datei `js/fassade.js`.
  **Entscheidung:** In der Test-IFC stehen 191 von 192 Wänden auf „IsExternal = ja“, sogar „Innenwand 13 cm“.
  Deshalb zählt eine Wand nur als Außenwand, wenn (1) die IFC nicht „nein“ sagt und (2) auf einer Seite keine
  andere Wand mehr kommt (waagerechte Sichtprüfung von 6 Punkten der Wand aus).
  Ergebnis Test-IFC: 92 von 192 Wänden außen, Erkennung dauert unter 0,1 s.
- Sitzung 4 (16.11.): Zeichenstil. Neue Datei `js/darstellung.js` mit allen Farben und den Kantenlinien.
  Rohmodell hellgrau-weiß (#eeeeec), Dach dunkelgrau (#5f6266), Fenster hellblau-grau halb durchsichtig,
  Türen hellgrau, Kantenlinien an allen Bauteilen (nur echte Kanten ab 30° Knick).
  **Entscheidung:** Linien als Mittelding: grau (#727272), leicht durchscheinend, nicht fast schwarz.
  Außenwände vorläufig in ruhigerem Blau (#5b7db3), bis in Sitzung 5 die Materialien kommen.
  Dach = IfcRoof, Decke mit Typ „Dach“ (IfcSlab ROOF) oder Decke, die zu einem IfcRoof gehört. Test-IFC: 14 Dachteile.
  Gelände = IfcSite (hell, ohne Linien). Die Kamera richtet sich jetzt auf Wände und Dach aus, nicht aufs ganze Gelände.
- Sitzung 5 (16.11.): Material pro Himmelsrichtung. Neuer Bereich „3 Fassade“: je Seite (Nord/Ost/Süd/West)
  eine Auswahlliste mit Musterbild und Anzahl der Wände. Neue Datei `js/materialien.js`.
  10 Materialien: Klinker rot/anthrazit, Holz natur/vergraut, Sichtbeton, Putz altweiß/sand,
  Fassadenplatten anthrazit/silbergrau, Glas blaugrau. Start: überall Klinker rot.
  Muster im echten Maßstab gezeichnet (Klinker 24 × 7,1 cm, Bretter 12 cm, Schaltafeln 2,50 × 0,50 m,
  Fassadenplatten 1,25 × 0,625 m, Glasfelder 1,25 × 1,50 m), Fugen etwas dunkler als die Grundfarbe.
  Nach Rückmeldung überarbeitet: Kacheln mehrere Meter groß (Klinker 4 × 2,5 m), damit sich nichts sichtbar wiederholt;
  Holz weniger gelb, Klinker rot ohne Braunstich, Klinker anthrazit heller,
  Sichtbeton ohne Ankerlöcher, „Metall“ heißt jetzt „Fassadenplatten“ (Fugenraster statt Stehfalz).
  Himmelsrichtung = Richtung der freien Außenseite der Wand, auf die nächste der 4 Richtungen gerundet (Norden = -Z = Plan-oben).
  Test-IFC: Nord 13, Ost 29, Süd 14, West 36 Außenwände. Hover zeigt einen blauen Schimmer, Klick schaltet weiter außen ↔ innen.
- Sitzung 6 (16.11.): Fenster pro Himmelsrichtung. Neuer Bereich „4 Fenster“: je Seite Regler Breite und Höhe (0–200 %, 5er-Schritte),
  Anzahl der Fenster je Seite, Textknopf „Alle Fenster auf 100 %“.
  So funktioniert es: Fenster und Türen werden ihren Wänden zugeordnet (auch beiden Schalen einer mehrschaligen Wand).
  Sobald ein Fenster nicht mehr 100 % hat, baut die App jede betroffene Wand als eigene Scheibe nach
  (Umriss der beiden Wandseiten aus der IFC, auch Giebel und schräge Ecken) und schneidet die Löcher neu aus.
  Die Original-Wand wird so lange ausgeblendet. Bei 100 % überall sieht man wieder die unveränderte IFC.
  Das Fenster wird neu gezeichnet (Rahmen + Glas, ohne Sprossen, siehe Entscheidung unten). Beim Vergrößern: 10 cm Abstand zu Wandrand
  und Nachbaröffnungen, zwei wachsende Nachbarfenster teilen sich die Lücke; sitzt ein Fenster schon in der IFC
  näher am Rand, gilt dieser Abstand. Kleiner als 100 % geht immer, 0 % = Fenster weg, Wand geschlossen.
  Neu bauen dauert ca. 80 ms, die Regler reagieren also fast sofort.
  **Änderung an der Wanderkennung:** Die Richtung einer Wand kommt jetzt aus ihren großen Seitenflächen statt aus der
  Streuung der Eckpunkte (die war bei Wänden mit vielen Fenstern leicht schief). Test-IFC jetzt 89 statt 92 Außenwände:
  Nord 14, Ost 29, Süd 11, West 35.
  Test-IFC: 54 von 57 Fenstern verstellbar (Nord 10, Ost 14, Süd 12, West 18). 3 Fenster sitzen in keiner Wand
  (vermutlich Dachfenster/Gauben). 87 von 89 Außenwänden lassen sich nachbauen.
  **Nachbesserung nach Test mit eigener ArchiCAD-IFC** (IFC4, 14 Wände, 4 Fenster; Kopie als `testdaten/Test-ArchiCAD.ifc`):
  Vorher war dort kein Fenster verstellbar. Gründe: (1) Wandrichtung durch schräge Flächen und Laibungsstufen um 2–3° verdreht,
  (2) ArchiCAD baut Laibungen mit vielen Stufen/Anschlägen, die App hielt die Wände deshalb für unregelmäßig.
  Jetzt: Richtung = die Richtung mit der meisten senkrechten Fläche (±2°); „regelmäßig“ = mindestens die Hälfte der Fläche
  liegt auf Vorder- oder Rückseite. Ergebnis: alle 4 Außenwände (36 cm) nachbaubar, alle 4 Fenster verstellbar.

- Sitzung 6b (16.11.): Schalter „Alle Seiten gleich“ im Bereich „3 Fassade“. An: nur eine Zeile „Alle“
  (mit Gesamtzahl der Außenwände), ihr Material gilt für Nord/Ost/Süd/West. Aus: wieder die vier Zeilen,
  die Auswahl je Seite bleibt im Hintergrund erhalten. „Alle“ startet beim ersten Einschalten mit dem Material
  der Nordseite und merkt sich danach die eigene Auswahl. Getestet mit `Test-ArchiCAD.ifc`: an/aus/wieder an
  stellt jeweils die richtige Auswahl her, 3D-Wände wechseln sofort, keine Fehler. Nur `app.js`, `index.html`, `style.css` geändert.
  Problem: keines. Auch der Schalter geht beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).

- Sitzung 6c (16.11.): Schalter „Alle Seiten gleich“ auch im Bereich „4 Fenster“. An: nur eine Zeile „Alle“
  (mit Gesamtzahl der Fenster) und Reglern Breite/Höhe, gilt für Nord/Ost/Süd/West. Aus: wieder die vier Zeilen,
  die Werte je Seite bleiben im Hintergrund erhalten. „Alle“ startet beim ersten Einschalten mit den Werten der Nordseite
  und merkt sich danach die eigenen. „Alle Fenster auf 100 %“ setzt auch „Alle“ zurück.
  Material- und Fenster-Schalter sind unabhängig voneinander. Getestet mit `Test-ArchiCAD.ifc`: an/aus/wieder an,
  3D-Fenster ändern sich sofort, Zurücksetzen klappt, keine Fehler. Nur `app.js` und `index.html` geändert.
  Problem: keines. Auch dieser Schalter geht beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).

- Sitzung 6d (16.11.): Stützen (IfcColumn) sind eine eigene Bauteil-Art und bekommen ein gemeinsames Material.
  Im Bereich „3 Fassade“ unter den Himmelsrichtungen eine eigene Zeile „Stützen“ (mit dünner Trennlinie, Anzahl,
  Musterbild, gleiche 10 Materialien). **Entscheidung:** Startwert Sichtbeton. Die Zeile hängt nicht am Schalter
  „Alle Seiten gleich“ und erscheint nur, wenn die IFC Stützen hat. Muster im echten Maßstab:
  Seitenflächen waagerecht entlang der Fläche, Ober-/Unterseite in Draufsicht. Statuszeile nennt jetzt auch die Stützen.
  Getestet: `Test-ArchiCAD.ifc` 4 runde Stützen, Einfamilienhaus (Revit) 8 Stützen; Materialwechsel sofort sichtbar,
  Schalter an/aus lässt die Zeile stehen, keine Fehler. Geändert: `ifc.js`, `fassade.js`, `darstellung.js`, `app.js`, `index.html`, `style.css`.
  Probleme: Bei runden Stützen kann das Muster an einer Stelle einen kleinen Versatz haben (fällt bei Beton/Putz nicht auf,
  bei Klinker/Holz evtl. schon). Das Ausblenden der Zeile ohne Stützen ist nicht getestet, da beide Test-IFCs Stützen haben.
  Auch die Stützenwahl geht beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).

- Sitzung 7 (16.11.): Neuer Bereich „5 Kennwerte“ mit Tabelle Nord/Ost/Süd/West + Gesamt: Fassadenfläche,
  Fensterfläche (m², 0,1 genau) und Fensterflächenanteil (ganze %). Rechnet sofort neu bei Reglern,
  „Alle Seiten gleich“, Zurücksetzen und Klick auf eine Wand (außen ↔ innen).
  So wird gerechnet: Fassade = Umriss der Außenseite jeder Außenwand (mit Giebel, Öffnungen mitgezählt);
  gebogene/L-förmige Wände ohne Umriss: Länge × Höhe. Fenster = aktuelle Lochgröße (nach Regler),
  jede Öffnung nur einmal (in ihrer Außenwand). Glastür: die durchsichtigen Teile der Tür (Transparenz aus der IFC)
  decken in der Ansicht mindestens die Hälfte der Türöffnung ab, dann zählt die ganze Öffnung als Fenster.
  Getestet: `Test-ArchiCAD.ifc` gesamt 83,1 m² Fassade, 15,5 m² Fenster, 19 % (West 48 % wegen großer Glasfront,
  wird richtig als Glastür erkannt). Regler Nord 0 % / 200 % / zurück ändert die Werte richtig. Einfamilienhaus (Revit):
  831,5 m² Fassade, 139,0 m² Fenster, 17 %. Keine Fehler. Geändert: `ifc.js`, `fassade.js`, `app.js`, `index.html`, `style.css`.
  Probleme: Die Kennwerte sind nur so gut wie die Außenwand-Erkennung. Im Einfamilienhaus zählen Kellerwände,
  Schornstein- und Gaubenwände sowie einige dünne Dachgeschoss-Wände (13 cm, vermutlich Innenwände) mit,
  dadurch sind Fassade und Fenster dort zu groß; per Klick korrigierbar. Revit-Innentüren mit großem Glaseinsatz
  (ca. 54 % Glas) zählen als Glastür, wenn sie in einer Wand sitzen, die als Außenwand gilt.
  Mehrschalige Wände: Gelten beide Schalen als außen, wird die Fläche doppelt gezählt (Schale per Klick abschalten).

- Sitzung 8 (16.11.): Neuer Bereich „6 Varianten“: Namensfeld (leer = „Variante 1, 2 …“), Hauptbutton
  „Variante speichern“, darunter die Liste (neueste oben) mit Vorschaubild, Name, Datum, Fensteranteil
  und den Textknöpfen „Laden“ / „Löschen“ (mit Sicherheitsfrage). Neue Datei `js/varianten.js`.
  Gespeichert werden: alle Einstellungen (Material je Seite, Stützen, beide Schalter „Alle Seiten gleich“ samt
  Werten im Hintergrund, Fenster je Seite, Wand-Klicks als Liste der umgeschalteten Wände), die Kennwerte und 5 Bilder.
  **Entscheidungen (mit der Nutzerin):** Ansichten N/O/S/W als Parallelprojektion (wie eine gezeichnete Ansicht),
  Perspektive schräg von oben aus Südosten; beides aus fester Kamera, unabhängig vom aktuellen Blick.
  „Laden“ stellt alle Einstellungen wieder her. Varianten gehören zur IFC-Datei (Dateiname + Anzahl Wände).
  Speicher: IndexedDB statt localStorage (localStorage hätte nur für ca. 10 Varianten gereicht).
  Bilder: 1500 × 1000 Pixel, JPEG, ohne blauen Hover-Schimmer. Die Perspektive passt sich den sichtbaren Bauteilen an
  (Haus mittig, füllt ca. 90 % der Bildhöhe), die Ansichten der Gebäudebox (Wände + Dach).
  Getestet: `Test-ArchiCAD.ifc` speichern, verstellen, laden → Kennwerte, Material, Regler, Schalter und
  Wand-Klick (4 → 3 Außenwände) wieder genau wie gespeichert; bleibt nach Neuladen der Seite erhalten; Löschen klappt.
  Einfamilienhaus (Revit): Speichern 0,5 s, ca. 470 KB pro Variante (Platz für sehr viele Varianten). Keine Fehler.
  Geändert: `szene.js`, `app.js`, `index.html`, `style.css`, neu `varianten.js`.
  Probleme: `toBlob` brauchte im Test-Browser ca. 1 s pro Bild, deshalb jetzt `toDataURL` (ca. 20 ms).
  In den Ansichten erscheinen Gelände/Modellplatte und Treppen vor der Fassade mit (wie in einer echten Ansicht).
  Varianten erkennen „ihr“ Modell am Dateinamen: Wird die IFC umbenannt, ist die Liste leer;
  wird sie unter gleichem Namen neu exportiert, können die Wand-Klicks auf andere Wände fallen (Wand-Nummern ändern sich).
  Die Varianten gibt es nur in diesem Browser auf diesem Rechner (Arbeitsdatei sichern = Could).

- Sitzung 9 (17.11.): Variantenvergleich. In der Variantenliste hat jede Variante ein Kästchen zum Ankreuzen;
  ab 2 Kreuzen erscheint unter der Liste der Textknopf „… Varianten vergleichen“. **Höchstens 4** (wie später das PDF A3 quer),
  danach sind die übrigen Kästchen gesperrt. Gelöschte Varianten fallen aus der Auswahl.
  Der Vergleich liegt als eigene weiße Ansicht über der ganzen App (mehr Platz als nur der 3D-Bereich),
  eine Spalte je Variante, älteste links. Zeilen auf gleicher Höhe: Name + Datum (bleibt beim Scrollen oben),
  Perspektive, Ansichten N/O/S/W (2 × 2), Material je Seite + Stützen (mit Musterbild; bei „Alle Seiten gleich“
  das tatsächlich geltende Material), Fenster je Seite (Breite/Höhe in %, „zu (0 %)“), Kennwerte je Seite + Gesamt.
  Klick auf ein Bild zeigt es groß, Esc oder Klick schließt es; „Schließen“ oder Esc schließt den Vergleich.
  Unterschiede werden bewusst nicht farbig markiert. Die Zeile „Stützen“ gibt es nur, wenn das Modell Stützen hat.
  Getestet mit `Test-ArchiCAD.ifc`: 3 und 4 Varianten nebeneinander, Sperre beim 5. Kästchen, großes Bild, Esc,
  Löschen angekreuzter Varianten. Keine Fehler. Geändert: `app.js`, `index.html`, `style.css`.
  Nebenbei behoben: „Variante speichern“ baut die Fenster vor dem Speichern einmal neu. Vorher konnten die Kennwerte
  veraltet sein, wenn direkt nach einer Reglerbewegung gespeichert wurde (fiel nur beim sehr schnellen Testskript auf).
  Probleme: keine. Die Auswahl der Kästchen wird nicht gespeichert (nach Neuladen der Seite leer).

- Sitzung 9b (17.11.): Ansichten gerade auf die Fassade. Die App bestimmt beim Speichern, um wie viel Grad das Gebäude
  im Plan gedreht ist (Richtung aller Außenwände, große Wände zählen mehr), und dreht die Kameras für die 4 Ansichten
  und die Perspektive mit. Der Bildausschnitt jeder Ansicht wird in der gedrehten Richtung gemessen, damit nichts abgeschnitten wird.
  Die Drehung wird mit der Variante gespeichert. Im Vergleich steht auf den kleinen Bildern z. B. „N (NNW)“,
  im großen Bild „Ansicht Nord – zeigt nach Nordnordwest“ (16 Himmelsrichtungen, je 22,5°). Kaum gedreht (unter ca. 11°): nur „N“.
  Ältere Varianten behalten ihre alten Bilder und ihre alte Beschriftung.
  Getestet: `Test-ArchiCAD.ifc` ist um ca. 19° gedreht (Nord zeigt nach NNW), Einfamilienhaus (Revit) um ca. 32°;
  in beiden Fällen sind alle 4 Ansichten gerade (Giebel symmetrisch, keine zweite Seite sichtbar). Keine Fehler.
  Geändert: `fassade.js`, `szene.js`, `app.js`, `style.css`.
  Probleme: Bei einem Gebäude, das fast genau 45° gedreht ist, ist die Einteilung der Wände in Nord/Ost/Süd/West
  nicht eindeutig (gab es vorher auch schon). Die Kamera beim Öffnen der Datei (3D-Bereich) bleibt ungedreht aus Südosten.

- Sitzung 10 (17.11.): PDF-Übersichtsseite A3 quer. Neue Datei `js/pdf.js`, Bibliothek jsPDF 2.5.2 (wird erst beim
  ersten Klick aus dem Internet geladen). Unter der Variantenliste: Hinweis, ab 1 Kreuz ein Feld „Standort fürs PDF“
  und der Textknopf „Als PDF speichern“; ab 2 Kreuzen zusätzlich „Vergleichen“. Im Vergleichsfenster ein Knopf
  „Als PDF speichern“ neben „Schließen“ (nimmt dieselbe Auswahl und denselben Standort).
  Die Datei landet direkt im Download-Ordner: `Fassadenvariante_<Modell>_<Datum>.pdf` (1 Variante) bzw.
  `Variantenvergleich_<Modell>_<Datum>.pdf`. Blatt: Kopf mit Titel, Modell, Standort (nur wenn eingetragen), Datum;
  **kein Nordpfeil** (gestrichen nach Test, Wunsch der Nutzerin: gehört nicht zu Ansichten und Perspektive); eine Spalte je Variante (älteste links) mit Name, Datum, Perspektive, 4 Ansichten (Kennzeichen wie im
  Vergleich, z. B. „N (NNW)“) und Kennwerte; unten eine Fußzeile mit den Erklärungen.
  **Geändert (17.11., Wunsch der Nutzerin):** Material und Fenstergrößen stehen nicht auf dem PDF (die Bilder zeigen sie),
  dadurch sind die Bilder größer. Anordnung je nach Anzahl: 1 Variante = großes Bild, Ansichten in einer Reihe darunter,
  Kennwerte rechts; 2 = Ansichten in einer Reihe; 3 und 4 = Ansichten 2 × 2; Kennwerte jeweils darunter.
  Zu lange Namen werden mit „…“ gekürzt. Schrift Helvetica.
  Getestet mit `Test-ArchiCAD.ifc` und 1, 2, 3 und 4 Varianten: alles passt aufs Blatt, Umlaute und m² stimmen,
  Knopf in der Liste und im Vergleich erzeugen die Datei, keine Fehler. Ca. 300 KB pro Variante.
  Geändert: `app.js`, `index.html`, `style.css`, neu `pdf.js`.
  Probleme: Bei 4 Varianten bleibt unten etwas Weißraum (die Spalten sind schmal, die Bilder können nicht breiter werden).
  **Nachtrag (17.11.):** Schalter „Kennwerte aufs PDF“ (Start: an) unter dem Standortfeld; aus = nur Bilder, die Bilder
  werden dann größer, die Fußzeile nennt nur noch die Ansichten. Gilt auch für den Knopf im Vergleich.
  Der Browser hatte nach der Änderung noch die alte `pdf.js` (mit Nordpfeil) im Zwischenspeicher, auch nach Strg+Umschalt+R.
  Deshalb jetzt Versionsnummern: `js/app.js?v=10` in `index.html` und `./pdf.js?v=10b` in `app.js`.
  **Regel:** Nach Änderungen an einer JS-Datei die Nummer an ihrem Import erhöhen.
  Beim Testen hing ein Testskript im Browser-Fenster der App fest und hat den Download abgefangen (Meldung „gespeichert“,
  aber keine Datei). Behoben; nach eigenen Testskripten die Seite neu laden bzw. die Änderung zurücknehmen.
  Der Standort wird nicht gespeichert (nach Neuladen der Seite leer). Sonderzeichen außerhalb des westeuropäischen
  Zeichensatzes (z. B. Emojis) im Variantennamen erscheinen im PDF falsch. Ohne Internet kein PDF (Meldung erscheint).

- Sitzung 10b (17.11.): Perspektive einstellbar. Im Bereich „6 Varianten“ über dem Namensfeld: Auswahl „Blick aus“
  (Nordost, Südost, Südwest, Nordwest; Start Südost) und Regler „Blickhöhe“ 0–45° in 5er-Schritten (Start 15°, vorher fest ca. 26°).
  Beim Verstellen springt das 3D-Fenster auf genau diesen Blick (danach wieder frei drehbar); gespeichert wird immer
  der eingestellte Blick, nicht der aktuelle im 3D-Fenster. Ist das Gebäude im Plan gedreht, dreht sich der Blick mit (wie die Ansichten).
  Der Blick wird mit der Variante gespeichert, „Laden“ stellt ihn wieder ein. Ältere Varianten behalten ihre Bilder und
  gelten als „aus Südosten, ca. 26°“ (Laden lässt dort die Einstellung, wie sie ist).
  Vergleich: Kennzeichen auf der Perspektive, z. B. „SW · 5°“, im großen Bild „Perspektive aus Südwesten, 5°“.
  PDF: dieselbe lange Beschriftung oben links auf der Perspektive; in der Fußzeile steht statt „Perspektive aus Südosten“
  jetzt „Blickhöhe der Perspektive in Grad über der Waagerechten“.
  Getestet mit `Test-ArchiCAD.ifc`: Varianten mit SW 5° und NO 40° gespeichert, mit alter „Variante 1“ verglichen,
  PDF-Knopf im Vergleich (Texte geprüft), Laden stellt Auswahl und Regler richtig ein. Testvarianten wieder gelöscht. Keine Fehler.
  Geändert: `szene.js` (Kamera-Einpassen als eigener Baustein), `app.js`, `pdf.js`, `index.html`, `style.css`.
  Versionsnummern: `app.js?v=11`, `szene.js?v=11`, `pdf.js?v=11`.
  Probleme: Die Kamera beim Öffnen einer IFC nutzt noch den alten festen Blick (Südost, ca. 26°), bis man den Regler bewegt.
  Bei 0° liegt die Kamera auf halber Gebäudehöhe, nicht auf Augenhöhe eines Menschen. Das PDF-Blatt selbst wurde nur
  über seine Texte geprüft, nicht als Bild angesehen.

- Sitzung 10c (17.11.): Seitenleiste ruhiger. Alle grauen Erklärtexte in den Bereichen 2–6 sind zugeklappt hinter einem
  kleinen grauen Textknopf „Erklärung ▸“ (aufgeklappt „▾“, Hover dunkelblau). In Bereich 6 gibt es zwei davon
  (zum Blick und zum Speichern), jeweils direkt unter dem, was sie erklären. Bereich 1 zeigt nach dem Laden nur noch
  den Dateinamen, die Bauteil-Anzahlen stehen zugeklappt unter „Bauteile ▸“. Start: alles zugeklappt.
  Immer sichtbar bleiben: Fehler- und Statusmeldungen, die Zahl der Außenwände, „… oder die Datei einfach ins Fenster ziehen“,
  der Hinweis zum Ankreuzen unter der Variantenliste und die Startseite ohne Modell.
  Technik: eingebautes Ausklapp-Element des Browsers (`<details>`), fast ohne JavaScript.
  Getestet mit `Test-ArchiCAD.ifc`: alles startet zugeklappt, Auf- und Zuklappen klappt, keine Fehler.
  Geändert: `index.html`, `style.css`, `app.js`. Versionsnummern: `app.js?v=12`, neu auch `style.css?v=12b`.
  Probleme: keine. Ob etwas aufgeklappt ist, merkt sich die App nicht (nach Neuladen wieder zu).
  **Geändert nach Test (17.11., Wunsch der Nutzerin):** Bei „5 Kennwerte“ und „6 Varianten“ sind die Erklärungen ganz entfernt
  (auch nicht ausklappbar), damit die Leiste nicht zu voll wird. Ausklappbare Erklärungen gibt es nur noch in den Bereichen 2–4.
  Etwas mehr Abstand zwischen „Blickhöhe“ und Namensfeld.
  **Nochmals geändert (Wunsch der Nutzerin):** Das Wort „Erklärung“ ist weg, zum Aufklappen gibt es nur noch die kleine Ecke ▸/▾
  (etwas größer, wird beim Daraufzeigen blau, Tooltip „Erklärung aufklappen“). „Bauteile ▸“ in Bereich 1 behält sein Wort.
  Versionsnummer jetzt `style.css?v=12f`.

- Sitzung 11 (17.11.): Anleitung als Startseite im 3D-Bereich (ersetzt „Noch kein Modell geladen“): Titel „So geht’s“,
  kurzer Satz (alles bleibt im Browser), 4 Schritte mit blauer Nummer: IFC laden · Außenwände prüfen · Gestalten · Vergleichen.
  Darunter aufklappbar „IFC-Export – Tipps ▸“ mit drei Spalten Allgemein / Revit / ArchiCAD (Menüweg, IFC-Version,
  Wände als „außen“ kennzeichnen: Revit Wandtyp „Funktion = Außen“, ArchiCAD „Position = Außen“) und dem Hinweis,
  dass Menüs je nach Version anders heißen. Nach dem Laden einer IFC verschwindet die Anleitung; oben in der Seitenleiste
  erscheint der Textknopf „Anleitung“ (wird zu „Anleitung schließen“). Mit Modell liegt die Anleitung weiß über dem
  3D-Fenster, schließen mit „Zurück zum Modell“, dem Textknopf oder Esc. „IFC wird gelesen …“ liegt über der Anleitung.
  Getestet (Browser 1440 × 900) mit `Test-ArchiCAD.ifc`: Startseite, Aufklappen, Laden, Öffnen/Schließen auf allen drei Wegen. Keine Fehler.
  Geändert: `index.html`, `style.css`, `app.js`. Versionsnummern: `app.js?v=13`, `style.css?v=13`.
  Probleme: Die Menüwege für Revit/ArchiCAD sind aus dem Gedächtnis, nicht im Programm nachgeprüft – bitte einmal mit
  der eigenen Programmversion vergleichen. Im schmalen Fenster (unter 1000 px) stehen die drei Spalten untereinander.

- Sitzung 12 (17.11.): Einzelne Wand → anderes Material. Im Bereich „3 Fassade“ unter der Materialwahl (mit dünner Trennlinie)
  der Schalter „Einzelne Wände“. Aus: Klick schaltet wie bisher außen ↔ innen. An: nur Außenwände lassen sich anfahren;
  Klick wählt eine Wand, Umschalt + Klick nimmt weitere dazu bzw. wieder heraus, Klick ins Leere oder auf die einzige
  gewählte Wand hebt die Auswahl auf. Gewählte Wände sind deutlich blau getönt (stärker als der Hover-Schimmer).
  Darunter „1 Wand gewählt.“ und die Zeile „Auswahl“ mit Musterbild und Liste: „wie die Seite“ + die 10 Materialien;
  haben die gewählten Wände Verschiedenes, steht „– verschieden –“. Textknopf „Einzelne Wände zurücksetzen (n Wände)“
  erscheint, sobald eine Wand ein eigenes Material hat. Erklärung ausklappbar (▸). Ausschalten hebt die Auswahl auf,
  die eigenen Materialien bleiben. Eigenes Material bleibt auch bei Änderung der Seite oder „Alle Seiten gleich“.
  Gespeichert mit der Variante (Liste Wand-Nummer → Material), „Laden“ stellt es wieder her; ältere Varianten: keine.
  Vor dem Fotografieren wird die Auswahl aufgehoben (keine blaue Wand auf den Bildern). Vergleich: neue Zeile
  „Einzelne Wände“ (z. B. „1 Wand Holz natur“), nur wenn eine der Varianten welche hat. PDF unverändert (zeigt es über die Bilder).
  Neues Modell laden löscht die eigenen Materialien.
  Getestet mit `Test-ArchiCAD.ifc`: Auswahl, Umschalt-Klick, „verschieden“, Seitenmaterial ändern, „wie die Seite“,
  Zurücksetzen, Speichern → Zurücksetzen → Laden, Vergleich, Schalter aus = außen/innen wie bisher. Testvariante wieder gelöscht.
  Geändert: `app.js`, `fassade.js`, `materialien.js`, `szene.js` (meldet jetzt auch Klicks ins Leere), `index.html`, `style.css`.
  Versionsnummern: `app.js?v=14b`, `fassade.js?v=14b`, `materialien.js?v=14b` (in `app.js` und `fassade.js` gleich!), `szene.js?v=14`, `style.css?v=14`.
  Probleme: Die Zuordnung hängt an der Wand-Nummer aus der IFC – wird die IFC neu exportiert, können eigene Materialien
  auf anderen Wänden landen (wie bei den Wand-Klicks). Bei mehrschaligen Wänden bekommt nur die angeklickte Schale das Material.
  Mit echter Maus noch nicht ausprobiert (Test lief über künstliche Klicks) – bitte einmal selbst klicken, auch Umschalt + Klick.
  **Geändert nach Test (Wunsch der Nutzerin):** Ohne Auswahl steht unter dem Schalter keine Kurzanleitung mehr,
  nur die ausklappbare Erklärung (▸); „n Wände gewählt.“ erscheint erst, wenn etwas ausgewählt ist. Versionsnummer `app.js?v=14c`.
  Von der Nutzerin mit dem Einfamilienhaus ausprobiert: passt. Erklärung auf einen Satz gekürzt:
  „Wand anklicken, Umschalt + Klick für mehrere.“

- Sitzung 13 (17.11.): Einzelnes Fenster → Maße ändern. Im Bereich „4 Fenster“ unter „Alle Fenster auf 100 %“ (mit dünner Trennlinie)
  der Schalter „Einzelne Fenster“. Ist er an, geht „Einzelne Wände“ aus und umgekehrt. An: nur verstellbare Fenster
  (in nachbaubaren Außenwänden) lassen sich anfahren (heller blauer Schimmer); Klick wählt, Umschalt + Klick nimmt dazu/heraus,
  Klick ins Leere hebt die Auswahl auf. Gewählte Fenster: Glas blau, Rahmen dunkelblau.
  Darunter „n Fenster gewählt.“ und zwei Felder Breite / Höhe in cm (aktuelle Größe, gerundet auf ganze cm);
  bei verschiedenen Maßen leer mit „verschieden“. Übernommen wird beim Bestätigen (Eingabetaste, Feld verlassen, Pfeile);
  eine Eingabe ändert nur dieses Maß, das andere bleibt, wie das Fenster gerade ist. 0 = Fenster zu.
  Passt das Maß nicht (10 cm Abstand zu Wandrand/Nachbaröffnung), baut die App so groß wie möglich, das Feld zeigt das
  tatsächliche Maß und darunter steht „Größer passt hier nicht …“. Textknöpfe „wie die Seite“ (für die Auswahl) und
  „Einzelne Fenster zurücksetzen (n Fenster)“. Eigenes Maß bleibt bei Reglern der Seite und „Alle Seiten gleich“.
  Gespeichert mit der Variante (Liste Fenster-Nummer → Breite/Höhe in cm), „Laden“ stellt es wieder her; ältere Varianten: keine.
  Vor dem Fotografieren wird die Auswahl aufgehoben. Vergleich: neue Zeile „Einzelne Fenster“ unter den Fenstern
  (z. B. „1 Fenster 150 × 120 cm“), nur wenn eine der Varianten welche hat. Neues Modell laden löscht die eigenen Maße.
  Getestet mit `Test-ArchiCAD.ifc`: echter Mausklick und Umschalt + Klick, Eingabe 200 cm (Kennwerte Süd 1,0 → 2,0 m²),
  900 cm → 430 cm mit Hinweis, Regler Süd 50 % lässt das eigene Maß stehen, Höhe 0 = zu, zwei Fenster „verschieden“,
  Speichern → Zurücksetzen → Laden, Vergleich, Schalter schließen sich gegenseitig aus. Testvariante wieder gelöscht. Keine Fehler.
  Geändert: `app.js`, `fassade.js`, `darstellung.js` (Farben für Hover/Auswahl der Fenster), `szene.js` (findet auch neu
  gezeichnete Fenster beim Anklicken), `index.html`, `style.css`.
  Versionsnummern alle auf `v=15`: `app.js`, `szene.js`, `ifc.js`, `fassade.js`, `materialien.js`, `darstellung.js`
  (in `ifc.js`, `fassade.js`, `materialien.js` gleich!), `style.css`.
  Probleme: Die Zuordnung hängt an der Fenster-Nummer aus der IFC (wie bei den Wänden: nach neuem Export evtl. falsche Fenster).
  Türen und Fenster in gebogenen/L-förmigen Wänden lassen sich nicht einzeln ändern. Der Browser im Test hatte die alte
  `index.html` im Zwischenspeicher – falls der Schalter fehlt: Strg+Umschalt+R. Mit echter Maus nur kurz ausprobiert.
  **Geändert (Wunsch der Nutzerin):** In der ausklappbaren Erklärung zu „Einzelne Fenster“ steht kein „0 = Fenster zu“ mehr.

- Sitzung 14 (17.11.): Pfosten-Riegel-Fassade. Neues Material „Pfosten-Riegel“ in der Liste jeder Himmelsrichtung, bei „Alle“
  und bei „Einzelne Wände“ (nicht bei den Stützen). Darunter erscheint die Zeile „Felder [8] breit [3] hoch“ (1–40 × 1–20,
  übernommen beim Bestätigen); die Felder gelten je Wand. Für „Alle“ und jede einzelne Wand gibt es eigene Felder
  (eine einzelne Wand startet mit den Feldern ihrer Seite; bei mehreren gewählten Wänden mit Verschiedenem steht „versch.“).
  So wird gebaut: Die Außenwand wird ausgeblendet und durch Glas im Umriss ihrer Außenseite ersetzt (auch Giebel),
  ringsum ein Rahmenprofil entlang jeder Umrisskante, innen Pfosten und Riegel gleichmäßig verteilt.
  Profile 5 cm breit, 15 cm tief (höchstens Wanddicke), bündig mit der Außenseite der Wand; Glas in der Mitte der Profile.
  Fenster **und Türen** in dieser Wand verschwinden. Riegel werden über die ganze Wandhöhe verteilt (auch in den Giebel).
  Fenster-Regler einer Pfosten-Riegel-Seite sind grau und gesperrt, statt „n Fenster“ steht „Pfosten-Riegel“
  (bei „Alle“ nur, wenn alle vier Seiten Pfosten-Riegel haben). Kennwerte: die ganze Wandfläche zählt als Fenster,
  Öffnungen darin zählen nicht noch einmal. Hover und Auswahl färben Glas und Profile wie bei den Fenstern.
  **Farbe (Wunsch der Nutzerin):** Dach, Fensterrahmen und Pfosten/Riegel jetzt gemeinsam Anthrazit #3a3d42 (`PROFILFARBE` in `darstellung.js`).
  Gespeichert mit der Variante (Felder je Seite, „Alle“, je Wand), „Laden“ stellt es wieder her; ältere Varianten: 8 × 3.
  Vergleich: Material z. B. „Pfosten-Riegel 4 × 2 Felder“, bei den Fenstern „ganz verglast (Pfosten-Riegel)“.
  Getestet mit `Test-ArchiCAD.ifc`: Süd 8 × 3 → 4 × 2 (Süd 14,8 m² Fassade = 14,8 m² Fenster, 100 %), „Alle Seiten gleich“ an/aus,
  alle Seiten Pfosten-Riegel, Westgiebel per Mausklick einzeln 3 × 3 (folgt dem Giebel), Speichern → Zurücksetzen → Laden
  (Kennwerte und Felder wieder gleich), Vergleich, gespeichertes Bild ohne blaue Auswahl. Testvariante wieder gelöscht.
  Einfamilienhaus (Revit): alle Seiten Pfosten-Riegel in 0,17 s, keine Fehler.
  Geändert: `fassade.js`, `materialien.js`, `darstellung.js`, `app.js`, `index.html`, `style.css`.
  Versionsnummern: `app.js`, `ifc.js`, `fassade.js`, `materialien.js`, `darstellung.js`, `style.css` alle auf `v=16`.
  Probleme: Gebogene/L-förmige Wände bekommen nur ein Muster (Glas mit gezeichnetem Raster), zählen aber auch als Fenster.
  Bei mehrschaligen Wänden blieb die innere Schale zunächst stehen (behoben, s. u. „Gitterkästen weg“).
  Riegel liegen je Wand auf eigener Höhe (bei verschieden hohen Nachbarwänden derselben Seite nicht auf einer Linie).
  Hinter der Glaswand sieht man Deckenkanten und Innenraum (wie ein Arbeitsmodell). Mit echter Maus nur ein Klick getestet.
  **Geändert nach Test (Wunsch der Nutzerin):**
  (1) **Oberlicht:** Die oberste Feldreihe jeder Wand ist halb so hoch wie die anderen („Felder hoch“ zählt sie mit,
  bei 1 gibt es kein Oberlicht). Bei Giebelwänden liegt das Oberlicht in der Giebelspitze.
  (2) **Gitterkästen weg:** Im Einfamilienhaus (Westseite) wurden kurze, 37 cm hohe Wandstücke über den Fenstern
  (13 cm, liegen in der Dicke der Außenwand) selbst zu kleinen Pfosten-Riegel-Kästen. Neu (`anbauteileZuordnen` in `fassade.js`):
  Kleinere Wände und sonstige Bauteile, die ganz in einer Wand stecken oder bis 30 cm davor/dahinter sitzen
  (geprüft an den echten Eckpunkten, weil Gebäude gedreht sein können), verschwinden mit ihr, wenn sie zur Glaswand wird.
  Dadurch verschwindet auch die innere Schale mehrschaliger Wände mit. Kennwerte bleiben gleich (die Wandstücke zählen
  wie bisher zur Fassadenfläche). Einfamilienhaus West: 8 Wandstücke + 4 weitere Wände und 8 sonstige Bauteile ausgeblendet.
  Getestet mit beiden IFCs, keine Fehler. Versionsnummern: `fassade.js?v=17c` (in `app.js`), `app.js?v=17d` (in `index.html`).
  **Fehler behoben (17.11., neue Test-IFC der Nutzerin):** Eine neue ArchiCAD-IFC (IFC4 Reference View, 16 Wände, 26 Fenster,
  alle Wände „außen“; Kopie als `testdaten/Test-Neu.ifc`) zeigte „0 von 16 Wänden sind Außenwände“.
  Ursache: Export-Option „Komplexe Elemente aufteilen: An“. Die Wand selbst hat dann keine Form, die steckt in ihren
  Schichten (je Wand 5 × IfcBuildingElementPart); die App sah leere Wände und hielt die Schichten für „weitere Bauteile“.
  Jetzt: `ifc.js` setzt die Schichten wieder zur Wand zusammen (nur Schichten von Wänden; Schichten von Decken bleiben, wie sie sind),
  leere Formen werden übersprungen. `fassade.js`: Eine Wand gilt als nachbaubar, wenn mindestens die Hälfte ihrer Fläche
  parallel zur Wand liegt – auch die Trennflächen zwischen den Schichten zählen (vorher nur Vorder- und Rückseite).
  Ergebnis neue IFC: 16 von 16 Außenwänden, alle nachbaubar, alle 26 Fenster verstellbar, Pfosten-Riegel und Holz klappen.
  Gegenprobe: `Test-ArchiCAD.ifc` (4 von 14, 4 nachbaubar, 83,1 m² / 15,5 m²) und Einfamilienhaus (89 von 192, 87 nachbaubar,
  831,5 m² / 139,0 m²) genau wie vorher. Keine Fehler.
  Versionsnummern: `ifc.js?v=17`, `fassade.js?v=17e` (in `app.js`), `app.js?v=17f` (in `index.html`).
  Hinweis: Die Wand-Nummern sind jetzt die der ganzen Wand (nicht der Schichten) – bei Modellen mit Schichten
  waren vorher ohnehin keine Varianten mit Wand-Klicks möglich.
- Sitzung 17 (17.11.): Umschalter „Zeichnung | Realistisch“ oben rechts im 3D-Fenster (erscheint, sobald ein Modell geladen ist).
  Neue Datei `js/realistisch.js`: tauscht für jedes Bild im 3D-Fenster kurz alle Materialien gegen „echte“
  (three.js MeshStandardMaterial), blendet die Kantenlinien aus, setzt Himmelsverlauf als Hintergrund und eine
  vorberechnete Himmelskugel für Spiegelungen, stellt die Sonne tiefer von Südwesten (Licht- und Schattenseiten)
  und belichtet weich (ACES), damit helle Decken nicht ausbrennen – danach sofort alles zurück.
  Dadurch arbeiten Hervorheben, Auswahl und das Speichern unverändert weiter; **gespeicherte Bilder, Vergleich und PDF
  bleiben im Zeichenstil** (geprüft: gespeichertes Bild weiß mit Linien, obwohl „realistisch“ an war).
  `materialien.js`: eigene, feinere Muster je Material (durchgehende Mörtelfugen und Farbunterschiede je Stein,
  Holzmaserung mit Ästen und Schattenfuge, Beton mit Poren und Ankerlöchern, raue Putzkörnung, Platten mit Fugen,
  Glas dunkler und spiegelnd) plus Reliefbild (Fugen vertieft). Der Zeichenstil ist unverändert.
  Rohmodell bleibt hellgrau, Fenster spiegeln den Himmel, Rahmen/Pfosten leicht glänzend.
  Ruckel-Test Einfamilienhaus: Zeichnung ca. 44 Bilder/s, realistisch ca. 60 (keine Linien).
  Getestet mit `Test-Neu.ifc` und Einfamilienhaus, keine Fehler. Die Wahl wird nicht gespeichert (beim Neuladen „Zeichnung“).
  Versionsnummern: `materialien.js?v=18` (in `app.js`, `fassade.js`, `realistisch.js`), `realistisch.js?v=18`,
  `szene.js?v=18b`, `fassade.js?v=18`, `app.js?v=18b`, `style.css?v=18`.
  Hinweis: Beim Testen ist im eingebauten Browser von Claude eine Test-Variante „Variante 1“ zum Einfamilienhaus entstanden
  (nicht in deinem normalen Browser).
- Sitzung 17b (17.11.): Dachmaterial wählbar. Im Bereich „3 Fassade“ unter „Stützen“ die Zeile **„Dach“** (Anzahl Dachteile,
  Musterbild, Liste), ein Material für alle Dachteile; erscheint nur, wenn die IFC ein Dach hat. Trennlinie wie bei „Stützen“
  (stehen beide da, nur eine Linie). 6 Dachmaterialien (eigene Liste `DACHMATERIALIEN` in `materialien.js`, nicht bei den Wänden):
  **Schlicht hell** (Abdichtung, Start), Ziegel rot, Ziegel anthrazit, Stehfalz hellgrau, Stehfalz anthrazit, Gründach.
  Muster im echten Maßstab: Ziegel 30 cm × Lattung 33,3 cm, Reihen versetzt, Schattenband unter jeder Reihe;
  Stehfalz Bahnen 50 cm; Abdichtung Bahnenstöße alle 1 m ganz zart; Gründach Sedum-Flecken. Je eine Fassung für „realistisch“
  (Ziegel mit Relief zur Unterkante, Stehfalz glänzend mit erhabenem Falz, Gründach rau).
  So liegt das Muster (`dachVorbereiten` in `fassade.js`): je Dreieck nach seiner Neigung – geneigt: Reihen parallel zur Traufe,
  Falze die Schräge hinunter (auch auf Walmflächen); flach: Draufsicht (Norden oben); senkrecht (Ortgang, Attika): wie eine Wand.
  **Fensterrahmen und Pfosten/Riegel bleiben anthrazit**, unabhängig vom Dach.
  Gespeichert mit der Variante, „Laden“ stellt es wieder her; ältere Varianten: „Schlicht hell“. Vergleich: neue Zeile „Dach“
  unter „Stützen“ (nur, wenn das Modell ein Dach hat). Bilder/PDF zeigen es automatisch (Zeichenstil).
  Das Dachmaterial bleibt beim Öffnen einer anderen IFC stehen (wie die Materialien der Seiten).
  Getestet: Einfamilienhaus (14 Dachteile, Walmdach mit Gauben) alle Materialien, Zeichnung und realistisch, Speichern → Umstellen →
  Laden, Vergleich mit älterer Variante; `Test-ArchiCAD.ifc` (8 Dachteile, Satteldach) mit Stützen- und Dachzeile. Testvariante wieder gelöscht. Keine Fehler.
  Geändert: `materialien.js`, `fassade.js`, `darstellung.js`, `app.js`, `index.html`, `style.css`.
  Versionsnummern: `darstellung.js?v=19` (in `ifc.js`, `fassade.js`, `materialien.js`, `realistisch.js`), `ifc.js?v=19`,
  `materialien.js?v=19b` (in `app.js`, `fassade.js`, `realistisch.js`), `fassade.js`/`realistisch.js`/`szene.js`/`app.js` `v=19b`, `style.css?v=19`.
  Probleme: Gründach und Ziegel liegen auch auf sehr steilen oder flachen Flächen (keine Prüfung, ob das baulich passt).
  Auf Flachdächern zeigt Stehfalz nach Norden, nicht nach dem Gebäude ausgerichtet. Mit echter Maus nicht ausprobiert (Test über Skript).
  **Geändert nach Test (Wunsch der Nutzerin):** (1) **Ortgang:** Am Ortgang liefen die Muster schräg. Jetzt werden schmale
  Dachkanten (Ortgang, Traufkante, Attika-Rand) erkannt und ohne Muster in einer schlichten, etwas dunkleren Farbe gezeigt
  (wie ein Ortgangblech; `kantenDreiecke` in `fassade.js`: Dreiecke je Ebene sortiert, Ebene schmaler als 60 cm = Kante,
  Kanten als eigenes Netz `userData.dachKante`). (2) **Farben** dunkler und weniger gesättigt, passend zu den Fassaden:
  Schlicht hell #b7b5af, Ziegel rot #7f5a51, Ziegel anthrazit #545453, Stehfalz hellgrau #9b9d9c, Stehfalz anthrazit #4b4d50,
  Gründach #6c705f; je eine Kantenfarbe (`kante` in `DACHMATERIALIEN`).
  Getestet: `Test-ArchiCAD.ifc` (Ortgang und Traufkante schlicht, Ziegelreihen sauber), Einfamilienhaus (Walmdach, Zeichnung und realistisch). Keine Fehler.
  Versionsnummern: `materialien.js?v=19c` (in `app.js`, `fassade.js`, `realistisch.js`), `fassade.js`/`realistisch.js`/`szene.js`/`app.js` `v=19c`.
  Probleme: Ein Dachteil, das nur aus schmalen Flächen besteht, bekommt weiter überall das Muster (bewusst, sonst wäre es ganz ohne Material).
  Ältere gespeicherte Varianten behalten ihre Bilder mit den alten, helleren Dachfarben.
  **Nochmals geändert (Wunsch der Nutzerin): Farben abgestimmt, „realistisch“ echter.**
  Jedes Dachmaterial hat jetzt denselben Farbton wie sein Gegenstück in der Fassade, nur dunkler:
  Klinker rot #92564b (vorher #98534a, etwas weniger grell) ↔ Ziegel rot #7d4e45; Klinker anthrazit ↔ Ziegel anthrazit #58554f (warmes Grau);
  Fassadenplatten ↔ Stehfalz hellgrau #969a9c / anthrazit #4f5357 (kühles Grau); Sichtbeton ↔ Schlicht hell #b4b1ab.
  Ziegel „realistisch“: Farbunterschied je Ziegel von ±10 % auf ±3 % (vorher zu bunt), dafür weiche großflächige Alterung;
  Relief mit zwei flachen Mulden je Ziegel (Falzziegel), Schatten unter dem Ziegel darüber, schmaler Spalt zum Nachbarn, kräftigeres Relief.
  Licht „realistisch“ (`szene.js`): Himmelslicht leicht kühl, vom Boden zurückgeworfenes Licht warm und dunkler, Sonne leicht warm.
  **Schlagschatten bewusst nicht**: die kommen mit Sitzung 15 (Sonnenstand und Schatten).
  Versionsnummern: `materialien.js?v=19d` (in `app.js`, `fassade.js`, `realistisch.js`), `fassade.js`/`realistisch.js`/`szene.js`/`app.js` `v=19d`.
  Getestet mit dem Einfamilienhaus (Zeichnung und realistisch), keine Fehler.
  Hinweis: Klinker rot ist eine Fassadenfarbe – ältere Varianten behalten ihre Bilder mit dem alten Rot.
  **Außerdem (Wunsch der Nutzerin):** „Holz natur“ heißt jetzt **„Lärche“** (übliches Fassadenholz) und ist heller (#bfa88b statt #a6927e).
  Die interne Kennung bleibt `holz-natur`, gespeicherte Varianten zeigen den neuen Namen. Versionsnummern jetzt `v=19e`
  (`materialien.js`, `fassade.js`, `realistisch.js`, `szene.js`, `app.js`).

## Design-Vision (Entwurf 17.11., nach Sitzung 13 – noch nicht gebaut, Zeitpunkt offen)
Mit der Nutzerin als Testseite entworfen und abgestimmt („erstmal so festhalten“). Umbau später in einer eigenen Sitzung.
- **Stil:** Glassmorphism – halbtransparente Glaskarten mit Unschärfe vor einem dunklen, farbigen Verlauf,
  feine helle Ränder, weiche Schatten, viel Luft.
- **Hintergrund:** dunkler Verlauf Nachtblau → Violett → Petrol (Grundton `linear-gradient(135deg, #13203f, #241a46, #0f3a33)`),
  darüber weiche Farbflecken: Blau `#2f5fa8` oben links, Violett `#6a3f9e` oben rechts, Petrol `#12807a` unten rechts,
  **dunkles Grün** `#1c5c39` unten links (nach Rückmeldung abgedunkelt) und ein leichter Grünschimmer in der Mitte.
- **Gläser (Kopfleiste, Seitenleiste):** sehr durchsichtig und spiegelnd: Weiß 3–20 % mit Lichtreflex oben links,
  Unschärfe ca. 16 px, helle Oberkante, Ecken ca. 22 px rund. Schrift darauf fast weiß (`#eef2f8`), Regular statt Light.
- **3D-Fenster:** fast weiß (ca. 84 % deckend), damit die Materialfarben echt wirken; Schrift dort dunkelgrau (`#2c3445`), nie ganz schwarz.
  Das 3D-Fenster nimmt den größten Teil der Fläche ein, das Haus füllt es fast ganz.
- **Aufbau:** oben eine Glas-Kopfleiste mit App-Name, Dateiname, den Schritten **Außenwände · Fassade · Fenster · Varianten**
  (ohne Nummern, aktiver Schritt als helle „Pille“) und rechts „Variante speichern“ (Dunkelblau, rund).
  Passen die Schritte nicht hinein, lassen sie sich mit einer dünnen Glas-Schiebeleiste seitlich schieben.
  Links eine Glas-Seitenleiste nur mit dem aktuellen Schritt (Seitenleiste ca. 300 px, Schiebeleiste ebenfalls aus Glas).
  Im 3D-Fenster oben rechts kleine Glas-Knöpfe 3D / N / O / S / W, unten links die Maus-Legende als Glas-Pille.
- **Kennwerte:** klein, als eine Zeile unten in der Seitenleiste (nicht zentral, Wunsch der Nutzerin).
- **Schrift:** Artifakt Element (Autodesk): Fließtext **Light**, Überschriften **Heavy**, größer und schwer.
  Bei der Nutzerin installiert (kommt mit Revit). Schriftdatei **nicht** auf GitHub (Lizenz Autodesk); wer sie nicht hat,
  sieht Helvetica/Arial. Einbinden über `@font-face` mit `local("Artifakt Element Light")` usw.
- **Ruckel-Test (17.11.):** Einfamilienhaus mit Glas-Effekten in der echten App 4 s gedreht: ca. 50 Bilder/s, ohne Glas ca. 51 –
  kein Unterschied. Nur auf diesem Rechner gemessen; über dem 3D-Bild nur wenige, kleine Glas-Elemente verwenden.

## Nächste Schritte
- **Sitzung 17b (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Dachmaterial wählbar.
  **Bedienung:** eine Zeile **„Dach“** im Bereich „3 Fassade“ (wie „Stützen“), ein Material für alle Dachteile
  (IfcRoof bzw. Decken mit Typ „Dach“); einzelne Dachflächen nicht.
  **Materialien:** Dachziegel (rot, anthrazit), Stehfalz/Metall (hellgrau, anthrazit), Gründach, schlicht hell / Abdichtung.
  Gezeichnet im Zeichenstil wie die Fassaden, dazu je eine Fassung für „realistisch“ (Sitzung 17).
  **Startwert:** ruhiges Hellgrau (schlicht), damit das Dach nicht mehr heraussticht.
  **Fensterrahmen und Pfosten/Riegel bleiben anthrazit** (Entkopplung von der Dachfarbe).
  Wird mit der Variante gespeichert und geladen (ältere Varianten: hellgrau); Bilder/PDF zeigen es automatisch.
- **Sitzung 17 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Umschalter „realistisch“.
  **Ort:** kleiner Umschalter **„Zeichnung | Realistisch“ im 3D-Fenster**, immer sichtbar.
  **Look realistisch:** keine Kantenlinien, echtes Licht mit Licht- und Schattenseiten, feinere Texturen
  (Klinkerfugen, Holzmaserung, Betonporen), Glas spiegelt den Himmel. Rohmodell bleibt hellgrau.
  **Umgebung:** Hintergrund wird ein heller Himmelsverlauf (hellblau → weiß), kein Boden/Gras extra.
  **Bilder, Vergleich und PDF bleiben immer im Zeichenstil** – „realistisch“ ist nur zum Anschauen im 3D-Fenster
  (Varianten bleiben einheitlich vergleichbar). Der Umschalter wird nicht mit der Variante gespeichert.
- **Sitzung 14 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Pfosten-Riegel-Fassade als neues Material „Pfosten-Riegel“
  in der Materialliste je Himmelsrichtung (auch bei „Alle Seiten gleich“). Glas mit dunkelgrauen Pfosten und Riegeln
  (Farbe der Fensterrahmen, ca. 5 cm breit). Darunter zwei Zahlenfelder **Felder breit × hoch** (Start 8 × 3),
  Pfosten und Riegel gleichmäßig verteilt.
  **Ganze Wand = Fenster:** alte Fenster der Seite verschwinden, Fenster-Regler dieser Seite gesperrt,
  Kennwerte zählen die ganze Wandfläche als Fensterfläche.
  **Felder-Anzahl gilt je Wand** (kurze Wände haben schmalere Felder).
  **Auch für einzelne Wände** wählbar (Liste bei „Einzelne Wände“ aus Sitzung 12).
  Wird mit der Variante gespeichert und geladen, Vergleich zeigt es, Bilder/PDF automatisch.
  **Farbe (Wunsch der Nutzerin):** Dach, Pfosten/Riegel und Fensterrahmen in **derselben, recht dunklen Farbe**
  (Vorschlag Anthrazit #3a3d42 statt bisher #5f6266, nach dem Test ggf. nachstellen).
- **Sitzung 13 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Einzelnes Fenster → Maße ändern.
  Im Bereich „4 Fenster“ ein Schalter **„Einzelne Fenster“** (wie „Einzelne Wände“; ist der eine an, geht der andere aus).
  An: Fenster anklicken, **Umschalt + Klick** nimmt weitere dazu, gewählte Fenster blau getönt.
  Maße in **cm**: zwei Felder Breite × Höhe, Startwert = aktuelle Größe; bei mehreren Fenstern mit verschiedenen Maßen
  bleibt das Feld leer („verschieden“), eine Eingabe gilt dann für alle gewählten. Wie bisher: Sturz bleibt, Brüstung wandert,
  10 cm Abstand zu Wandrand und Nachbaröffnung, 0 = Fenster zu. **Eigenes Maß bleibt**, auch wenn der Regler der Seite
  oder „Alle Seiten gleich“ bewegt wird, bis „wie die Seite“ oder Textknopf „Einzelne Fenster zurücksetzen“.
  Nur Fenster in nachbaubaren Außenwänden, Türen nicht. Wird mit der Variante gespeichert und geladen,
  Kennwerte rechnen mit, Vergleich bekommt eine Zeile „Einzelne Fenster“; PDF zeigt es über die Bilder.
- **Sitzung 12 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Einzelne Wand → anderes Material.
  Im Bereich „3 Fassade“ ein Schalter **„Einzelne Wände“**. Aus: Klick schaltet wie bisher außen ↔ innen.
  An: Klick wählt eine Außenwand aus, **Umschalt + Klick** nimmt weitere dazu; für die Auswahl gibt es eine
  Material-Liste (dieselben 10 Materialien + „wie die Seite“). Nur Außenwände. Eigenes Material bleibt, auch wenn
  das Material der Seite oder „Alle Seiten gleich“ geändert wird. Textknopf „Einzelne Wände zurücksetzen“.
  Wird mit der Variante gespeichert und geladen; Bilder und PDF zeigen es automatisch.
- **Sitzung 11 (Entscheidung 17.11., vor dem Bauen):** Anleitung als **Startseite** im 3D-Bereich (statt „Noch kein Modell
  geladen“): 4 Schritte (IFC laden · Außenwände prüfen · Gestalten · Vergleichen/PDF), verschwindet beim Laden der IFC.
  Darunter aufklappbar „IFC-Export ▸“: allgemeine Tipps + je ein kurzer Abschnitt **Revit** und **ArchiCAD**.
  Oben in der Seitenleiste ein kleiner Textknopf „Anleitung“, der sie später wieder zeigt. Kein Fenster zum Wegklicken.
- **Sitzung 10c (erledigt, s. o.; Wunsch der Nutzerin, 17.11., nach Sitzung 10b):** Seitenleiste ruhiger machen.
  **Entscheidungen:** Bereich 1: Dateiname bleibt sichtbar, die Bauteil-Anzahlen (Wände, Fenster, Türen …) sind zugeklappt.
  Bereich 2: die Zahl der Außenwände bleibt sichtbar, die Bedienerklärung ist zugeklappt.
  **Alle** grauen Erklärtexte (auch in Fassade, Fenster, Kennwerte, Varianten) werden einheitlich zugeklappt
  und lassen sich mit einem kleinen Textknopf (z. B. „Erklärung ▸“) aufklappen. Start: zugeklappt.
  Fehlermeldungen und Statusmeldungen (z. B. „ist gespeichert“) bleiben immer sichtbar.
- **Sitzung 9b (erledigt, s. o.; Wunsch der Nutzerin, 17.11., nach Sitzung 9):** Die Ansichten sollen wie echte Ansichten aussehen,
  also gerade auf eine „glatte“ Wand. Bisher blickt die Kamera genau aus N/O/S/W. Ist das Gebäude im Plan gedreht
  (wie in `Test.ifc`, ca. 10–15°), sieht man schräg auf zwei Seiten. Vorschlag: Die App ermittelt die Hauptrichtung
  der Außenwände und schaut senkrecht darauf. Die 4 Ansichten gehören weiter zu den Wandgruppen Nord/Ost/Süd/West,
  damit sie zu Material, Fenstern und Kennwerten passen. Bereits gespeicherte Varianten behalten ihre alten Bilder.
  **Entscheidung (17.11.):** Beschriftung mit Himmelsrichtungs-Namen, wohin die Fassade wirklich zeigt
  (z. B. „Nord – zeigt nach Nordnordwest“), keine Gradzahl. Ist das Gebäude kaum gedreht, steht nur „Nord“.
- **Sitzung 10b (Wunsch der Nutzerin, 17.11., nach Sitzung 10):** Die Perspektive schaut zu steil von oben.
  Sie soll flacher werden und sich selbst einstellen lassen. Vor dem Bauen klären: Wie einstellen?
  Idee A: Regler (Blickhöhe/Winkel und Richtung, z. B. aus Südosten/Südwesten …). Idee B: den aktuellen Blick im
  3D-Fenster als Perspektive übernehmen (Knopf „Diesen Blick verwenden“). Gilt nur für neu gespeicherte Varianten
  (alte behalten ihre Bilder). Der Text „Perspektive aus Südosten“ in der PDF-Fußzeile muss dann angepasst werden.
  **Entscheidung (17.11., vor Sitzung 10b):** Idee A, Regler. Auswahl „Blick aus“ mit 4 Ecken (Nordost, Südost,
  Südwest, Nordwest; Start Südost) und Regler „Blickhöhe“ in Grad, Start **15°** (bisher ca. 26°).
  Kein Knopf „Diesen Blick verwenden“.
- Sitzung 10: PDF-Übersichtsseite A3 quer (bis zu 4 Varianten, nutzt die Auswahl aus dem Vergleich).
  **Entscheidungen (17.11., vor Sitzung 10):** PDF wird direkt als Datei gespeichert (Bibliothek jsPDF per CDN),
  nicht über den Druckdialog. Standort: Textfeld zum Eintippen (leer = Zeile fehlt), Sitzung 16 kann es später füllen.
  PDF schon ab 1 angekreuzter Variante (Knopf unter der Liste), ab 2 zusätzlich im Vergleichsfenster.
  Seitenaufbau: Kopf mit Titel, Modell (Dateiname), Datum, Standort; darunter je Variante eine Spalte
  (älteste links) mit Name, Perspektive, Ansichten N/O/S/W, Kennwerte (Material und Fenster nach Test gestrichen, s. Sitzung 10).
- **Entscheidung (16.11., vor Sitzung 7):** Neuer Bereich „5 Kennwerte“ als Tabelle Nord/Ost/Süd/West + Gesamt,
  rechnet sofort neu bei jeder Änderung. Fassadenfläche = Außenseite der Außenwände (Rohbaumaß, Öffnungen mitgezählt).
  Fensterfläche = Fensteröffnungen (Rohbaumaß). **Glastüren zählen als Fenster** (Wunsch der Nutzerin),
  geschlossene Türen nur zur Fassadenfläche. Glastür = Tür, deren Ansicht mindestens zur Hälfte aus
  durchsichtigen Teilen besteht (Transparenz aus der IFC); dann zählt die ganze Türöffnung.
  Material „Glas“ ist nur Optik und zählt nicht als Fenster. Flächen auf 0,1 m², Anteil in ganzen Prozent.
- Probleme in Sitzung 6: Die Wand wird mit ihrem äußeren Umriss nachgebaut. Hat eine Wand eine Einbuchtung
  (z. B. stufige Oberkante) oder ein Loch ohne Fenster/Tür, wird das beim Nachbau zugemacht.
  Gebogene oder L-förmige Wände werden nicht nachgebaut, ihre Fenster bleiben unverändert.
  Bei mehrschaligen Wänden wird die innere Schale mitgeschnitten, wenn sie sich nachbauen lässt.
  Durch das Glas sieht man den (weißen) Innenraum des Modells – gewollt, wirkt wie ein Arbeitsmodell.
  Unter Türen bzw. über raumhohen Fenstern bleibt beim Nachbau ein 5 mm dünner Wandstreifen (rechnerisch nötig, nicht sichtbar).
  Die Fenstergrößen gehen beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).
  Fenster können nur so groß werden, wie die (meist geschosshohe) Wand es zulässt.
  **Entscheidung (16.11., vor Sitzung 6):** Regler 0–200 %. Breite wächst von der Fenstermitte aus, Sturz bleibt,
  Brüstung wandert. Das Original-Fenster aus der IFC wird gestreckt bzw. gestaucht (Sprossen verzerren mit).
  Türen bleiben unverändert. Abstand zu Nachbaröffnung und Wandende mindestens 10 cm.
  **Geändert (16.11., nach Test):** Sprossen sollen weg. Alle Fenster in Außenwänden werden neu gezeichnet
  (schmaler Rahmen + Glas, ohne Sprossen), auch bei 100 %. Das Original-Fenster wird nicht mehr gestreckt.
  Rahmen 6 cm breit, 7 cm tief, deckend im Dunkelgrau des Dachs (#5f6266); sitzt so tief in der Wand wie das Original-Fenster.
  Nachgebaute Wand übernimmt den Umriss der IFC-Wand (auch Giebelspitzen).
- **Entscheidung (Sitzung 5):** Alle Materialfarben gedeckt und nicht zu knallig, eher etwas grau gebrochen.
- **Entscheidung (Sitzung 5):** Linien nicht „sklavisch korrekt“, sondern wie eine Handskizze:
  Fugen nur angedeutet wie mit der Feder: jeder Strich scharf und gleich kräftig, aber stellenweise fehlen Striche
  oder hören früher auf (keine weich ausgeblendeten, „verschwommenen“ Stellen – so war der erste Versuch, gefiel nicht).
  Klinker und Fassadenplatten ohne wolkige Helligkeitsflecken. Holz: Fugen relativ durchgängig gezogen
  (nur selten eine Lücke von wenigen Zentimetern), leicht unterschiedlich kräftig, dazu ganz leichte Wolken.
  Viele Lücken wirkten beim Holz komisch, beim Klinker gefallen sie.
  Glas ohne dunkle Profilstriche, die Felder (1,25 × 1,50 m) erkennt man nur an der leichten Spiegelung.
  Bauteilkanten stehen an den Enden etwas über (bis 15 cm) und sind unterschiedlich kräftig.
- Eigene Texturen (Fotos) vorerst nicht nötig; passen eher zum Umschalter „realistisch“ (Sitzung 17).
  Dann nur freie Quellen ohne Namensnennungspflicht nehmen, z. B. CC0 von ambientCG oder Poly Haven.
- Probleme in Sitzung 5: Das Muster liegt direkt auf den IFC-Wänden, auch auf Gauben-Seitenwänden und Schornsteinen,
  wenn sie als Außenwand erkannt sind (per Klick abschaltbar). Kellerwände bekommen keine eigene Regel, ebenfalls per Klick.
  Die Materialwahl geht beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).
- Probleme in Sitzung 4: Das Gelände in der Test-IFC ist kein IfcSite, sondern mehrere Revit-Körper („Mass 1“ bis „Mass 9“,
  IfcBuildingElementProxy). Die App kann sie nicht sicher als Gelände erkennen, deshalb erscheinen sie wie das übrige
  Rohmodell (weiß mit Linien, wirkt wie eine Modellplatte). Ist so in Ordnung.
  Der Browser hält beim Testen manchmal alte JS-Dateien fest: dann Strg+Umschalt+R (neu laden ohne Zwischenspeicher).
- Probleme in Sitzung 2: keine Fehler. Auffällig: Das Gelände (Grundstück) aus der Test-IFC ist viel größer als das Haus
  und weiß auf weiß kaum zu sehen; bei der Darstellung (Sitzung 4) mitbedenken.
- Probleme in Sitzung 3: Die Erkennung ist nicht perfekt. Einzelne Innenwände gelten als außen, einige Kellerwände
  als innen, und bei mehrschaligen Wänden (Revit „Front wall“/„Back wall“) zählt meist nur die äußere Schale.
  Das ist gewollt, denn die Fassade sitzt außen. Korrektur per Klick. Die Klicks gehen beim Neuladen verloren
  (gespeichert wird erst mit den Varianten, Sitzung 8).
  Kellerwände unter dem Gelände werden als außen erkannt; ob sie eine Fassade bekommen, in Sitzung 5 klären.
  Die blaue Markierung ist vorläufig, der Zeichenstil kommt in Sitzung 4.
