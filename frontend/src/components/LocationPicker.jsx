import { useState, useRef, useEffect } from 'react';

const ILLER = {
  "Adana": ["Aladağ","Ceyhan","Çukurova","Feke","İmamoğlu","Karaisalı","Karataş","Kozan","Pozantı","Saimbeyli","Sarıçam","Seyhan","Tufanbeyli","Yumurtalık","Yüreğir"],
  "Adıyaman": ["Adıyaman Merkez","Besni","Çelikhan","Gerger","Gölbaşı","Kahta","Samsat","Sincik","Tut"],
  "Afyonkarahisar": ["Afyon Merkez","Başmakçı","Bayat","Bolvadin","Çay","Çobanlar","Dazkırı","Dinar","Emirdağ","Evciler","Hocalar","İhsaniye","İscehisar","Kızılören","Sandıklı","Sinanpaşa","Sultandağı","Şuhut"],
  "Ağrı": ["Ağrı Merkez","Diyadin","Doğubayazıt","Eleşkirt","Hamur","Patnos","Taşlıçay","Tutak"],
  "Aksaray": ["Aksaray Merkez","Ağaçören","Eskil","Gülağaç","Güzelyurt","Ortaköy","Sarıyahşi"],
  "Amasya": ["Amasya Merkez","Göynücek","Gümüşhacıköy","Hamamözü","Merzifon","Suluova","Taşova"],
  "Ankara": ["Altındağ","Ayaş","Bala","Beypazarı","Çamlıdere","Çankaya","Çubuk","Elmadağ","Etimesgut","Evren","Gölbaşı","Güdül","Haymana","Kalecik","Kazan","Keçiören","Kızılcahamam","Mamak","Nallıhan","Polatlı","Pursaklar","Sincan","Şereflikoçhisar","Yenimahalle"],
  "Antalya": ["Aksu","Alanya","Demre","Döşemealtı","Elmalı","Finike","Gazipaşa","Gündoğmuş","İbradı","Kaş","Kemer","Kepez","Konyaaltı","Korkuteli","Kumluca","Manavgat","Muratpaşa","Serik"],
  "Ardahan": ["Ardahan Merkez","Çıldır","Damal","Göle","Hanak","Posof"],
  "Artvin": ["Ardanuç","Arhavi","Artvin Merkez","Borçka","Hopa","Murgul","Şavşat","Yusufeli"],
  "Aydın": ["Bozdoğan","Buharkent","Çine","Didim","Efeler","Germencik","İncirliova","Karacasu","Karpuzlu","Koçarlı","Köşk","Kuşadası","Kuyucak","Nazilli","Söke","Sultanhisar","Yenipazar"],
  "Balıkesir": ["Altıeylül","Ayvalık","Balya","Bandırma","Bigadiç","Burhaniye","Dursunbey","Edremit","Erdek","Gömeç","Gönen","Havran","İvrindi","Karesi","Kepsut","Manyas","Marmara","Savaştepe","Sındırgı","Susurluk"],
  "Bartın": ["Amasra","Bartın Merkez","Kurucaşile","Ulus"],
  "Batman": ["Batman Merkez","Beşiri","Gercüş","Hasankeyf","Kozluk","Sason"],
  "Bayburt": ["Aydıntepe","Bayburt Merkez","Demirözü"],
  "Bilecik": ["Bilecik Merkez","Bozüyük","Gölpazarı","İnhisar","Osmaneli","Pazaryeri","Söğüt","Yenipazar"],
  "Bingöl": ["Adaklı","Bingöl Merkez","Genç","Karlıova","Kiğı","Solhan","Yayladere","Yedisu"],
  "Bitlis": ["Adilcevaz","Ahlat","Bitlis Merkez","Güroymak","Hizan","Mutki","Tatvan"],
  "Bolu": ["Bolu Merkez","Dörtdivan","Gerede","Göynük","Kıbrıscık","Mengen","Mudurnu","Seben","Yeniçağa"],
  "Burdur": ["Ağlasun","Altınyayla","Bucak","Burdur Merkez","Çavdır","Çeltikçi","Gölhisar","Karamanlı","Kemer","Tefenni","Yeşilova"],
  "Bursa": ["Büyükorhan","Gemlik","Gürsu","Harmancık","İnegöl","İznik","Karacabey","Keles","Kestel","Mudanya","Mustafakemalpaşa","Nilüfer","Orhaneli","Orhangazi","Osmangazi","Yenişehir","Yıldırım"],
  "Çanakkale": ["Ayvacık","Bayramiç","Biga","Bozcaada","Çan","Çanakkale Merkez","Eceabat","Ezine","Gelibolu","Gökçeada","Lapseki","Yenice"],
  "Çankırı": ["Atkaracalar","Bayramören","Çankırı Merkez","Eldivan","Ilgaz","Khanönü","Korgun","Kurşunlu","Orta","Şabanözü","Yapraklı"],
  "Çorum": ["Alaca","Bayat","Boğazkale","Çorum Merkez","Dodurga","İskilip","Kargı","Laçin","Mecitözü","Ortaköy","Osmancık","Sungurlu","Uğurludağ"],
  "Denizli": ["Acıpayam","Babadağ","Baklan","Bekilli","Beyağaç","Bozkurt","Buldan","Çal","Çameli","Çardak","Çivril","Güney","Honaz","Kale","Merkezefendi","Pamukkale","Sarayköy","Serinhisar","Tavas"],
  "Diyarbakır": ["Bağlar","Bismil","Çermik","Çınar","Çüngüş","Dicle","Eğil","Ergani","Hani","Hazro","Kayapınar","Kocaköy","Kulp","Lice","Silvan","Sur","Yenişehir"],
  "Düzce": ["Akçakoca","Cumayeri","Çilimli","Düzce Merkez","Gölköy","Gölyaka","Kaynaşlı","Yığılca"],
  "Edirne": ["Edirne Merkez","Enez","Havsa","İpsala","Keşan","Lalapaşa","Meriç","Süloğlu","Uzunköprü"],
  "Elazığ": ["Ağın","Alacakaya","Arıcak","Baskil","Elazığ Merkez","Karakoçan","Keban","Kovancılar","Maden","Palu","Sivrice"],
  "Erzincan": ["Çayırlı","Erzincan Merkez","İliç","Kemah","Kemaliye","Otlukbeli","Refahiye","Tercan","Üzümlü"],
  "Erzurum": ["Aşkale","Aziziye","Çat","Hınıs","Horasan","İspir","Karaçoban","Karayazı","Köprüköy","Narman","Oltu","Olur","Palandöken","Pasinler","Pazaryolu","Şenkaya","Tekman","Tortum","Uzundere","Yakutiye"],
  "Eskişehir": ["Alpu","Beylikova","Çifteler","Günyüzü","Han","İnönü","Mahmudiye","Mihalgazi","Mihallıçcık","Odunpazarı","Sarıcakaya","Seyitgazi","Sivrihisar","Tepebaşı"],
  "Gaziantep": ["Araban","İslahiye","Karkamış","Nizip","Nurdağı","Oğuzeli","Şahinbey","Şehitkamil","Yavuzeli"],
  "Giresun": ["Alucra","Bulancak","Çamoluk","Çanakçı","Dereli","Doğankent","Espiye","Eynesil","Giresun Merkez","Görele","Güce","Keşap","Piraziz","Şebinkarahisar","Tirebolu","Yağlıdere"],
  "Gümüşhane": ["Gümüşhane Merkez","Kelkit","Köse","Kürtün","Şiran","Torul"],
  "Hakkari": ["Çukurca","Hakkari Merkez","Şemdinli","Yüksekova"],
  "Hatay": ["Altınözü","Antakya","Arsuz","Belen","Defne","Dörtyol","Erzin","Hassa","İskenderun","Kırıkhan","Kumlu","Payas","Reyhanlı","Samandağ","Yayladağı"],
  "Iğdır": ["Aralık","Iğdır Merkez","Karakoyunlu","Tuzluca"],
  "Isparta": ["Aksu","Atabey","Eğirdir","Gelendost","Gönen","Keçiborlu","Isparta Merkez","Senirkent","Sütçüler","Şarkikaraağaç","Uluborlu","Yalvaç","Yenişarbademli"],
  "İstanbul": ["Adalar","Arnavutköy","Ataşehir","Avcılar","Bağcılar","Bahçelievler","Bakırköy","Başakşehir","Bayrampaşa","Beşiktaş","Beykoz","Beylikdüzü","Beyoğlu","Büyükçekmece","Çatalca","Çekmeköy","Esenler","Esenyurt","Eyüpsultan","Fatih","Gaziosmanpaşa","Güngören","Kadıköy","Kağıthane","Kartal","Küçükçekmece","Maltepe","Pendik","Sancaktepe","Sarıyer","Silivri","Sultanbeyli","Sultangazi","Şile","Şişli","Tuzla","Ümraniye","Üsküdar","Zeytinburnu"],
  "İzmir": ["Aliağa","Balçova","Bayındır","Bayraklı","Bergama","Beydağ","Bornova","Buca","Çeşme","Çiğli","Dikili","Foça","Gaziemir","Güzelbahçe","Karabağlar","Karaburun","Karşıyaka","Kemalpaşa","Kınık","Kiraz","Konak","Menderes","Menemen","Narlıdere","Ödemiş","Seferihisar","Selçuk","Tire","Torbalı","Urla"],
  "Kahramanmaraş": ["Afşin","Andırın","Çağlayancerit","Dulkadiroğlu","Ekinözü","Elbistan","Göksun","Nurhak","Onikişubat","Pazarcık","Türkoğlu"],
  "Karabük": ["Eflani","Eskipazar","Karabük Merkez","Ovacık","Safranbolu","Yenice"],
  "Karaman": ["Ayrancı","Başyayla","Ermenek","Kazımkarabekir","Karaman Merkez","Sarıveliler"],
  "Kars": ["Akyaka","Arpaçay","Digor","Kağızman","Kars Merkez","Sarıkamış","Selim","Susuz"],
  "Kastamonu": ["Abana","Ağlı","Araç","Azdavay","Bozkurt","Cide","Çatalzeytin","Daday","Devrekani","Doğanyurt","Hanönü","İhsangazi","İnebolu","Kastamonu Merkez","Küre","Pınarbaşı","Seydiler","Şenpazar","Taşköprü","Tosya"],
  "Kayseri": ["Akkışla","Bünyan","Develi","Felahiye","Hacılar","İncesu","Kocasinan","Melikgazi","Özvatan","Pınarbaşı","Sarıoğlan","Sarız","Talas","Tomarza","Yahyalı","Yeşilhisar"],
  "Kırıkkale": ["Bahşılı","Balışeyh","Çelebi","Delice","Karakeçili","Keskin","Kırıkkale Merkez","Sulakyurt","Yahşihan"],
  "Kırklareli": ["Babaeski","Demirköy","Kırklareli Merkez","Kofçaz","Lüleburgaz","Pehlivanköy","Pınarhisar","Vize"],
  "Kırşehir": ["Akçakent","Akpınar","Boztepe","Çiçekdağı","Kaman","Kırşehir Merkez","Mucur"],
  "Kilis": ["Elbeyli","Kilis Merkez","Musabeyli","Polateli"],
  "Kocaeli": ["Başiskele","Çayırova","Darıca","Derince","Dilovası","Gebze","Gölcük","İzmit","Kandıra","Karamürsel","Kartepe","Körfez"],
  "Konya": ["Ahırlı","Akören","Akşehir","Altınekin","Beyşehir","Bozkır","Cihanbeyli","Çeltik","Çumra","Derbent","Derebucak","Doğanhisar","Emirgazi","Ereğli","Güneysınır","Hadim","Halkapınar","Hüyük","Ilgın","Kadınhanı","Karapınar","Karatay","Kulu","Meram","Sarayönü","Selçuklu","Seydişehir","Taşkent","Tuzlukçu","Yalıhüyük","Yunak"],
  "Kütahya": ["Altıntaş","Aslanapa","Çavdarhisar","Domaniç","Dumlupınar","Emet","Gediz","Hisarcık","Kütahya Merkez","Pazarlar","Şaphane","Simav","Tavşanlı"],
  "Malatya": ["Akçadağ","Arapgir","Arguvan","Battalgazi","Darende","Doğanşehir","Doğanyol","Hekimhan","Kale","Kuluncak","Pütürge","Yazıhan","Yeşilyurt"],
  "Manisa": ["Ahmetli","Akhisar","Alaşehir","Demirci","Gölmarmara","Gördes","Kırkağaç","Köprübaşı","Kula","Sarıgöl","Saruhanlı","Selendi","Soma","Şehzadeler","Turgutlu","Yunusemre"],
  "Mardin": ["Artuklu","Dargeçit","Derik","Kızıltepe","Mazıdağı","Midyat","Nusaybin","Ömerli","Savur","Yeşilli"],
  "Mersin": ["Akdeniz","Anamur","Aydıncık","Bozyazı","Çamlıyayla","Erdemli","Gülnar","Mezitli","Mut","Silifke","Tarsus","Toroslar","Yenişehir"],
  "Muğla": ["Bodrum","Dalaman","Datça","Fethiye","Kavaklıdere","Köyceğiz","Marmaris","Menteşe","Milas","Ortaca","Seydikemer","Ula","Yatağan"],
  "Muş": ["Bulanık","Hasköy","Korkut","Malazgirt","Muş Merkez","Varto"],
  "Nevşehir": ["Acıgöl","Avanos","Derinkuyu","Gülşehir","Hacıbektaş","Kozaklı","Nevşehir Merkez","Ürgüp"],
  "Niğde": ["Altunhisar","Bor","Çamardı","Çiftlik","Niğde Merkez","Ulukışla"],
  "Ordu": ["Akkuş","Altınordu","Aybastı","Çamaş","Çatalpınar","Çaybaşı","Fatsa","Gölköy","Gülyalı","Gürgentepe","İkizce","Kabadüz","Kabataş","Korgan","Kumru","Mesudiye","Perşembe","Ulubey","Ünye"],
  "Osmaniye": ["Bahçe","Düziçi","Hasanbeyli","Kadirli","Osmaniye Merkez","Sumbas","Toprakkale"],
  "Rize": ["Ardeşen","Çamlıhemşin","Çayeli","Derepazarı","Fındıklı","Güneysu","Hemşin","İkizdere","İyidere","Kalkandere","Pazar","Rize Merkez"],
  "Sakarya": ["Adapazarı","Akyazı","Arifiye","Erenler","Ferizli","Geyve","Hendek","Karapürçek","Karasu","Kaynarca","Kocaali","Mithatpaşa","Pamukova","Sapanca","Serdivan","Söğütlü","Taraklı"],
  "Samsun": ["19 Mayıs","Alaçam","Asarcık","Atakum","Ayvacık","Bafra","Canik","Çarşamba","Havza","İlkadım","Kavak","Ladik","Salıpazarı","Tekkeköy","Terme","Vezirköprü","Yakakent"],
  "Siirt": ["Baykan","Eruh","Kurtalan","Pervari","Siirt Merkez","Şirvan","Tillo"],
  "Sinop": ["Ayancık","Boyabat","Dikmen","Durağan","Erfelek","Gerze","Saraydüzü","Sinop Merkez","Türkeli"],
  "Sivas": ["Akıncılar","Altınyayla","Divriği","Doğanşar","Gemerek","Gölova","Hafik","İmranlı","Kangal","Koyulhisar","Sivas Merkez","Suşehri","Şarkışla","Ulaş","Yıldızeli","Zara"],
  "Şanlıurfa": ["Akçakale","Birecik","Bozova","Ceylanpınar","Eyyübiye","Halfeti","Haliliye","Harran","Hilvan","Karaköprü","Siverek","Suruç","Viranşehir"],
  "Şırnak": ["Beytüşşebap","Cizre","Güçlükonak","İdil","Silopi","Şırnak Merkez","Uludere"],
  "Tekirdağ": ["Çerkezköy","Çorlu","Ergene","Hayrabolu","Kapaklı","Malkara","Marmaraereğlisi","Muratlı","Saray","Süleymanpaşa","Şarköy"],
  "Tokat": ["Almus","Artova","Başçiftlik","Erbaa","Niksar","Pazar","Reşadiye","Sulusaray","Tokat Merkez","Turhal","Yeşilyurt","Zile"],
  "Trabzon": ["Akçaabat","Araklı","Arsin","Beşikdüzü","Çarşıbaşı","Çaykara","Dernekpazarı","Düzköy","Hayrat","Köprübaşı","Maçka","Of","Ortahisar","Sürmene","Şalpazarı","Tonya","Vakfıkebir","Yomra"],
  "Tunceli": ["Çemişgezek","Hozat","Mazgirt","Nazimiye","Ovacık","Pertek","Pülümür","Tunceli Merkez"],
  "Uşak": ["Banaz","Eşme","Karahallı","Sivaslı","Ulubey","Uşak Merkez"],
  "Van": ["Bahçesaray","Başkale","Çaldıran","Çatak","Edremit","Erciş","Gevaş","Gürpınar","İpekyolu","Muradiye","Özalp","Saray","Tuşba"],
  "Yalova": ["Altınova","Armutlu","Çınarcık","Çiftlikköy","Termal","Yalova Merkez"],
  "Yozgat": ["Akdağmadeni","Aydıncık","Boğazlıyan","Çandır","Çayıralan","Çekerek","Kadışehri","Saraykent","Sarıkaya","Şefaatli","Sorgun","Yenifakılı","Yerköy","Yozgat Merkez"],
  "Zonguldak": ["Alaplı","Çaycuma","Devrek","Gökçebey","Kilimli","Kozlu","Zonguldak Merkez"],
};

