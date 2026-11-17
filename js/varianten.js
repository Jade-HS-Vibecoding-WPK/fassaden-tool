// Varianten im Browser-Speicher dieses Rechners ablegen (IndexedDB: fasst viel mehr als localStorage,
// damit die Bilder Platz haben). Die Daten bleiben nur in diesem Browser auf diesem Gerät.

const DATENBANK = 'fassaden-tool';
const ABLAGE = 'varianten';

let verbindung = null;

function oeffnen() {
  if (verbindung) return verbindung;
  verbindung = new Promise((fertig, fehler) => {
    const anfrage = indexedDB.open(DATENBANK, 1);
    anfrage.onupgradeneeded = () => anfrage.result.createObjectStore(ABLAGE, { keyPath: 'id', autoIncrement: true });
    anfrage.onsuccess = () => fertig(anfrage.result);
    anfrage.onerror = () => { verbindung = null; fehler(anfrage.error); };
  });
  return verbindung;
}

// Eine Anfrage an die Ablage stellen und auf das Ergebnis warten
async function anfragen(modus, auftrag) {
  const db = await oeffnen();
  return new Promise((fertig, fehler) => {
    const vorgang = db.transaction(ABLAGE, modus);
    const anfrage = auftrag(vorgang.objectStore(ABLAGE));
    vorgang.oncomplete = () => fertig(anfrage.result);
    vorgang.onerror = () => fehler(vorgang.error);
    vorgang.onabort = () => fehler(vorgang.error ?? new Error('Speichern abgebrochen'));
  });
}

// Alle Varianten, die zu diesem Modell gehören, neueste zuerst
export async function variantenLesen(modellKennung) {
  const alle = await anfragen('readonly', (ablage) => ablage.getAll());
  return alle.filter((v) => v.modell === modellKennung).sort((a, b) => b.datum - a.datum);
}

// Speichert eine neue Variante und liefert ihre Nummer (id) zurück
export function varianteSpeichern(variante) {
  return anfragen('readwrite', (ablage) => ablage.add(variante));
}

export function varianteLoeschen(id) {
  return anfragen('readwrite', (ablage) => ablage.delete(id));
}
