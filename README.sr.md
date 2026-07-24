# Task Manager

Lična tabla za zadatke u stilu Trella — radni prostori, projekti, table,
kolone i kartice.

Napravljeno kao portfolio projekat, ali se koristi svakodnevno: postoji i kao
veb-aplikacija i kao Windows program koji se otvara dvoklikom.

> Na engleskom: [README.md](README.md)

---

## Šta aplikacija radi

**Organizacija u četiri nivoa**

Radni prostor → projekat → tabla → kolone sa karticama. Radni prostor
razdvaja oblasti života („Lično“, „Frilens“), projekat okuplja poslove oko
jedne teme, a tabla ih prikazuje po fazama.

**Kartice kao pravi zadaci**

- Naslov i opis
- **Rok** — opcioni. Kartica bez datuma je sasvim uobičajena, a kartica sa
  datumom dobija oznaku u boji: siva za daleko, narandžasta za uskoro,
  crvena za danas i puna crvena za probijen rok
- **Prioritet** u četiri stepena
- **Čeklista** — koraci unutar zadatka, svaki se štiklira posebno. Na tabli
  se vidi napredak `2/5`, a oznaka postaje zelena kad su svi koraci gotovi
- **Beleške** — slobodan tekst uz karticu: šta je urađeno, gde se stalo,
  šta ne treba zaboraviti

**Gotovo je gotovo**

Zadatak se završava štikliranjem kućice, i to je jedini način. Nema kolone
„Done“ — dva različita odgovora na isto pitanje samo bi se međusobno
protivrečila. Završene kartice se sklanjaju filterom kad smetaju.

**Filteri**

Pretraga po tekstu, filtriranje po prioritetu i roku (probijeni, narednih
sedam dana, bez roka) i prekidač „sakrij završene“. Filteri se kombinuju i
rade trenutno, bez ijednog zahteva ka serveru.

**Prevlačenje mišem**

Kartice se prevlače unutar kolone i iz kolone u kolonu, a kolone se hvataju
za ručicu u zaglavlju. Novi raspored se odmah vidi na ekranu, pa se tek onda
šalje serveru — ako zahtev ne uspe, sve se vraća kako je bilo.

**Izgled i jezik**

Dve teme — nežno roze i neutralna siva — i dva jezika, engleski i ruski.
Menja se u zaglavlju, bez osvežavanja stranice, i pamti se za sledeći put.

---

## Preuzimanje i pokretanje

### Windows program

Instalacioni fajl se pravi iz izvornog koda:

```bash
cd desktop
npm install
npm run dist
```

Rezultat:

```
desktop/release/Task Manager Setup 1.0.0.exe
```

Instalacija ne traži administratorska prava, pravi prečicu na radnoj površini
i u start meniju. Program ne traži nikakav terminal — otvori se dvoklikom.

> Gotov `.exe` nije objavljen na GitHub-u zato što ima oko 150 MB. Za
> objavljivanje se koristi GitHub Releases, ne sam repozitorijum.

**Gde su podaci**

```
C:\Users\<ime>\AppData\Roaming\Task Manager\
├── task-manager.db      ← zadaci
├── window-state.json    ← veličina i položaj prozora
└── backups\             ← kopije baze, čuva se poslednjih 15
```

Baza namerno nije pored programa: ažuriranje zamenjuje programsku fasciklu,
pa bi sve u njoj bilo obrisano. Kopija baze se pravi pri svakom pokretanju,
pre svega ostalog. Deinstalacija ne dira podatke.

Detaljnije: [docs/DESKTOP.md](docs/DESKTOP.md).

### Verzija u pregledaču (za razvoj)

Dva terminala. Prvi — server:

```bash
cd backend && npm install && npx prisma migrate dev && npm run seed && npm run start:dev
```

Drugi — interfejs:

```bash
cd frontend && npm install && npm start
```

Zatim otvoriti http://localhost:4200

