# Umsetzungsplan Fassaden-Tool

## Idee
Werkzeug fürs Architekturstudium: Den eigenen Entwurf als recht einfaches 3D-Modell als IFC
exportieren (z. B. aus Revit oder ArchiCAD), in der App hochladen, die Außenwände mit verschiedenen
Fassadenmaterialien belegen, Fenstergrößen ändern und daraus Varianten machen, die man
nebeneinander vergleicht und als PDF mitnimmt.

## Must (läuft spätestens Do 12 Uhr)
- [ ] IFC-Datei des eigenen Entwurfs hochladen (Button oder Datei ins Fenster ziehen) und in 3D ansehen
- [ ] Außenwände automatisch erkennen (IFC-Eigenschaft „IsExternal“), per Klick korrigierbar
- [ ] Norden = Plan-oben (keine Einstellung)
- [ ] Material pro Himmelsrichtung (N/O/S/W): Klinker, Holz, Sichtbeton, Putz, Metall, Glas (je 1–2 Farbtöne)
- [ ] Fenster pro Himmelsrichtung: Breite und Höhe in % (Sturz bleibt, Brüstung wandert, 0 % = Fenster zu)
- [ ] Kennwerte je Himmelsrichtung und gesamt: Fassadenfläche, Fensterfläche, Fensterflächenanteil
- [ ] Darstellung mit klarem Unterschied zwischen Rohmodell und Entwurf:
      - Alles aus der IFC (Decken, Innenwände, nicht gestaltete Wände) hellgrau-weiß wie ein Arbeitsmodell
      - Dächer in einem festen, ruhigen Dunkelgrau mit Zeichenlinien (nicht weiß)
      - Gestaltete Fassade „farbig + Zeichenlinien“: kräftige, ruhige Materialfarben, dunkle Kantenlinien
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
- **Varianten:** werden im Browser-Speicher dieses Rechners abgelegt.
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
- `testdaten/` wird nicht hochgeladen (Lizenz der Beispiel-IFC unklar).

## Sitzungsplan (ein Feature pro Sitzung)
Ablauf jeder Sitzung: `/clear` → ein Feature bauen → testen → Commit → Stand hier in PLAN.md festhalten.
Erledigte Sitzungen abhaken, die nächste offene Nummer ist dran.

**Mo 16.11.**
- [x] 0. PLAN.md und CLAUDE.md fertig

**Di 17.11. – Grundgerüst**
- [x] 1. Git im Projekt einrichten und erster Commit (16.11.)
- [ ] 2. IFC hochladen und in 3D ansehen
- [ ] 3. Außenwände erkennen und per Klick korrigieren
- [ ] 4. Darstellung: Rohmodell hellgrau-weiß, Dach dunkelgrau, Zeichenstil mit Kantenlinien
- [ ] 5. Material pro Himmelsrichtung

**Mi 18.11. – Must fertig, dann Should 1 + 2**
- [ ] 6. Fenster pro Himmelsrichtung (Breite/Höhe in %)
- [ ] 7. Kennwerte (Fassadenfläche, Fensterfläche, Fensterflächenanteil)
- [ ] 8. Varianten speichern, mit 5 Bildern (Perspektive + N/O/S/W)
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

## Stand (16.11.2026)
- CLAUDE.md und PLAN.md angelegt, Plan mit der Nutzerin abgestimmt.
- Test-IFC liegt in `testdaten/` (Einfamilienhaus, Revit 2023, IFC2x3: 192 Wände, 57 Fenster, 49 Türen).
- Git ist im Projekt eingerichtet (Zweig `main`, Name Paulina Awick, Uni-E-Mail, nur für dieses Projekt hinterlegt).
- `.gitignore` schließt `testdaten/` aus. Erster Commit gemacht (Sitzung 1).
- `index.html` und `style.css` existieren als früher Entwurf ohne Funktion; beim Start der Umsetzung entscheiden, ob behalten.

## Nächste Schritte
- Sitzung 2: IFC hochladen und in 3D ansehen (dabei entscheiden, ob der frühe Entwurf von `index.html`/`style.css` bleibt).
- Probleme in Sitzung 1: keine.