export default function LocationPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [selectedIl, setSelectedIl] = useState('');
  const [selectedIlce, setSelectedIlce] = useState('');
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const iller = Object.keys(ILLER).sort();
  const filteredIller = search ? iller.filter(il => il.toLowerCase().includes(search.toLowerCase())) : iller;

  function selectIl(il) {
    setSelectedIl(il);
    setSelectedIlce('');
    setSearch('');
  }

  function selectIlce(ilce) {
    setSelectedIlce(ilce);
    const val = selectedIl + ', ' + ilce;
    onChange(val);
    setOpen(false);
  }

  function selectIlOnly() {
    onChange(selectedIl);
    setOpen(false);
    setSelectedIlce('');
  }

  function clear() {
    setSelectedIl('');
    setSelectedIlce('');
    setSearch('');
    onChange('');
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 8,
          border: '1.5px solid', borderColor: open ? '#dc2626' : '#e0e0e0',
          background: 'white', fontSize: 14, textAlign: 'left',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: value ? '#1c1c1c' : '#aaa',
        }}
      >
        <span>{value || '📍 Şehir / İlçe seçin...'}</span>
        <span style={{ fontSize: 11, color: '#aaa' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', borderRadius: 12, border: '1.5px solid #e0e0e0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 500,
          display: 'flex', flexDirection: 'column', maxHeight: 380,
        }}>
          {/* Arama */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <input
              autoFocus
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedIl(''); }}
              placeholder="İl ara..."
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid #e0e0e0', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* İller */}
            <div style={{ width: '45%', borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
              {filteredIller.map(il => (
                <button
                  key={il}
                  type="button"
                  onClick={() => selectIl(il)}
                  style={{
                    display: 'block', width: '100%', padding: '9px 14px',
                    textAlign: 'left', border: 'none', fontSize: 13, cursor: 'pointer',
                    background: selectedIl === il ? '#f0fdf4' : 'white',
                    color: selectedIl === il ? '#dc2626' : '#333',
                    fontWeight: selectedIl === il ? 600 : 400,
                    borderLeft: selectedIl === il ? '3px solid #dc2626' : '3px solid transparent',
                  }}
                >
                  {il}
                </button>
              ))}
            </div>

            {/* İlçeler */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {selectedIl ? (
                <>
                  <button
                    type="button"
                    onClick={selectIlOnly}
                    style={{
                      display: 'block', width: '100%', padding: '9px 14px',
                      textAlign: 'left', border: 'none', fontSize: 13, cursor: 'pointer',
                      background: '#f8f9fa', color: '#013C26', fontWeight: 600,
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    {selectedIl} (Merkez)
                  </button>
                  {ILLER[selectedIl]?.map(ilce => (
                    <button
                      key={ilce}
                      type="button"
                      onClick={() => selectIlce(ilce)}
                      style={{
                        display: 'block', width: '100%', padding: '9px 14px',
                        textAlign: 'left', border: 'none', fontSize: 13, cursor: 'pointer',
                        background: selectedIlce === ilce ? '#f0fdf4' : 'white',
                        color: selectedIlce === ilce ? '#dc2626' : '#444',
                        fontWeight: selectedIlce === ilce ? 600 : 400,
                      }}
                    >
                      {ilce}
                    </button>
                  ))}
                </>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                  ← İl seçin
                </div>
              )}
            </div>
          </div>

          {value && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={clear} style={{
                background: 'none', border: 'none', color: '#f85149', fontSize: 13, cursor: 'pointer',
              }}>
                × Temizle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