Korisno uz to: `npm run db:studio` u `backend/` otvara bazu u pregledaču kao
tabelu.

---

## Kako radi

Aplikacija su dva odvojena programa koja razgovaraju preko HTTP-a:

```
Pregledač (4200)                Server (3333)              Fajl baze
┌──────────────────┐          ┌────────────────┐        ┌──────────┐
│ Angular          │ ──HTTP─► │ NestJS         │ ─ORM─► │  SQLite  │
│ komponente, forme│ ◄─JSON── │ kontroleri     │ ◄───── │          │
└──────────────────┘          └────────────────┘        └──────────┘
```

Angular nikada ne pristupa bazi direktno — samo traži podatke i prikazuje ih.
Provere i logika žive na serveru, jer kod koji radi u pregledaču korisnik može
da otvori i izmeni.

U desktop verziji ta dva dela rade u istom procesu: isti server šalje i
interfejs i odgovore na `/api`, pa nema drugog terminala ni CORS-a.

### Baza podataka

```
Workspace ──< Project ──< Board ──< BoardColumn ──< Card ──┬──< Note
                                                           └──< ChecklistItem
```

Svaka veza je „jedan prema više“ sa kaskadnim brisanjem: brisanje radnog
prostora uklanja i sve projekte, table, kolone, kartice, beleške i čekliste,
umesto da ostavi zapise koji vode u prazno.

Nema tabele korisnika. Aplikacija je namerno za jednu osobu — nalozi, članovi
tima i dodeljivanje zadataka su izbačeni jer su komplikovali bazu bez ikakve
koristi.

### Struktura projekta

```
Task Manager/
├── backend/    NestJS API
├── frontend/   Angular aplikacija
├── desktop/    Electron omotač
└── docs/       plan razvoja, uputstva
```

---

## Tehnologije

| Sloj | Tehnologija | Zašto |
|---|---|---|
| Interfejs | **Angular 20** | komponente, rutiranje, reaktivne forme, signali |
| Server | **NestJS 11** | ista podela na module i servise kao u Angularu |
| ORM | **Prisma 6** | šema u jednom fajlu, migracije, tipizirani upiti |
| Baza | **SQLite** (**PostgreSQL** na serveru) | povezane tabele sa pravim stranim ključevima |
| Prevlačenje | **Angular CDK** | gotova podrška za drag & drop |
| Desktop | **Electron 33** + **electron-builder** | jedan program umesto dva terminala |
| Jezik | **TypeScript** | isti jezik na obe strane |

Nekoliko odluka vredi objasniti:

- **Bez biblioteke za prevode.** Oba jezika stoje u jednom fajlu sa tipovima;
  engleski rečnik definiše oblik, pa TypeScript prijavi svaki ključ koji
  ruskom nedostaje.
- **Boje kao CSS promenljive.** Zbog toga je druga tema samo drugi skup
  vrednosti — nijedna komponenta nije menjana.
- **Migracije bez Prisma CLI-ja u desktop verziji.** CLI je razvojni alat i ne
  isporučuje se korisniku, pa program sam primenjuje iste `.sql` fajlove i
  pamti šta je već odradio.

---

## Stanje projekta

| Faza | Sadržaj | |
|---|---|---|
| 1 | temelji: šema baze, API, kostur Angulara | ✅ |
| 2 | table, kolone, kartice, rokovi | ✅ |
| 3 | beleške, čekliste, filteri | ✅ |
| 4 | prevlačenje mišem, doterivanje | ✅ |
| 5 | jezici, teme, autorstvo | ✅ |
| 6 | desktop aplikacija | ✅ |
| 7 | objavljivanje na internetu | u toku |

Ceo plan: [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Autor

**Jana Kim** — [github.com/JanaKim0](https://github.com/JanaKim0)

Licenca [MIT](LICENSE). Pisano uz pomoć veštačke inteligencije (Claude), što
je zabeleženo u istoriji commit-ova.
