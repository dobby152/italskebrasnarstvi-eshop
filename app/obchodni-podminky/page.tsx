import Header from "../components/header"

export default function ObchodniPodminkyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Vaeobecn� obchodn� podm�nky
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tyto vaeobecn� obchodn� podm�nky upravuj� vz�jemn� pr�va a povinnosti mezi n�mi a v�mi.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto prose prose-lg">
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Z�kladn� informace o spolenosti</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p><strong>Spolenost:</strong> Italsk� Braan�Ystv� s.r.o.</p>
              <p><strong>S�dlo:</strong> TYeaHov� 437, 250 84 KYenice, esko</p>
              <p><strong>IO:</strong> 17322014</p>
              <p><strong>Zaps�no v obchodn�m rejstY�ku pod sp. zn.:</strong> C 369886/MSPH veden�m u Mstsk� soud v Praze</p>
              <p><strong>E-mail:</strong> info@italskeBrasnarstvi.cz</p>
              <p><strong>Telefon:</strong> +420 774 977 971</p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. �vodn� ustanoven�</h2>
            <p className="mb-4">
              Tyto vaeobecn� obchodn� podm�nky ("Podm�nky") spolenosti Italsk� Braan�Ystv� s.r.o. upravuj� v souladu s ustanoven�m � 1751 odst. 1 z�kona . 89/2012 Sb., obansk� z�kon�k, ve znn� pozdja�ch pYedpiso ("Obansk� z�kon�k") vz�jemn� pr�va a povinnosti V�s, jako~to kupuj�c�ch, a N�s, jako~to prod�vaj�c�ch, vznikl� v souvislosti nebo na z�klad kupn� smlouvy ("Smlouva") uzavYen� prostYednictv�m E-shopu na webov�ch str�nk�ch www.italskebrasnarstvi.cz
            </p>
            <p className="mb-4">
              Vaechny informace o zpracov�n� Vaaich osobn�ch �dajo jsou obsa~eny v Z�sad�ch zpracov�n� osobn�ch �dajo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definice</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Cena</strong> je finann� �stka, kterou budete hradit za Zbo~�</li>
              <li><strong>Cena za dopravu</strong> je finann� �stka, kterou budete hradit za doruen� Zbo~�</li>
              <li><strong>Celkov� cena</strong> je souet Ceny a Ceny za dopravu</li>
              <li><strong>DPH</strong> je daH z pYidan� hodnoty dle platn�ch pr�vn�ch pYedpiso</li>
              <li><strong>Objedn�vka</strong> je V�a z�vazn� n�vrh na uzavYen� Smlouvy o koupi Zbo~� s N�mi</li>
              <li><strong>Zbo~�</strong> je vae, co mo~ete nakoupit na E-shopu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. UzavYen� smlouvy</h2>
            <p className="mb-4">
              Smlouvu s N�mi je mo~n� uzavY�t pouze v esk�m jazyce prostYednictv�m E-shopu. K uzavYen� Smlouvy je tYeba, abyste na E-shopu vytvoYili Objedn�vku obsahuj�c�:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Informace o nakupovan�m Zbo~�</li>
              <li>Informace o Cen, Cen za dopravu a zposobu platby</li>
              <li>Sv� identifikan� a kontaktn� �daje</li>
            </ul>
            <p className="mb-4">
              Vaai Objedn�vku V�m v co nejkrata� dob potvrd�me zpr�vou odeslanou na Vaai e-mailovou adresu. Potvrzen�m Objedn�vky doch�z� k uzavYen� Smlouvy mezi N�mi a V�mi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cenov� a platebn� podm�nky</h2>
            <p className="mb-4">
              Cena je v~dy uvedena v r�mci E-shopu vetn DPH vetn veaker�ch poplatko stanoven�ch z�konem. �hradu Celkov� ceny mo~ete prov�st n�sleduj�c�mi zposoby:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Bankovn�m pYevodem (splatnost do 3 dno)</li>
              <li>Kartou online pYes platebn� br�nu Stripe</li>
              <li>Dob�rkou pYi doruen� Zbo~�</li>
              <li>Hotov pYi osobn�m odbru</li>
            </ul>
            <p className="mb-4">
              Vlastnick� pr�vo ke Zbo~� na V�s pYech�z� a~ pot�, co zaplat�te Celkovou cenu a Zbo~� pYevezmete.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Doruen� zbo~�</h2>
            <p className="mb-4">
              Zbo~� V�m bude dorueno nejpozdji do 14 dn� zposobem dle Vaa� volby:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Osobn� odbr na Naa� provozovn</li>
              <li>Osobn� odbr na v�dejn�ch m�stech (Z�silkovna, Bal�kovna)</li>
              <li>Doruen� prostYednictv�m dopravn�ch spolenost� (DPD, Z�silkovna)</li>
            </ul>
            <p className="mb-4">
              Po pYevzet� Zbo~� je Vaae povinnost zkontrolovat neporuaenost obalu a v pY�pad z�vad tuto skutenost neprodlen ozn�mit dopravci a N�m.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Pr�va z vadn�ho plnn� (reklamace)</h2>
            <p className="mb-4">
              V pY�pad, ~e bude m�t Zbo~� vadu, mo~ete N�m takovou vadu ozn�mit a uplatnit pr�va z vadn�ho plnn� zasl�n�m e-mailu i dopisu na Naae adresy. M�te n�sleduj�c� pr�va:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Na odstrann� vady dod�n�m nov�ho Zbo~� bez vady</li>
              <li>Na odstrann� vady opravou Zbo~�</li>
              <li>Na pYimYenou slevu z Ceny</li>
              <li>Na odstoupen� od Smlouvy</li>
            </ul>
            <p className="mb-4">
              Reklamaci vyY�d�me do 30 dno od obdr~en�. Pokud jste spotYebitel, m�te pr�vo uplatit pr�va z vadn�ho plnn� u vady, kter� se vyskytne u spotYebn�ho Zbo~� ve lhot 24 ms�co od pYevzet� Zbo~�.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Odstoupen� od smlouvy</h2>
            <p className="mb-4">
              V pY�pad, ~e jste spotYebitel, m�te v souladu s ustanoven�m �1829 obansk�ho z�kon�ku pr�vo odstoupit od Smlouvy bez ud�n� dovodu ve lhot 14 dno ode dne uzavYen� Smlouvy, resp. pokud se jedn� o koupi zbo~�, pak do trn�cti dno od jeho pYevzet�.
            </p>
            <p className="mb-4">
              V pY�pad odstoupen� od Smlouvy jste povinni N�m Zbo~� zaslat do 14 dno od odstoupen� a nesete n�klady spojen� s navr�cen�m zbo~� k N�m.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Xeaen� sporo</h2>
            <p className="mb-4">
              VyYizov�n� st�~nost� spotYebitelo zajiaeujeme prostYednictv�m elektronick� adresy info@italskeBrasnarstvi.cz
            </p>
            <p className="mb-4">
              K mimosoudn�mu Yeaen� spotYebitelsk�ch sporo ze Smlouvy je pY�sluan� esk� obchodn� inspekce, se s�dlem `tp�nsk� 796/44, 110 00 Praha 1, internetov� adresa: http://www.coi.cz
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Z�vren� ustanoven�</h2>
            <p className="mb-4">
              Pokud N�a a V�a pr�vn� vztah obsahuje mezin�rodn� prvek, bude se vztah v~dy Y�dit pr�vem esk� republiky.
            </p>
            <p className="mb-4">
              Tyto Podm�nky nab�vaj� �innosti 9.1.2024.
            </p>
          </section>

          <div className="bg-blue-50 p-6 rounded-lg mt-12">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">M�te ot�zky k obchodn�m podm�nk�m?</h3>
            <p className="text-blue-800 mb-4">
              V pY�pad nejasnost� n�s nev�hejte kontaktovat na e-mailu info@italskeBrasnarstvi.cz nebo telefonn�m �sle +420 774 977 971.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}