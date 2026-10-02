import Link from "next/link";
import { LEGAL, LAST_UPDATED } from "../legal";

export function TermsRo() {
  const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

  return (
    <>
      <h1>Termeni și condiții</h1>
      <p className="!text-slate-600 dark:!text-slate-400">Ultima actualizare: {LAST_UPDATED.ro}</p>

      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-6">
        <p className="!mb-0 !text-amber-900 dark:!text-amber-200">
          <strong className="!text-amber-900 dark:!text-amber-100">Pe scurt:</strong> UniProject Hub este un proiect
          academic și de portofoliu, oferit gratuit, fără scop comercial și fără garanții de funcționare. Nu este un
          serviciu oficial al vreunei universități. Păstrează copii ale documentelor importante.
        </p>
      </div>

      <h2>1. Despre platformă</h2>
      <p>
        UniProject Hub a fost dezvoltat de <strong>{LEGAL.operatorName ?? "autorul aplicației"}</strong> ca lucrare de licență și este
        întreținut în prezent ca proiect de portofoliu. Platforma este oferită gratuit, fără abonamente, plăți sau
        reclame. Nu este afiliată cu nicio universitate și nu este un serviciu comercial.
      </p>

      <h2>2. Acceptarea termenilor</h2>
      <p>
        Prin crearea unui cont confirmi că ai citit și accepți acești termeni și{" "}
        <Link href="/privacy">Politica de confidențialitate</Link>. Dacă nu ești de acord, nu folosi platforma.
      </p>

      <h2>3. Contul tău</h2>
      <ul>
        <li>Trebuie să ai cel puțin 16 ani pentru a-ți crea un cont.</li>
        <li>Datele furnizate la înregistrare, inclusiv rolul (student sau profesor), trebuie să fie reale. Conturile
          de profesor sunt activate doar după aprobarea unui administrator.</li>
        <li>Ești responsabil pentru păstrarea confidențialității parolei și a PIN-ului tău.</li>
        <li>Dacă observi o utilizare neautorizată a contului, anunță-ne la {mail}.</li>
      </ul>

      <h2>4. Utilizare acceptabilă</h2>
      <p>Folosind platforma, te angajezi să nu:</p>
      <ul>
        <li>încarci conținut ilegal, ofensator, care încalcă drepturi de autor sau care conține programe malițioase;</li>
        <li>încarci date personale ale altor persoane fără a avea dreptul să o faci;</li>
        <li>încerci să accesezi conturi, proiecte sau date care nu îți aparțin sau să ocolești măsurile de securitate;</li>
        <li>suprasoliciți platforma (de exemplu prin cereri automate în masă sau spam);</li>
        <li>te dai drept altă persoană sau drept cadru didactic dacă nu ești;</li>
        <li>înregistrezi sau distribui apelurile video fără acordul tuturor participanților.</li>
      </ul>
      <p>
        Apelurile video se desfășoară pe serviciul extern Jitsi Meet, care are propriile condiții de utilizare.
      </p>

      <h2>5. Conținutul tău</h2>
      <p>
        Documentele, mesajele și celelalte materiale pe care le încarci rămân ale tale. Ne acorzi doar dreptul
        limitat de a le stoca și afișa în platformă, strict pentru a o face să funcționeze: de exemplu, pentru ca
        membrii echipei și coordonatorul proiectului să le poată vedea. Ești responsabil pentru conținutul pe care
        îl încarci.
      </p>

      <h2>6. Evaluări și note</h2>
      <p>
        Evaluările, notele și analizele automate din platformă au caracter informativ și servesc organizării
        proiectelor. Ele <strong>nu înlocuiesc</strong> evidența oficială a notelor sau deciziile instituției de
        învățământ.
      </p>

      <h2>7. Disponibilitate</h2>
      <p>
        Fiind un proiect academic, platforma este oferită „ca atare”. Nu garantăm că va funcționa fără întreruperi
        sau erori, că datele vor fi păstrate indefinit ori că serviciul va rămâne disponibil. Platforma poate fi
        modificată, suspendată sau oprită oricând. Nu te baza pe ea ca singur loc de stocare pentru documente
        importante.
      </p>

      <h2>8. Limitarea răspunderii</h2>
      <p>
        În limitele permise de lege, autorul nu răspunde pentru pierderi de date, întârzieri în proiecte sau alte
        daune rezultate din utilizarea sau imposibilitatea de a utiliza platforma. Nimic din acești termeni nu îți
        limitează drepturile pe care legea nu permite să fie limitate.
      </p>

      <h2>9. Suspendarea și închiderea contului</h2>
      <p>
        Îți poți șterge oricând contul din pagina Setări, conform{" "}
        <Link href="/privacy">Politicii de confidențialitate</Link> (secțiunea 7.1). Conturile care încalcă acești termeni pot fi
        suspendate sau șterse, iar dacă este posibil te vom anunța în prealabil prin email.
      </p>

      <h2>10. Modificarea termenilor</h2>
      <p>
        Putem actualiza acești termeni. Data ultimei actualizări apare la începutul paginii, iar schimbările
        importante sunt anunțate prin email sau printr-o notificare în aplicație. Dacă folosești platforma în
        continuare după modificare, înseamnă că accepți noii termeni.
      </p>

      <h2>11. Legea aplicabilă</h2>
      <p>Acești termeni sunt guvernați de legea română.</p>

      <h2>12. Contact</h2>
      <p>Pentru întrebări despre acești termeni, scrie la {mail}.</p>
    </>
  );
}
