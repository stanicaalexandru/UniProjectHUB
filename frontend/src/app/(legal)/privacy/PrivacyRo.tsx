import Link from "next/link";
import { LEGAL, LAST_UPDATED } from "../legal";

export function PrivacyRo() {
  const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

  return (
    <>
      <h1>Politica de confidențialitate</h1>
      <p className="!text-slate-600 dark:!text-slate-400">Ultima actualizare: {LAST_UPDATED.ro}</p>

      <p>
        UniProject Hub este o platformă pentru gestionarea proiectelor studențești, dezvoltată ca proiect
        academic și de portofoliu. Această pagină explică ce date personale colectăm, de ce, cât timp le
        păstrăm și ce drepturi ai, conform Regulamentului (UE) 2016/679 (GDPR).
      </p>

      <h2>1. Cine răspunde de datele tale</h2>
      <p>
        Operatorul datelor este <strong>{LEGAL.operatorName ?? "autorul aplicației"}</strong>, persoană fizică și autor al aplicației.
        Pentru orice întrebare sau cerere legată de datele tale, scrie la {mail}.
      </p>

      <h2>2. Ce date colectăm</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr><th scope="col">Categorie</th><th scope="col">Date</th><th scope="col">Obligatoriu?</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Date de cont</td>
              <td>prenume, nume, adresă de email, parolă (stocată doar sub formă criptografică, nu în clar), rol (student / profesor)</td>
              <td>Da</td>
            </tr>
            <tr>
              <td>Date academice</td>
              <td>facultate, departament, an de studiu</td>
              <td>Nu</td>
            </tr>
            <tr>
              <td>Date de profil opționale</td>
              <td>număr de telefon, descriere scurtă (bio), fotografie de profil</td>
              <td>Nu</td>
            </tr>
            <tr>
              <td>Date de securitate</td>
              <td>numărul de încercări eșuate de autentificare, coduri temporare de confirmare sau resetare, token de sesiune, PIN de securitate opțional (stocat criptografic)</td>
              <td>Generate automat</td>
            </tr>
            <tr>
              <td>Conținut creat de tine</td>
              <td>proiecte, sarcini, milestone-uri, documente încărcate, mesaje și atașamente din chat, comentarii, evaluări și note, notificări, istoricul activității în proiecte</td>
              <td>Depinde de utilizare</td>
            </tr>
            <tr>
              <td>Analize automate</td>
              <td>indicatori de progres și risc calculați de modulul de analiză al platformei, pe baza datelor de mai sus</td>
              <td>Generate automat</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>Nu</strong> folosim cookie-uri, instrumente de analytics, pixeli de urmărire sau reclame, și nu
        colectăm adresa IP în jurnalele aplicației. Analizele automate se fac intern, pe serverul aplicației,
        fără a trimite datele către servicii de inteligență artificială externe.
      </p>

      <h2>3. De ce folosim datele și pe ce temei legal</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr><th scope="col">Scop</th><th scope="col">Temei legal (GDPR)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Crearea și administrarea contului, funcționarea proiectelor, echipelor, chatului și evaluărilor</td>
              <td>Executarea contractului: termenii de utilizare pe care îi accepți la înregistrare (art. 6 alin. 1 lit. b)</td>
            </tr>
            <tr>
              <td>Trimiterea emailurilor de confirmare a contului, de resetare a parolei și a notificărilor</td>
              <td>Executarea contractului (art. 6 alin. 1 lit. b)</td>
            </tr>
            <tr>
              <td>Protecția conturilor: blocarea încercărilor repetate de autentificare, sesiuni securizate</td>
              <td>Interesul legitim de a menține platforma sigură (art. 6 alin. 1 lit. f)</td>
            </tr>
            <tr>
              <td>Afișarea datelor de profil opționale (telefon, bio, fotografie)</td>
              <td>Consimțământul tău (art. 6 alin. 1 lit. a), pe care îl retragi oricând ștergând câmpul din Setări</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Nu folosim datele pentru marketing și nu luăm decizii automate cu efect juridic asupra ta.</p>

      <h2>4. Cine are acces la date</h2>
      <ul>
        <li>
          <strong>Alți utilizatori ai platformei</strong>: numele, emailul, rolul și datele de profil pe care
          le completezi (facultate, departament, an de studiu, bio, fotografie) sunt vizibile altor utilizatori
          autentificați, pentru ca echipele și coordonatorii să poată colabora. <strong>Numărul de telefon nu este
          afișat altor utilizatori, inclusiv administratorilor platformei.</strong> El este accesibil tehnic doar
          operatorului, prin baza de date, și nu este folosit în niciun scop. Conținutul unui proiect este vizibil doar membrilor echipei, creatorului și profesorului
          coordonator al acelui proiect.
        </li>
        <li>
          <strong>Furnizorul de email</strong>
          {LEGAL.emailProvider ? <> (<strong>{LEGAL.emailProvider}</strong>)</> : <> (în configurația implicită, <strong>Google Gmail</strong>)</>}:
          emailurile aplicației (confirmarea contului, resetarea parolei, bun venit, notificări) trec prin serverele
          acestuia, deci el primește adresa ta de email, numele și conținutul mesajului. Furnizorul poate prelucra date
          și în afara Spațiului Economic European, pe baza propriilor garanții (clauze contractuale standard).
        </li>
        <li>
          <strong>Jitsi Meet</strong> (serviciul public meet.jit.si, operat de 8x8 Inc.), <strong>doar dacă folosești
          butonul „Apel video”</strong>: apelul se deschide pe serverul Jitsi, care primește numele tău afișat,
          numele (aleator) al camerei, precum și sunetul și imaginea transmise în timpul apelului. Noi nu înregistrăm
          și nu stocăm apelurile. Prelucrarea din timpul apelului e guvernată de politica de confidențialitate Jitsi.
        </li>
        <li>
          <strong>Furnizorul de hosting</strong>
          {LEGAL.hostingProvider
            ? <>: <strong>{LEGAL.hostingProvider}</strong>, care găzduiesc aplicația și baza de date. Ca orice furnizor de hosting, aceștia pot păstra pentru scurt timp adresele IP ale vizitatorilor în jurnalele lor de securitate.</>
            : <>: aplicația rulează pe un server propriu. Dacă va fi mutată la un furnizor de hosting, acesta va fi menționat aici.</>}
        </li>
      </ul>
      <p>Nu vindem, nu închiriem și nu transmitem datele tale altor terți.</p>

      <h2>5. Unde sunt stocate datele</h2>
      <p>
        Datele de cont și conținutul sunt stocate într-o bază de date PostgreSQL. Documentele și atașamentele
        de chat sunt salvate ca fișiere pe discul serverului aplicației, <strong>nu</strong> într-un serviciu de
        stocare în cloud.
      </p>

      <h2>6. Ce stocăm în browserul tău</h2>
      <p>
        Aplicația nu folosește cookie-uri. Pentru a te menține autentificat, salvează în spațiul de stocare local
        al browserului (<code>localStorage</code>):
      </p>
      <ul>
        <li><code>access_token</code> și <code>refresh_token</code>: token-urile de sesiune;</li>
        <li><code>user</code>: o copie a datelor tale de profil, pentru afișare rapidă;</li>
        <li><code>remember_me</code>: preferința „Ține-mă minte”;</li>
        <li><code>theme</code> și <code>locale</code>: tema aleasă (luminoasă / întunecată) și limba interfeței.</li>
      </ul>
      <p>
        Aceste informații sunt strict necesare funcționării serviciului pe care îl ceri, motiv pentru care nu
        îți cerem consimțământul separat. Token-urile, copia profilului și preferința „Ține-mă minte” se șterg la
        deconectare; tema și limba rămân în browser, ca să nu le alegi din nou, până când ștergi datele site-ului.
        La ștergerea contului se șterg toate.
      </p>

      <h2>7. Cât timp păstrăm datele</h2>
      <ul>
        <li>Datele contului și conținutul creat: cât timp contul este activ.</li>
        <li>Codurile de confirmare și de resetare a parolei: expiră automat după 15 minute.</li>
        {LEGAL.showcase && <li><strong>Demo public:</strong> conturile create de vizitatori și tot conținutul lor (proiecte, mesaje, fișiere) se șterg automat în cel mult 24 de ore, când datele demo sunt reîncărcate. Conturile demo afișate pe pagina de autentificare sunt fictive.</li>}
      </ul>

      <h2>7.1. Ștergerea contului</h2>
      <p>
        Îți poți șterge contul oricând din <strong>Setări → Zona periculoasă</strong>, confirmând cu parola.
        Ștergerea este imediată și definitivă:
      </p>
      <ul>
        <li>
          <strong>Se șterg</strong>: contul și datele de profil (nume, email, telefon, fotografie, bio, parolă,
          PIN), notificările tale, cererile de înscriere, invitațiile trimise sau primite și calitatea de membru
          în echipe.
        </li>
        <li>
          <strong>Rămân, fără numele tău</strong>: documentele, sarcinile, comentariile și mesajele din proiectele
          echipei, evaluările acordate și istoricul activității. Ele fac parte din munca echipei, așa că le păstrăm,
          dar apar ca fiind ale unui „Utilizator șters”.
        </li>
        <li>
          Unele notificări primite de alți utilizatori înainte de ștergere pot conține numele tău în textul lor
          (de exemplu, „X a adăugat un document”) până când acești utilizatori le șterg.
        </li>
      </ul>
      <p>Dacă nu mai ai acces la cont, poți cere ștergerea la {mail}.</p>

      <h2>8. Drepturile tale</h2>
      <p>Conform GDPR, ai dreptul:</p>
      <ul>
        <li>să afli ce date deținem despre tine și să primești o copie a lor (dreptul de acces);</li>
        <li>să corectezi datele inexacte: majoritatea le poți modifica direct din pagina Setări;</li>
        <li>să ceri ștergerea datelor („dreptul de a fi uitat”);</li>
        <li>să ceri restricționarea prelucrării sau să te opui prelucrării bazate pe interes legitim;</li>
        <li>să primești datele într-un format structurat, pentru a le transfera (portabilitate);</li>
        <li>să îți retragi consimțământul pentru datele opționale, fără a afecta prelucrarea anterioară;</li>
        <li>
          să depui o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter
          Personal (<a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">dataprotection.ro</a>).
        </li>
      </ul>
      <p>Pentru a-ți exercita drepturile, scrie la {mail}. Răspundem în cel mult 30 de zile.</p>

      <h2>9. Securitate</h2>
      <p>
        Parolele și PIN-urile sunt stocate doar sub formă de hash (bcrypt), codurile trimise pe email doar sub formă
        de hash și expiră după 15 minute, iar sesiunile folosesc token-uri cu durată scurtă de viață. Adresa de email
        este confirmată printr-un cod înainte de activarea contului. După 5 încercări greșite de parolă sau PIN,
        contul se blochează temporar, iar numărul de cereri pe care le poate face o adresă IP este limitat.
        Opțional, poți activa din Setări un <strong>PIN de securitate</strong>, cerut la autentificare după parolă.
        Totuși, nicio metodă de transmitere sau stocare nu este complet sigură, iar platforma este un proiect
        academic și de portofoliu, nu un serviciu comercial.
      </p>

      <h2>10. Vârsta minimă</h2>
      <p>Platforma se adresează studenților și cadrelor didactice. Nu îți poți crea cont dacă ai sub 16 ani.</p>

      <h2>11. Modificări ale acestei politici</h2>
      <p>
        Dacă modificăm această politică, actualizăm data de mai sus. Pentru schimbări importante, te anunțăm
        prin email sau printr-o notificare în aplicație.
      </p>

      <p className="mt-8">
        Vezi și <Link href="/terms">Termenii și condițiile</Link>.
      </p>
    </>
  );
}
