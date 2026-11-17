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
      - Dächer in einem festen, ruhigen Dunkelgrau mit Zeichenlinien (nicht weiß)
      - Gestaltete Fassade „farbig + Zeichenlinien“: gedeckte, ruhige Materialfarben (nicht knallig), dunkle Kantenlinien
        und gezeichnete Struktur (Fugen, Bretter, Raster), wie eine kolorierte Architekturzeichnung –
        künstlerisch, nicht realistisch
- [ ] Varianten speichern (Name + Bilder) und nebeneinander vergleichen;
      pro Variante automatisch 5 Bilder aus fester Kamera: Perspektive + Ansichten Nord/Ost/Süd/West
- [ ] PDF-Übersichtsseite: bis zu 4 Varianten auf **A3 quer**, mit Perspektive + 4 Ansichten,
      Materialien, Kennwerten; im Kopf Standort und Nordpfeil
- [ ] Für Kommiliton*innen: kurze Anleitung beim ersten Öffnen und Hinweise, wie man die IFC exportiert

## Should (wenn Must steht, Ziel Mittwoch) – in dieser Reihenfolge abarbeiten
**1. Feinjustierung**
- [ ] 2. Schritt: einzelne Wand anklicken und anderes Material geben
- [ ] 2. Schritt: einzelnes Fenster anklicken, Breite/Höhe per Regler oder in cm ändern

**2. Pfosten-Riegel**
- [ ] Pfosten-Riegel-Fassade als eigenes Material für eine ganze Seite;
      Anzahl der Felder einstellbar (z. B. 8 breit × 3 hoch), Pfosten und Riegel werden gleichmäßig verteilt

**3. Sonne & Standort**
- [ ] Sonnenstand und Schatten in 3D: Datum und Uhrzeit frei wählbar, Schnelltasten 21.3. / 21.6. / 21.12.
- [ ] Standort per Ortssuche (OpenStreetMap, Namensnennung in der App) – *darf notfalls zu Could*;
      Ersatz dann: Koordinaten von Hand eintippen (Schatten gibt es trotzdem)

**4. Darstellung & Extras**
- [ ] Darstellung umschaltbar auf „realistisch“: Texturen mit Klinkerfugen, Holzmaserung, Glasspiegelung
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
- Nach jedem fertigen Feature ein lokaler Commit (Speicherstand) auf dem Laptop.
- Zu GitHub hochladen erst am Donnerstag (Veröffentlichung über GitHub Pages) und zur Abgabe am Freitag.
- `testdaten/` wird nicht hochgeladen (Beispiel-IFC stammt von der Bundesingenieurkammer, Nutzungsbedingungen nicht geklärt).

## Sitzungsplan (ein Feature pro Sitzung)
Ablauf jeder Sitzung: `/clear` → ein Feature bauen → testen → Commit → Stand hier in PLAN.md festhalten.
Erledigte Sitzungen abhaken, die nächste offene Nummer ist dran.

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
- [ ] 9. Variantenvergleich nebeneinander
- [ ] 10. PDF-Übersichtsseite A3 quer
- [ ] 11. Kurze Anleitung beim ersten Öffnen + IFC-Export-Hinweise → **Must komplett**
- [ ] 12. Should 1a: einzelne Wand → anderes Material
- [ ] 13. Should 1b: einzelnes Fenster → Maße ändern
- [ ] 14. Should 2: Pfosten-Riegel-Fassade

**Do 19.11. – bis 12 Uhr fertig**
- [ ] 15. Should 3a: Sonnenstand und Schatten
- [ ] 16. Should 3b: Standort per Ortssuche (darf notfalls wegfallen)
- [ ] 17. Should 4a: Umschalter „realistisch“
- [ ] 18. Should 4b: eigene Farbe pro Material
- [ ] 19. Should 4c: PDF-Einzelseiten (fällt als Erstes weg, wenn es eng wird)
- [ ] 20. Ab ca. 10:30: Test mit eigener IFC, Fehler beheben
- [ ] 21. Auf GitHub hochladen und über GitHub Pages veröffentlichen → **12 Uhr Freeze**
- [ ] 22. Nachmittag: README (Poster macht die Nutzerin selbst nach Moodle-Vorlage)

**Fr 20.11.** – Polieren & präsentieren, Abgabe bis 16 Uhr

Wenn es eng wird, zuerst streichen: 19 (PDF-Einzelseiten), dann 16 (Ortssuche).
Was bis Do 10:30 nicht fertig ist, wandert zu Could.

## Stand (16.11.2026, nach Sitzung 8)
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

## Nächste Schritte
- Sitzung 9: Variantenvergleich nebeneinander (Bilder + Materialien + Kennwerte).
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
