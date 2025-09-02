import Header from "../components/header"

export default function ObchodniPodminkyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Všeobecné obchodní podmínky
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tyto všeobecné obchodní podmínky upravují vzájemná práva a povinnosti mezi námi a vámi.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto prose prose-lg">
          
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Základní informace o společnosti</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p><strong>Společnost:</strong> Italské Brašnářství s.r.o.</p>
              <p><strong>Sídlo:</strong> Těhov 437, 250 84 Křenice, Česko</p>
              <p><strong>IČO:</strong> 17322014</p>
              <p><strong>Zapsáno v obchodním rejstříku pod sp. zn.:</strong> C 369886/MSPH vedeném u Městského soudu v Praze</p>
              <p><strong>E-mail:</strong> info@italskebrasnarstvi.cz</p>
              <p><strong>Telefon:</strong> +420 774 977 971</p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Úvodní ustanovení</h2>
            <p className="mb-4">
              Tyto všeobecné obchodní podmínky ("Podmínky") společnosti Italské Brašnářství s.r.o. upravují v souladu s ustanovením § 1751 odst. 1 zákona č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů ("Občanský zákoník") vzájemná práva a povinnosti Vás, jakožto kupujících, a Nás, jakožto prodávajících, vzniklé v souvislosti nebo na základě kupní smlouvy ("Smlouva") uzavřené prostřednictvím E-shopu na webových stránkách www.italskebrasnarstvi.cz
            </p>
            <p className="mb-4">
              Všechny informace o zpracování Vašich osobních údajů jsou obsaženy v Zásadách zpracování osobních údajů.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definice</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Cena</strong> je finanční částka, kterou budete hradit za Zboží</li>
              <li><strong>Cena za dopravu</strong> je finanční částka, kterou budete hradit za doručení Zboží</li>
              <li><strong>Celková cena</strong> je součet Ceny a Ceny za dopravu</li>
              <li><strong>DPH</strong> je daň z přidané hodnoty dle platných právních předpisů</li>
              <li><strong>Objednávka</strong> je Váš závazný návrh na uzavření Smlouvy o koupi Zboží s Námi</li>
              <li><strong>Zboží</strong> je vše, co můžete nakoupit na E-shopu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Uzavření smlouvy</h2>
            <p className="mb-4">
              Smlouvu s Námi je možné uzavřít pouze v českém jazyce prostřednictvím E-shopu. K uzavření Smlouvy je třeba, abyste na E-shopu vytvořili Objednávku obsahující:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Informace o nakupovaném Zboží</li>
              <li>Informace o Ceně, Ceně za dopravu a způsobu platby</li>
              <li>Své identifikační a kontaktní údaje</li>
            </ul>
            <p className="mb-4">
              Vaši Objednávku Vám v co nejkratší době potvrdíme zprávou odeslanou na Vaši e-mailovou adresu. Potvrzením Objednávky dochází k uzavření Smlouvy mezi Námi a Vámi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cenové a platební podmínky</h2>
            <p className="mb-4">
              Cena je vždy uvedena v rámci E-shopu včetně DPH včetně veškerých poplatků stanovených zákonem. Úhradu Celkové ceny můžete provést následujícími způsoby:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Bankovním převodem (splatnost do 3 dnů)</li>
              <li>Kartou online přes platební bránu Stripe</li>
              <li>Dobírkou při doručení Zboží</li>
              <li>Hotově při osobním odběru</li>
            </ul>
            <p className="mb-4">
              Vlastnické právo ke Zboží na Vás přechází až poté, co zaplatíte Celkovou cenu a Zboží převezmete.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Doručení zboží</h2>
            <p className="mb-4">
              Zboží Vám bude doručeno nejpozději do 14 dnů způsobem dle Vaší volby:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Osobní odběr na Naší provozovně</li>
              <li>Osobní odběr na výdejních místech (Zásilkovna, Balíkovna)</li>
              <li>Doručení prostřednictvím dopravních společností (DPD, Zásilkovna)</li>
            </ul>
            <p className="mb-4">
              Po převzetí Zboží je Vaše povinnost zkontrolovat neporušenost obalu a v případě závad tuto skutečnost neprodleně oznámit dopravci a Nám.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Práva z vadného plnění (reklamace)</h2>
            <p className="mb-4">
              V případě, že bude mít Zboží vadu, můžete Nám takovou vadu oznámit a uplatnit práva z vadného plnění zasláním e-mailu či dopisu na Naše adresy. Máte následující práva:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Na odstranění vady dodáním nového Zboží bez vady</li>
              <li>Na odstranění vady opravou Zboží</li>
              <li>Na přiměřenou slevu z Ceny</li>
              <li>Na odstoupení od Smlouvy</li>
            </ul>
            <p className="mb-4">
              Reklamaci vyřídíme do 30 dnů od obdržení. Pokud jste spotřebitel, máte právo uplatit práva z vadného plnění u vady, která se vyskytne u spotřebního Zboží ve lhůtě 24 měsíců od převzetí Zboží.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Odstoupení od smlouvy</h2>
            <p className="mb-4">
              V případě, že jste spotřebitel, máte v souladu s ustanovením §1829 občanského zákoníku právo odstoupit od Smlouvy bez udání důvodu ve lhůtě 14 dnů ode dne uzavření Smlouvy, resp. pokud se jedná o koupi zboží, pak do čtrnácti dnů od jeho převzetí.
            </p>
            <p className="mb-4">
              V případě odstoupení od Smlouvy jste povinni Nám Zboží zaslat do 14 dnů od odstoupení a nesete náklady spojené s navrácením zboží k Nám.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Řešení sporů</h2>
            <p className="mb-4">
              Vyřizování stížností spotřebitelů zajišťujeme prostřednictvím elektronické adresy info@italskebrasnarstvi.cz
            </p>
            <p className="mb-4">
              K mimosoudnímu řešení spotřebitelských sporů ze Smlouvy je příslušná Česká obchodní inspekce, se sídlem Štěpánská 796/44, 110 00 Praha 1, internetová adresa: http://www.coi.cz
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Závěrečná ustanovení</h2>
            <p className="mb-4">
              Pokud Náš a Váš právní vztah obsahuje mezinárodní prvek, bude se vztah vždy řídit právem České republiky.
            </p>
            <p className="mb-4">
              Tyto Podmínky nabývají účinnosti 9.1.2024.
            </p>
          </section>

          <div className="bg-blue-50 p-6 rounded-lg mt-12">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Máte otázky k obchodním podmínkám?</h3>
            <p className="text-blue-800 mb-4">
              V případě nejasností nás neváhejte kontaktovat na e-mailu info@italskebrasnarstvi.cz nebo telefonním čísle +420 774 977 971.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}