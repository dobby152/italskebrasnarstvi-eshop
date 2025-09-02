import Header from "../components/header"

export default function ObchodniPodminkyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Vaeobecné obchodní podmínky
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tyto vaeobecné obchodní podmínky upravují vzájemná práva a povinnosti mezi námi a vámi.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto prose prose-lg">
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Základní informace o spolenosti</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p><strong>Spolenost:</strong> Italské BraanáYství s.r.o.</p>
              <p><strong>Sídlo:</strong> TYeaHová 437, 250 84 KYenice, esko</p>
              <p><strong>IO:</strong> 17322014</p>
              <p><strong>Zapsáno v obchodním rejstYíku pod sp. zn.:</strong> C 369886/MSPH vedeném u Mstský soud v Praze</p>
              <p><strong>E-mail:</strong> info@italskeBrasnarstvi.cz</p>
              <p><strong>Telefon:</strong> +420 774 977 971</p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Úvodní ustanovení</h2>
            <p className="mb-4">
              Tyto vaeobecné obchodní podmínky ("Podmínky") spolenosti Italské BraanáYství s.r.o. upravují v souladu s ustanovením § 1751 odst. 1 zákona . 89/2012 Sb., obanský zákoník, ve znní pozdjaích pYedpiso ("Obanský zákoník") vzájemná práva a povinnosti Vás, jako~to kupujících, a Nás, jako~to prodávajících, vzniklá v souvislosti nebo na základ kupní smlouvy ("Smlouva") uzavYené prostYednictvím E-shopu na webových stránkách www.italskebrasnarstvi.cz
            </p>
            <p className="mb-4">
              Vaechny informace o zpracování Vaaich osobních údajo jsou obsa~eny v Zásadách zpracování osobních údajo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definice</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Cena</strong> je finanní ástka, kterou budete hradit za Zbo~í</li>
              <li><strong>Cena za dopravu</strong> je finanní ástka, kterou budete hradit za doruení Zbo~í</li>
              <li><strong>Celková cena</strong> je souet Ceny a Ceny za dopravu</li>
              <li><strong>DPH</strong> je daH z pYidané hodnoty dle platných právních pYedpiso</li>
              <li><strong>Objednávka</strong> je Váa závazný návrh na uzavYení Smlouvy o koupi Zbo~í s Námi</li>
              <li><strong>Zbo~í</strong> je vae, co mo~ete nakoupit na E-shopu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. UzavYení smlouvy</h2>
            <p className="mb-4">
              Smlouvu s Námi je mo~né uzavYít pouze v eském jazyce prostYednictvím E-shopu. K uzavYení Smlouvy je tYeba, abyste na E-shopu vytvoYili Objednávku obsahující:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Informace o nakupovaném Zbo~í</li>
              <li>Informace o Cen, Cen za dopravu a zposobu platby</li>
              <li>Své identifikaní a kontaktní údaje</li>
            </ul>
            <p className="mb-4">
              Vaai Objednávku Vám v co nejkrataí dob potvrdíme zprávou odeslanou na Vaai e-mailovou adresu. Potvrzením Objednávky dochází k uzavYení Smlouvy mezi Námi a Vámi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cenové a platební podmínky</h2>
            <p className="mb-4">
              Cena je v~dy uvedena v rámci E-shopu vetn DPH vetn veakerých poplatko stanovených zákonem. Úhradu Celkové ceny mo~ete provést následujícími zposoby:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Bankovním pYevodem (splatnost do 3 dno)</li>
              <li>Kartou online pYes platební bránu Stripe</li>
              <li>Dobírkou pYi doruení Zbo~í</li>
              <li>Hotov pYi osobním odbru</li>
            </ul>
            <p className="mb-4">
              Vlastnické právo ke Zbo~í na Vás pYechází a~ poté, co zaplatíte Celkovou cenu a Zbo~í pYevezmete.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Doruení zbo~í</h2>
            <p className="mb-4">
              Zbo~í Vám bude dorueno nejpozdji do 14 dní zposobem dle Vaaí volby:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Osobní odbr na Naaí provozovn</li>
              <li>Osobní odbr na výdejních místech (Zásilkovna, Balíkovna)</li>
              <li>Doruení prostYednictvím dopravních spoleností (DPD, Zásilkovna)</li>
            </ul>
            <p className="mb-4">
              Po pYevzetí Zbo~í je Vaae povinnost zkontrolovat neporuaenost obalu a v pYípad závad tuto skutenost neprodlen oznámit dopravci a Nám.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Práva z vadného plnní (reklamace)</h2>
            <p className="mb-4">
              V pYípad, ~e bude mít Zbo~í vadu, mo~ete Nám takovou vadu oznámit a uplatnit práva z vadného plnní zasláním e-mailu i dopisu na Naae adresy. Máte následující práva:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Na odstranní vady dodáním nového Zbo~í bez vady</li>
              <li>Na odstranní vady opravou Zbo~í</li>
              <li>Na pYimYenou slevu z Ceny</li>
              <li>Na odstoupení od Smlouvy</li>
            </ul>
            <p className="mb-4">
              Reklamaci vyYídíme do 30 dno od obdr~ení. Pokud jste spotYebitel, máte právo uplatit práva z vadného plnní u vady, která se vyskytne u spotYebního Zbo~í ve lhot 24 msíco od pYevzetí Zbo~í.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Odstoupení od smlouvy</h2>
            <p className="mb-4">
              V pYípad, ~e jste spotYebitel, máte v souladu s ustanovením §1829 obanského zákoníku právo odstoupit od Smlouvy bez udání dovodu ve lhot 14 dno ode dne uzavYení Smlouvy, resp. pokud se jedná o koupi zbo~í, pak do trnácti dno od jeho pYevzetí.
            </p>
            <p className="mb-4">
              V pYípad odstoupení od Smlouvy jste povinni Nám Zbo~í zaslat do 14 dno od odstoupení a nesete náklady spojené s navrácením zbo~í k Nám.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Xeaení sporo</h2>
            <p className="mb-4">
              VyYizování stí~ností spotYebitelo zajiaeujeme prostYednictvím elektronické adresy info@italskeBrasnarstvi.cz
            </p>
            <p className="mb-4">
              K mimosoudnímu Yeaení spotYebitelských sporo ze Smlouvy je pYísluaná eská obchodní inspekce, se sídlem `tpánská 796/44, 110 00 Praha 1, internetová adresa: http://www.coi.cz
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Závrená ustanovení</h2>
            <p className="mb-4">
              Pokud Náa a Váa právní vztah obsahuje mezinárodní prvek, bude se vztah v~dy Yídit právem eské republiky.
            </p>
            <p className="mb-4">
              Tyto Podmínky nabývají úinnosti 9.1.2024.
            </p>
          </section>

          <div className="bg-blue-50 p-6 rounded-lg mt-12">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Máte otázky k obchodním podmínkám?</h3>
            <p className="text-blue-800 mb-4">
              V pYípad nejasností nás neváhejte kontaktovat na e-mailu info@italskeBrasnarstvi.cz nebo telefonním ísle +420 774 977 971.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}