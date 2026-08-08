#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.canpolatnakliyat.com';
const PHONE_DISPLAY = '0535 912 06 91';
const PHONE_HREF = 'tel:+905359120691';
const WHATSAPP = 'https://wa.me/905359120691';
const EMAIL = 'info@canpolatnakliyat.com';
const ADDRESS = 'Camivasat Mah. Akçay Cad. No: 78 Edremit / Balıkesir';
const ORGANIZATION_ID = `${SITE}/#isletme`;
const WEBSITE_ID = `${SITE}/#website`;
const LOGO_ID = `${SITE}/#logo`;
const OG_IMAGE = `${SITE}/assets/images/service-evden-eve.webp`;

const services = [
  {
    slug: 'evden-eve-nakliyat.html',
    name: 'Evden Eve Taşımacılık',
    navName: 'Evden Eve',
    title: 'Edremit Evden Eve Nakliyat | Canpolat Nakliyat',
    description: 'Edremit evden eve nakliyat hizmetinde hazırlık, paketleme, taşıma ve yerleştirme sürecini adres koşullarına göre planlayın.',
    intro: 'Edremit merkezli evden eve taşıma taleplerini eşya yapısı, kat bilgisi, bina erişimi ve yeni adresin koşullarına göre planlıyoruz.',
    area: 'local',
    sections: [
      ['Hizmetin kapsamı', '<p>Evdeki mobilya, beyaz eşya, kişisel eşya ve koliler taşıma öncesinde gruplandırılır. Paketleme, yükleme, araç içi sabitleme, taşıma ve yeni adreste teslim adımları görüşülen kapsama göre yürütülür.</p>'],
      ['Kimler için uygundur?', '<p>Aynı ilçe içinde, Edremit çevresinde veya şehirler arası yeni bir eve taşınacak kişiler için uygundur. Eşya miktarı az olan taleplerde <a href="/hizmetler/parca-esya-tasima.html">parça eşya taşımacılığı</a> ayrıca değerlendirilebilir.</p>'],
      ['Taşıma süreci nasıl ilerler?', '<ol><li>Çıkış ve varış adresleri ile kat bilgileri alınır.</li><li>Eşya yoğunluğu ve özel koruma gerektiren parçalar belirlenir.</li><li>Paketleme, araç ve gerekiyorsa dış cephe asansörü planlanır.</li><li>Taşıma günü yükleme, sabitleme ve teslim sırası uygulanır.</li></ol>'],
      ['Hazırlık ve koruma yaklaşımı', '<p>Kırılabilir eşyalar, elektronikler, mobilyalar ve tekstil ürünleri aynı yöntemle paketlenmez. Koruyucu malzeme ve koli seçimi eşyanın yüzeyine, boyutuna ve taşıma mesafesine göre yapılır. Sigorta ve sözleşme kapsamı taşıma öncesinde netleştirilir.</p>'],
      ['Fiyatı etkileyen faktörler', '<ul><li>Eşya hacmi ve parça sayısı</li><li>Kat, merdiven, asansör ve bina erişimi</li><li>Çıkış ile varış arasındaki mesafe</li><li>Paketleme ve montaj kapsamı</li><li>Taşıma tarihi ve özel ekipman ihtiyacı</li></ul>'],
      ['Hizmet bölgeleri', '<p>Edremit birincil hizmet merkezidir. Akçay, Altınoluk, Havran ve İvrindi talepleri adres koşullarına göre değerlendirilir; bu yerleşimlerde fiziksel şube bulunduğu anlamına gelmez. Şehirler arası talepler için <a href="/hizmetler/sehirler-arasi-nakliyat.html">Türkiye geneli taşıma hizmetini</a> inceleyebilirsiniz.</p>']
    ]
  },
  {
    slug: 'sehirler-arasi-nakliyat.html',
    name: 'Şehirler Arası Taşımacılık',
    navName: 'Şehirler Arası',
    title: 'Şehirler Arası Nakliyat | Edremit Çıkışlı Canpolat',
    description: 'Edremit çıkışlı veya varışlı şehirler arası nakliyat için paketleme, güzergâh, araç içi sabitleme ve teslim sürecini planlayın.',
    intro: 'Edremit çıkışlı veya varışlı şehirler arası taşımalarda eşyaları uzun yol koşullarına göre hazırlıyor, teslim sürecini Türkiye geneli planlıyoruz.',
    area: 'national',
    sections: [
      ['Hizmetin kapsamı', '<p>Şehirler arası taşımada çıkış adresindeki hazırlıktan varış adresindeki teslimata kadar paketleme, yükleme sırası, araç içi yerleşim ve güzergâh birlikte değerlendirilir.</p>'],
      ['Kimler için uygundur?', '<p>Edremit veya çevresinden başka bir ile taşınanlar, Türkiye’nin farklı bir ilinden Edremit’e gelecekler ve iki şehir arasında ofis ya da ev eşyası taşıtacaklar için uygundur.</p>'],
      ['Uzun yol hazırlığı', '<p>Mobilya köşeleri, hassas yüzeyler, elektronikler ve kırılabilir parçalar yol titreşimi dikkate alınarak hazırlanır. Araç içindeki ağırlık dağılımı ve sabitleme noktaları yükleme sırasında kontrol edilir.</p>'],
      ['Güzergâh ve teslim planı', '<p>Çıkış ve varış adresi, kat bilgileri, eşya yoğunluğu ve tercih edilen tarih alındıktan sonra taşıma sırası belirlenir. Kesin süre, güzergâh ve yol koşulları değerlendirilmeden vaat edilmez.</p>'],
      ['Fiyatı etkileyen faktörler', '<ul><li>Şehirler arasındaki mesafe ve güzergâh</li><li>Eşya hacmi ve araç ihtiyacı</li><li>Her iki adresteki kat ve erişim koşulları</li><li>Paketleme, sökme ve kurulum kapsamı</li><li>Taşıma tarihi ve ek ekipman ihtiyacı</li></ul>'],
      ['İlgili hizmetler', '<p>Taşıma bir evin tamamını kapsıyorsa <a href="/hizmetler/evden-eve-nakliyat.html">evden eve taşımacılık</a>, az sayıdaki eşya için <a href="/hizmetler/parca-esya-tasima.html">parça eşya taşıma</a>, yüksek katlarda ise <a href="/hizmetler/asansorlu-tasima.html">asansörlü taşıma</a> seçenekleri birlikte değerlendirilebilir.</p>']
    ]
  },
  {
    slug: 'ofis-isyeri-tasima.html',
    name: 'Ofis ve İşyeri Taşımacılığı',
    navName: 'Ofis ve İşyeri',
    title: 'Edremit Ofis ve İşyeri Taşıma | Canpolat Nakliyat',
    description: 'Edremit ofis ve işyeri taşımacılığında mobilya, ekipman, evrak ve yeniden kurulum sırasını iş akışına göre planlayın.',
    intro: 'Ofis ve işyeri taşımalarında mobilya, ekipman ve evrakları bölüm bazlı hazırlayarak iş akışındaki kesintiyi azaltacak bir sıra oluşturuyoruz.',
    area: 'local',
    sections: [
      ['Hizmetin kapsamı', '<p>Masa, sandalye, dolap, arşiv, elektronik ekipman ve ortak kullanım eşyaları yeni yerleşim planına göre sınıflandırılır. Taşıma kapsamı küçük ofislerden işyerlerine kadar ihtiyaç üzerinden belirlenir.</p>'],
      ['Kimler için uygundur?', '<p>Ofisini aynı bölgede taşıyan işletmeler, başka bir ilçeye geçen işyerleri ve Edremit çıkışlı veya varışlı şehirler arası kurumsal taşıma ihtiyacı olanlar için uygundur.</p>'],
      ['İş akışına göre planlama', '<p>Öncelikli ekipmanlar, arşiv düzeni, yeni adresteki oda veya bölüm yerleşimi ve taşınma zamanı önceden konuşulur. Böylece yükleme ve teslim sırası rastlantısal bırakılmaz.</p>'],
      ['Ekipman ve evrak güvenliği', '<p>Elektronikler ile mobilyalar aynı paketleme yöntemiyle hazırlanmaz. Kablolar, küçük parçalar ve bağlantı elemanları ilgili ekipmanla eşleştirilir; evrak kutuları bölüm adıyla işaretlenebilir.</p>'],
      ['Fiyatı etkileyen faktörler', '<ul><li>Mobilya ve ekipman hacmi</li><li>Elektronik veya hassas parça sayısı</li><li>Sökme ve kurulum kapsamı</li><li>Kat, bina ve yükleme alanı erişimi</li><li>Mesafe ve taşıma zamanı</li></ul>'],
      ['Hizmet alanı ve diğer çözümler', '<p>Edremit merkezli taleplerle birlikte Akçay, Altınoluk, Havran ve İvrindi adresleri koşullara göre değerlendirilir. Yüksek katlarda <a href="/hizmetler/asansorlu-tasima.html">asansörlü taşıma</a>, şehir dışı geçişlerde <a href="/hizmetler/sehirler-arasi-nakliyat.html">şehirler arası nakliyat</a> planlamaya eklenebilir.</p>']
    ]
  },
  {
    slug: 'asansorlu-tasima.html',
    name: 'Asansörlü Taşıma',
    navName: 'Asansörlü Taşıma',
    title: 'Edremit Asansörlü Taşıma | Canpolat Nakliyat',
    description: 'Edremit asansörlü taşıma hizmetinde bina cephesi, balkon veya pencere erişimi, zemin ve çevre güvenliği nasıl değerlendirilir öğrenin.',
    intro: 'Yüksek katlı veya merdiven erişimi sınırlı binalarda, saha koşulları uygun olduğunda dış cephe asansörüyle taşıma planlıyoruz.',
    area: 'local',
    sections: [
      ['Hizmetin kapsamı', '<p>Dış cephe asansörü; eşyanın pencere veya balkon üzerinden kontrollü biçimde indirilmesi ya da çıkarılması için taşıma planına dahil edilir. Her bina için otomatik olarak uygun kabul edilmez.</p>'],
      ['Kimler için uygundur?', '<p>Dar merdivenli, bina içi asansörü eşya taşımaya uygun olmayan veya yüksek katta bulunan ev ve işyerleri için saha değerlendirmesinden sonra kullanılabilir.</p>'],
      ['Asansör uygunluğu nasıl belirlenir?', '<ul><li>Bina cephesi ile pencere veya balkon erişimi</li><li>Aracın ve platformun kurulacağı zemin</li><li>Yol genişliği ve çevredeki güvenli çalışma alanı</li><li>Elektrik hattı, ağaç ve benzeri engeller</li><li>Eşyanın boyutu ve geçiş açıklığı</li></ul>'],
      ['Kurulum ve güvenlik yaklaşımı', '<p>Asansörün konumu taşıma başlamadan önce belirlenir. Çalışma alanı çevresindeki yaya ve araç hareketi dikkate alınır; eşyanın platforma yerleştirilmesi ile kat girişindeki teslim sırası ekip tarafından koordine edilir.</p>'],
      ['Fiyatı etkileyen faktörler', '<p>Kat sayısı tek başına yeterli değildir. Kurulum alanı, çalışma süresi, eşya hacmi, adresler arası mesafe ve asansörün çıkış ya da varış adreslerinden birinde veya ikisinde kullanılması fiyatı etkiler.</p>'],
      ['Hizmet bölgeleri ve bağlantılı hizmetler', '<p>Edremit, Akçay, Altınoluk, Havran ve İvrindi talepleri saha koşullarına göre değerlendirilir. Asansörlü taşıma çoğunlukla <a href="/hizmetler/evden-eve-nakliyat.html">evden eve</a> veya <a href="/hizmetler/ofis-isyeri-tasima.html">ofis ve işyeri taşıma</a> planının bir parçasıdır.</p>']
    ]
  },
  {
    slug: 'parca-esya-tasima.html',
    name: 'Parça Eşya Taşımacılığı',
    navName: 'Parça Eşya',
    title: 'Edremit Parça Eşya Taşıma | Canpolat Nakliyat',
    description: 'Edremit parça eşya taşıma hizmetinde az sayıdaki mobilya, beyaz eşya veya kolinin hacim, adres ve tarih bilgilerine göre planlanması.',
    intro: 'Bir evin tamamı yerine az sayıdaki mobilya, beyaz eşya, koli veya benzeri eşyalar için taşıma ihtiyacını hacim ve adres koşullarına göre değerlendiriyoruz.',
    area: 'local',
    sections: [
      ['Hizmetin kapsamı', '<p>Tek bir büyük eşya, birkaç mobilya, beyaz eşya, koli grubu veya öğrenci eşyası gibi tam ev taşıması gerektirmeyen talepler parça eşya kapsamında planlanabilir.</p>'],
      ['Kimler için uygundur?', '<p>Az sayıda eşya gönderecek kişiler, yeni alınan mobilyasını taşıtmak isteyenler, aile bireyleri arasında eşya aktaracaklar ve küçük hacimli şehirler arası gönderisi olanlar için uygundur.</p>'],
      ['Bilgi ve hazırlık aşaması', '<p>Eşyaların türü, yaklaşık ölçüsü, adedi, fotoğrafı, çıkış ve varış adresi ile kat bilgisi paylaşılır. Bu bilgiler taşıma yöntemi, araç alanı ve koruyucu malzeme ihtiyacının değerlendirilmesini sağlar.</p>'],
      ['Koruma ve araç içi yerleşim', '<p>Mobilya yüzeyleri, beyaz eşya köşeleri ve kırılabilir parçalar kendi yapılarına göre korunur. Farklı eşyalar aynı araçta taşınacaksa birbirine temas ve ağırlık dağılımı dikkate alınır.</p>'],
      ['Fiyatı etkileyen faktörler', '<ul><li>Eşyanın adedi, boyutu ve ağırlığı</li><li>Çıkış ve varış mesafesi</li><li>Kat ve bina erişimi</li><li>Paketleme ihtiyacı</li><li>Taşıma tarihi ve araç planı</li></ul>'],
      ['Hizmet bölgeleri', '<p>Edremit merkezli olarak Akçay, Altınoluk, Havran ve İvrindi yönündeki talepler değerlendirilir. Türkiye geneli seçenek için adres ve tarih bilgileriyle görüşülür; daha kapsamlı taşınmalarda <a href="/hizmetler/sehirler-arasi-nakliyat.html">şehirler arası taşımacılık</a> planı uygulanır.</p>']
    ]
  }
];

function organizationNode() {
  return {
    '@type': 'MovingCompany',
    '@id': ORGANIZATION_ID,
    name: 'Canpolat Evden Eve Nakliyat',
    alternateName: 'Canpolat Nakliyat',
    url: `${SITE}/`,
    telephone: '+905359120691',
    email: EMAIL,
    description: 'Edremit merkezli evden eve, şehirler arası, ofis ve işyeri, asansörlü ve parça eşya taşımacılığı hizmeti.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Camivasat Mah. Akçay Cad. No: 78',
      addressLocality: 'Edremit',
      addressRegion: 'Balıkesir',
      addressCountry: 'TR'
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '20:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '09:00', closes: '17:00' }
    ],
    areaServed: [
      { '@type': 'City', name: 'Edremit' },
      { '@type': 'Place', name: 'Akçay' },
      { '@type': 'Place', name: 'Altınoluk' },
      { '@type': 'Place', name: 'Havran' },
      { '@type': 'Place', name: 'İvrindi' },
      { '@type': 'Country', name: 'Türkiye' }
    ],
    logo: { '@id': LOGO_ID },
    image: { '@id': LOGO_ID },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Nakliyat Hizmetleri',
      itemListElement: services.map(service => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.name,
          url: `${SITE}/hizmetler/${service.slug}`
        }
      }))
    }
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE}/`,
    name: 'Canpolat Nakliyat',
    inLanguage: 'tr-TR',
    publisher: { '@id': ORGANIZATION_ID }
  };
}

function logoNode() {
  return {
    '@type': 'ImageObject',
    '@id': LOGO_ID,
    url: `${SITE}/assets/images/canpolat-logo.svg`,
    contentUrl: `${SITE}/assets/images/canpolat-logo.svg`,
    caption: 'Canpolat Evden Eve Nakliyat logosu'
  };
}

function breadcrumbNode(canonical, crumbs) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
}

function schemaFor(page) {
  const canonical = `${SITE}${page.url}`;
  const graph = [organizationNode(), websiteNode(), logoNode()];
  const crumbs = [{ name: 'Ana Sayfa', url: `${SITE}/` }, ...page.crumbs];
  const webPage = {
    '@type': page.schemaType || 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: page.title,
    description: page.description,
    inLanguage: 'tr-TR',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    breadcrumb: { '@id': `${canonical}#breadcrumb` }
  };
  graph.push(webPage, breadcrumbNode(canonical, crumbs));

  if (page.service) {
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#hizmet`,
      name: page.service.name,
      serviceType: page.service.name,
      url: canonical,
      description: page.description,
      provider: { '@id': ORGANIZATION_ID },
      areaServed: page.service.area === 'national'
        ? [{ '@type': 'Country', name: 'Türkiye' }]
        : [{ '@type': 'City', name: 'Edremit' }, { '@type': 'Place', name: 'Akçay' }, { '@type': 'Place', name: 'Altınoluk' }, { '@type': 'Place', name: 'Havran' }, { '@type': 'Place', name: 'İvrindi' }],
      mainEntityOfPage: { '@id': `${canonical}#webpage` }
    });
    webPage.mainEntity = { '@id': `${canonical}#hizmet` };
  }

  if (page.itemList) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${canonical}#hizmet-listesi`,
      itemListElement: services.map((service, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: service.name,
        url: `${SITE}/hizmetler/${service.slug}`
      }))
    });
    webPage.mainEntity = { '@id': `${canonical}#hizmet-listesi` };
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

function iconSprite() {
  return `<svg class="icon-sprite" width="0" height="0" aria-hidden="true" focusable="false">
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M7 3h3l1.5 4-2 1.5a15 15 0 0 0 6 6L17 12.5l4 1.5v3c0 2.2-1.8 4-4 4C9.3 21 3 14.7 3 7c0-2.2 1.8-4 4-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M20 11.7a8 8 0 0 1-11.8 7l-4.2 1.1 1.1-4A8 8 0 1 1 20 11.7Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.2 7.7c.3-.6.6-.6.9-.6h.7l1 2.4-.9.9c.8 1.6 2 2.7 3.7 3.5l.9-1 2.4 1.1v.7c0 .5-.2.9-.7 1.2-.7.4-1.6.6-2.4.4-3.7-.9-6.8-4-7.7-7.7-.2-.7.2-1.2.5-1.7.5-.7 1.2-1.1 1.6-.2Z" fill="currentColor"/></symbol>
</svg>`;
}

function header(current) {
  const nav = [
    ['home', '/', 'Ana Sayfa'],
    ['about', '/hakkimizda.html', 'Hakkımızda'],
    ['services', '/hizmetler/', 'Hizmetler'],
    ['areas', '/bolgeler/edremit-nakliyat.html', 'Hizmet Bölgeleri'],
    ['contact', '/iletisim.html', 'İletişim']
  ];
  const links = nav.map(([key, href, label]) => `<a href="${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`).join('\n      ');
  const mobileLinks = nav.map(([key, href, label]) => `<a href="${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<div class="topline">
  <div class="container topline-inner">
    <p>Edremit merkezli planlı taşıma · Türkiye geneli şehirler arası hizmet</p>
    <div class="topline-links">
      <a href="${PHONE_HREF}" data-analytics-event="phone_click" data-analytics-location="topline">${PHONE_DISPLAY}</a>
      <a href="${WHATSAPP}" target="_blank" rel="noopener" data-analytics-event="whatsapp_click" data-analytics-location="topline">WhatsApp</a>
    </div>
  </div>
</div>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="Canpolat Nakliyat ana sayfa"><img src="/assets/images/canpolat-logo.svg" width="560" height="118" alt="Canpolat Evden Eve Nakliyat"></a>
    <nav class="desktop-nav" aria-label="Ana menü">
      ${links}
      <a class="btn btn-primary" href="${PHONE_HREF}" data-analytics-event="phone_click" data-analytics-location="header"><svg aria-hidden="true"><use href="#i-phone"/></svg> Hemen Ara</a>
    </nav>
    <button class="menu-button" type="button" aria-label="Menüyü aç" aria-expanded="false" aria-controls="mobile-navigation" data-menu-button>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
  </div>
  <div class="mobile-panel" id="mobile-navigation" data-mobile-panel>
    <nav aria-label="Mobil menü">
      ${mobileLinks}
      <a class="btn btn-primary" href="${PHONE_HREF}" data-analytics-event="phone_click" data-analytics-location="mobile_menu">${PHONE_DISPLAY}</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  const serviceLinks = services.map(service => `<a href="/hizmetler/${service.slug}">${service.navName}</a>`).join('');
  return `<footer class="site-footer" id="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <img src="/assets/images/canpolat-logo.svg" width="560" height="118" alt="Canpolat Nakliyat">
      <p>Edremit merkezli evden eve, şehirler arası, ofis ve işyeri, asansörlü ve parça eşya taşıma hizmetleri.</p>
    </div>
    <div>
      <h2>Hızlı Menü</h2>
      <div class="footer-links"><a href="/">Ana Sayfa</a><a href="/hakkimizda.html">Hakkımızda</a><a href="/hizmetler/">Hizmetler</a><a href="/bolgeler/edremit-nakliyat.html">Hizmet Bölgeleri</a><a href="/iletisim.html">İletişim</a><a href="/gizlilik.html">Gizlilik</a></div>
    </div>
    <div>
      <h2>Hizmetler</h2>
      <div class="footer-links">${serviceLinks}</div>
    </div>
    <div>
      <h2>İletişim</h2>
      <address class="footer-contact">
        <strong>Canpolat Evden Eve Nakliyat</strong>
        <span>${ADDRESS}</span>
        <a href="${PHONE_HREF}" data-analytics-event="phone_click" data-analytics-location="footer">Telefon: ${PHONE_DISPLAY}</a>
        <a href="mailto:${EMAIL}">${EMAIL}</a>
        <a href="${WHATSAPP}" target="_blank" rel="noopener" data-analytics-event="whatsapp_click" data-analytics-location="footer">WhatsApp’tan yazın</a>
        <span>Hafta içi: 08:00–20:00</span>
        <span>Cumartesi: 08:00–18:00</span>
        <span>Pazar: 09:00–17:00</span>
      </address>
    </div>
  </div>
  <div class="container footer-bottom"><span>© <span data-year>2026</span> Canpolat Nakliyat. Tüm hakları saklıdır.</span><span>www.canpolatnakliyat.com</span></div>
</footer>
<div class="floating-actions" aria-label="Hızlı iletişim">
  <a class="float-btn float-whatsapp" href="${WHATSAPP}" target="_blank" aria-label="WhatsApp’tan yazın" rel="noopener" data-analytics-event="whatsapp_click" data-analytics-location="floating"><svg aria-hidden="true"><use href="#i-whatsapp"/></svg></a>
  <a class="float-btn float-phone" href="${PHONE_HREF}" aria-label="Canpolat Nakliyat’ı arayın" data-analytics-event="phone_click" data-analytics-location="floating"><svg aria-hidden="true"><use href="#i-phone"/></svg></a>
</div>`;
}

function breadcrumbHtml(crumbs) {
  return `<nav class="breadcrumb" aria-label="Sayfa yolu"><a href="/">Ana Sayfa</a>${crumbs.map(crumb => `<span aria-hidden="true">›</span><span>${crumb.name}</span>`).join('')}</nav>`;
}

function relatedServices(currentSlug) {
  return services.filter(service => service.slug !== currentSlug).map(service => `<a href="/hizmetler/${service.slug}">${service.navName}</a>`).join('');
}

function serviceBody(service) {
  const sections = service.sections.map(([heading, content]) => `<h2>${heading}</h2>${content}`).join('\n');
  return `<section class="subhero"><div class="container">${breadcrumbHtml([{ name: 'Hizmetler' }, { name: service.name }])}<h1>${service.name}</h1><p>${service.intro}</p></div></section>
<section class="section"><div class="container content-layout">
  <article class="article reveal">
    ${sections}
  </article>
  <aside class="sidebar" aria-label="Teklif ve ilgili hizmetler">
    <div class="sidebar-card dark"><h2>Taşıma planınızı paylaşın</h2><p>Adres, kat, eşya ve tarih bilgileriyle uygun yöntemi birlikte değerlendirelim.</p><a class="btn btn-primary" href="${WHATSAPP}?text=Merhaba%20Canpolat%20Nakliyat%2C%20${encodeURIComponent(service.name)}%20hakk%C4%B1nda%20teklif%20almak%20istiyorum." target="_blank" rel="noopener" data-analytics-event="whatsapp_click" data-analytics-location="service_sidebar">WhatsApp’tan Yazın</a></div>
    <div class="sidebar-card"><h2>Diğer hizmetler</h2><div class="mini-links">${relatedServices(service.slug)}</div></div>
    <div class="sidebar-card"><h2>Hizmet bölgeleri</h2><p>Edremit merkez; Akçay, Altınoluk, Havran ve İvrindi hizmet alanıdır.</p><a href="/bolgeler/edremit-nakliyat.html" class="service-link">Hizmet bölgelerini inceleyin <span aria-hidden="true">→</span></a></div>
  </aside>
</div></section>`;
}

function serviceHubBody() {
  const cards = services.map((service, index) => `<a class="service-card reveal" href="/hizmetler/${service.slug}">
    <span class="service-number" aria-hidden="true">0${index + 1}</span>
    <h2>${service.name}</h2>
    <p>${service.description}</p>
    <span class="service-link">Hizmeti inceleyin <span aria-hidden="true">→</span></span>
  </a>`).join('\n');
  return `<section class="subhero"><div class="container">${breadcrumbHtml([{ name: 'Hizmetler' }])}<h1>Nakliyat Hizmetlerimiz</h1><p>Taşınma türünüze göre kapsamı, hazırlığı, fiyatı etkileyen unsurları ve hizmet alanını doğru sayfadan inceleyin.</p></div></section>
<section class="section services"><div class="container"><div class="section-head"><span class="eyebrow">CANPOLAT NAKLİYAT</span><h2>İhtiyaca göre planlanan hizmetler</h2><p>Her hizmet sayfası farklı bir taşıma ihtiyacını açıklar; aynı metnin ilçe adı değiştirilerek çoğaltılmış sürümleri değildir.</p></div><div class="service-grid">${cards}</div></div></section>
<section class="promo"><div class="container"><div class="promo-card"><div><h2>Hangi hizmetin uygun olduğundan emin değil misiniz?</h2><p>Eşya, adres, kat ve tarih bilgilerinizi paylaşın; kapsamı birlikte değerlendirelim.</p></div><a class="btn btn-primary" href="${WHATSAPP}" target="_blank" rel="noopener" data-analytics-event="whatsapp_click" data-analytics-location="services_hub">WhatsApp’tan Yazın</a></div></div></section>`;
}

const customPages = [
  {
    output: 'hakkimizda.html',
    url: '/hakkimizda.html',
    current: 'about',
    schemaType: 'AboutPage',
    title: 'Hakkımızda | Canpolat Evden Eve Nakliyat Edremit',
    description: 'Canpolat Nakliyat’ın Edremit merkezli planlama, eşya koruma, açık iletişim ve taşıma süreci yaklaşımını tanıyın.',
    crumbs: [{ name: 'Hakkımızda', url: `${SITE}/hakkimizda.html` }],
    body: `<section class="subhero"><div class="container">${breadcrumbHtml([{ name: 'Hakkımızda' }])}<h1>Canpolat Nakliyat Hakkında</h1><p>Taşınmayı yalnızca eşya nakli değil; hazırlık, doğru yöntem, açık iletişim ve kontrollü teslim süreci olarak ele alıyoruz.</p></div></section>
<section class="section"><div class="container content-layout"><article class="article reveal">
  <h2>Canpolat Evden Eve Nakliyat</h2><p>Canpolat Nakliyat, Edremit merkezli olarak evden eve, ofis ve işyeri, asansörlü ve parça eşya taşımacılığı; şehirler arası taleplerde Türkiye geneli hizmet sunar.</p>
  <h2>Önce ihtiyaçları netleştiriyoruz</h2><p>Çıkış ve varış adresi, kat, bina erişimi, eşya yoğunluğu ve taşıma tarihi görüşülmeden standart bir yöntem varsaymıyoruz. Araç, ekipman ve paketleme kapsamı bu bilgilere göre değerlendirilir.</p>
  <div class="stats-row"><div class="stat-card"><strong>Açık iletişim</strong><p>Kapsam ve ihtiyaçlar taşıma öncesinde konuşulur.</p></div><div class="stat-card"><strong>Eşyaya uygun koruma</strong><p>Farklı eşya türleri için farklı hazırlık yöntemleri kullanılır.</p></div><div class="stat-card"><strong>Planlı teslim</strong><p>Yükleme ve teslim sırası adres koşullarına göre oluşturulur.</p></div></div>
  <h2>Hizmet yaklaşımımız</h2><ul><li>Gerçek adres ve erişim koşullarına göre plan yapmak.</li><li>Hassas ve büyük parçaları kendi yapısına uygun hazırlamak.</li><li>Güzergâh, yükleme ve teslim sırasını önceden değerlendirmek.</li><li>Sigorta, paketleme ve montaj kapsamını görüşme sırasında netleştirmek.</li></ul>
  <h2>Hizmet alanı</h2><p>Birincil hizmet merkezimiz Edremit’tir. Akçay, Altınoluk, Havran ve İvrindi fiziksel şube değil hizmet alanıdır. Şehirler arası taşıma talepleri Türkiye geneli değerlendirilir.</p>
</article><aside class="sidebar"><div class="sidebar-card dark"><h2>Taşınma planınız hazır mı?</h2><p>Adres, kat ve eşya bilgilerinizi paylaşın.</p><a class="btn btn-primary" href="${PHONE_HREF}" data-analytics-event="phone_click" data-analytics-location="about_sidebar">${PHONE_DISPLAY}</a></div><div class="sidebar-card"><h2>Hizmetler</h2><div class="mini-links">${services.map(service => `<a href="/hizmetler/${service.slug}">${service.name}</a>`).join('')}</div></div></aside></div></section>`
  },
  {
    output: 'bolgeler/edremit-nakliyat.html',
    url: '/bolgeler/edremit-nakliyat.html',
    current: 'areas',
    schemaType: 'CollectionPage',
    title: 'Edremit Nakliyat ve Hizmet Bölgeleri | Canpolat',
    description: 'Canpolat Nakliyat’ın Edremit merkezli; Akçay, Altınoluk, Havran ve İvrindi hizmet alanları ile Türkiye geneli taşıma kapsamı.',
    crumbs: [{ name: 'Hizmet Bölgeleri', url: `${SITE}/bolgeler/edremit-nakliyat.html` }],
    body: `<section class="subhero"><div class="container">${breadcrumbHtml([{ name: 'Hizmet Bölgeleri' }])}<h1>Edremit Nakliyat ve Hizmet Bölgeleri</h1><p>Edremit birincil hizmet merkezimizdir; çevre yerleşimlerdeki talepleri adres, erişim ve taşıma türüne göre değerlendiriyoruz.</p></div></section>
<section class="section"><div class="container content-layout"><article class="article reveal">
  <h2>Edremit merkezli taşıma hizmeti</h2><p>Canpolat Evden Eve Nakliyat’ın doğrulanmış işletme adresi Camivasat Mah. Akçay Cad. No: 78 Edremit / Balıkesir’dir. Evden eve, ofis ve işyeri, parça eşya ve uygun koşullarda asansörlü taşıma talepleri bu merkezden planlanır.</p>
  <h2>Yerel hizmet alanları</h2><div class="stats-row"><div class="stat-card"><strong>Edremit ve Akçay</strong><p>Ev, ofis, parça eşya ve saha uygunsa asansörlü taşıma.</p></div><div class="stat-card"><strong>Altınoluk</strong><p>Yerel ve şehirler arası taşıma taleplerinin adres koşullarına göre değerlendirilmesi.</p></div><div class="stat-card"><strong>Havran ve İvrindi</strong><p>Ev, işyeri ve parça eşya taşıma ihtiyaçlarının planlanması.</p></div></div>
  <h2>Hizmet alanı şube anlamına gelmez</h2><p>Akçay, Altınoluk, Havran ve İvrindi’de fiziksel şubemiz bulunduğu iddia edilmez. Bu yerleşimler, çıkış veya varış adresine göre hizmet verebildiğimiz alanlardır.</p>
  <h2>Türkiye geneli şehirler arası taşıma</h2><p>Edremit çıkışlı veya varışlı şehirler arası talepler Türkiye geneli değerlendirilir. Eşya hacmi, iki adresteki erişim, güzergâh ve tarih bilgileri planı belirler.</p>
  <h2>Bölgeniz için hangi bilgi gerekir?</h2><ul><li>Çıkış ve varış adresi</li><li>Kat ve bina erişimi</li><li>Eşya türü ve yaklaşık hacmi</li><li>Tercih edilen taşıma tarihi</li><li>Asansör veya özel koruma ihtiyacı</li></ul>
</article><aside class="sidebar"><div class="sidebar-card dark"><h2>Adresinizi paylaşın</h2><p>Hizmet uygunluğunu ve taşıma yöntemini birlikte değerlendirelim.</p><a class="btn btn-primary" href="${WHATSAPP}" target="_blank" rel="noopener" data-analytics-event="whatsapp_click" data-analytics-location="areas_sidebar">WhatsApp’tan Yazın</a></div><div class="sidebar-card"><h2>İlgili hizmetler</h2><div class="mini-links">${services.map(service => `<a href="/hizmetler/${service.slug}">${service.name}</a>`).join('')}</div></div></aside></div></section>`
  },
  {
    output: 'iletisim.html',
    url: '/iletisim.html',
    current: 'contact',
    schemaType: 'ContactPage',
    title: 'İletişim | Canpolat Nakliyat Edremit',
    description: 'Canpolat Evden Eve Nakliyat telefon, WhatsApp, e-posta, Edremit adresi ve doğrulanmış çalışma saatleri.',
    crumbs: [{ name: 'İletişim', url: `${SITE}/iletisim.html` }],
    body: `<section class="subhero"><div class="container">${breadcrumbHtml([{ name: 'İletişim' }])}<h1>Canpolat Nakliyat İletişim</h1><p>Taşıma talebiniz için adres, kat, eşya ve tarih bilgilerini telefon veya WhatsApp üzerinden paylaşabilirsiniz.</p></div></section>
<section class="section"><div class="container content-layout"><article class="article reveal">
  <h2>Doğrulanmış işletme bilgileri</h2><address class="contact-details"><strong>Canpolat Evden Eve Nakliyat</strong><span>${ADDRESS}</span><a href="${PHONE_HREF}" data-analytics-event="phone_click" data-analytics-location="contact_content">${PHONE_DISPLAY}</a><a href="mailto:${EMAIL}">${EMAIL}</a><a href="${WHATSAPP}" target="_blank" rel="noopener" data-analytics-event="whatsapp_click" data-analytics-location="contact_content">WhatsApp’tan yazın</a></address>
  <h2>Çalışma saatleri</h2><ul><li>Hafta içi: 08:00–20:00</li><li>Cumartesi: 08:00–18:00</li><li>Pazar: 09:00–17:00</li></ul>
  <h2>Teklif için paylaşabileceğiniz bilgiler</h2><ul><li>Çıkış ve varış adresi</li><li>Kat, bina asansörü ve yükleme alanı bilgisi</li><li>Eşya türü ve yaklaşık hacmi</li><li>Taşınma tarihi</li><li>Paketleme, montaj veya dış cephe asansörü ihtiyacı</li></ul>
  <h2>Hizmet alanı</h2><p>Edremit birincil hizmet merkezidir. Akçay, Altınoluk, Havran ve İvrindi hizmet alanıdır; fiziksel şube olarak gösterilmez. Şehirler arası taşımalar Türkiye geneli değerlendirilir.</p>
</article><aside class="sidebar"><div class="sidebar-card dark"><h2>Hızlı iletişim</h2><p>Uygun yöntemi görüşmek için bizi arayın veya WhatsApp’tan yazın.</p><a class="btn btn-primary" href="${PHONE_HREF}" data-analytics-event="phone_click" data-analytics-location="contact_sidebar">Hemen Ara</a><p><a href="${WHATSAPP}" target="_blank" rel="noopener" data-analytics-event="whatsapp_click" data-analytics-location="contact_sidebar">WhatsApp: ${PHONE_DISPLAY}</a></p></div><div class="sidebar-card"><h2>Hizmetleri inceleyin</h2><div class="mini-links">${services.map(service => `<a href="/hizmetler/${service.slug}">${service.name}</a>`).join('')}</div></div></aside></div></section>`
  },
  {
    output: 'gizlilik.html',
    url: '/gizlilik.html',
    current: '',
    schemaType: 'WebPage',
    robots: 'noindex, follow',
    title: 'Gizlilik | Canpolat Nakliyat',
    description: 'Canpolat Nakliyat iletişim ve teklif taleplerinde paylaşılan verilerin kullanımına ilişkin gizlilik bilgisi.',
    crumbs: [{ name: 'Gizlilik', url: `${SITE}/gizlilik.html` }],
    body: `<section class="subhero"><div class="container">${breadcrumbHtml([{ name: 'Gizlilik' }])}<h1>Gizlilik Bilgisi</h1><p>İletişim ve teklif sürecinde paylaşılan bilgilerin hangi amaçlarla kullanıldığını açıklıyoruz.</p></div></section>
<section class="section"><div class="container content-layout"><article class="article reveal">
  <h2>İletişim verileri</h2><p>Telefon, WhatsApp veya teklif formu üzerinden ilettiğiniz ad, telefon, adres, eşya ve taşıma bilgileri yalnızca talebinizi değerlendirmek ve sizinle iletişim kurmak amacıyla kullanılır.</p>
  <h2>WhatsApp teklif akışı</h2><p>Ana sayfadaki teklif formunu gönderdiğinizde girdiğiniz bilgiler, onayınızla WhatsApp mesajına dönüştürülür. Mesajı göndermeden önce WhatsApp içinde inceleyebilir veya vazgeçebilirsiniz.</p>
  <h2>Çerezler ve ölçüm</h2><p>Bu sürümde GA4 veya Tag Manager kimliği tanımlı değildir. Telefon, WhatsApp ve teklif etkileşimleri daha sonra bir analiz sistemi bağlanabilmesi için anonim event adlarıyla hazırlanmıştır; sahte ölçüm kimliği kullanılmaz.</p>
  <h2>İletişim</h2><p>Gizlilikle ilgili sorular için <a href="mailto:${EMAIL}">${EMAIL}</a> adresine yazabilir veya <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a> numarasını arayabilirsiniz.</p>
</article><aside class="sidebar"><div class="sidebar-card"><h2>İşletme</h2><p>Canpolat Evden Eve Nakliyat<br>${ADDRESS}</p><a href="/iletisim.html" class="service-link">İletişim bilgileri <span aria-hidden="true">→</span></a></div></aside></div></section>`
  }
];

function renderPage(page) {
  const canonical = `${SITE}${page.url}`;
  const robots = page.robots || 'index, follow, max-image-preview:large';
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <meta name="author" content="Canpolat Nakliyat">
  <meta name="theme-color" content="#303640">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="Canpolat Nakliyat">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="1586">
  <meta property="og:image:height" content="992">
  <meta property="og:image:alt" content="Canpolat Nakliyat ekibi evden eve taşıma sırasında">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title}">
  <meta name="twitter:description" content="${page.description}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <link rel="icon" href="/assets/images/favicon-canpolat.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/fonts.css?v=20260808-seo-01">
  <link rel="stylesheet" href="/assets/css/style.css?v=20260808-seo-01">
  <script type="application/ld+json">${JSON.stringify(schemaFor(page))}</script>
</head>
<body>
<a class="skip-link" href="#main">Ana içeriğe geç</a>
${iconSprite()}
${header(page.current)}
<main id="main">${page.body}</main>
${footer()}
<script defer src="/assets/js/main.js?v=20260808-seo-01"></script>
</body>
</html>
`;
}

function render404() {
  return `<!DOCTYPE html>
<html lang="tr"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Sayfa Bulunamadı | Canpolat Nakliyat</title>
  <meta name="description" content="Aradığınız sayfa bulunamadı. Canpolat Nakliyat ana sayfasına veya hizmetlere dönebilirsiniz.">
  <meta name="robots" content="noindex, follow"><meta name="theme-color" content="#303640">
  <link rel="icon" href="/assets/images/favicon-canpolat.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/fonts.css?v=20260808-seo-01"><link rel="stylesheet" href="/assets/css/style.css?v=20260808-seo-01">
</head><body><a class="skip-link" href="#main">Ana içeriğe geç</a>${iconSprite()}${header('')}
<main id="main"><section class="subhero"><div class="container">${breadcrumbHtml([{ name: 'Sayfa bulunamadı' }])}<h1>Aradığınız sayfa bulunamadı</h1><p>Bağlantı değişmiş veya adres yanlış yazılmış olabilir. Aşağıdaki seçeneklerle devam edebilirsiniz.</p></div></section><section class="section"><div class="container"><div class="stats-row"><div class="stat-card"><strong>Ana Sayfa</strong><p>Canpolat Nakliyat ana sayfasına dönün.</p><a class="service-link" href="/">Ana sayfaya git <span aria-hidden="true">→</span></a></div><div class="stat-card"><strong>Hizmetler</strong><p>Tüm taşıma hizmetlerini inceleyin.</p><a class="service-link" href="/hizmetler/">Hizmetlere git <span aria-hidden="true">→</span></a></div><div class="stat-card"><strong>İletişim</strong><p>Telefon ve WhatsApp bilgilerine ulaşın.</p><a class="service-link" href="/iletisim.html">İletişime git <span aria-hidden="true">→</span></a></div></div></div></section></main>
${footer()}<script defer src="/assets/js/main.js?v=20260808-seo-01"></script></body></html>\n`;
}

const generatedPages = [
  ...services.map(service => ({
    output: `hizmetler/${service.slug}`,
    url: `/hizmetler/${service.slug}`,
    current: 'services',
    title: service.title,
    description: service.description,
    schemaType: 'WebPage',
    service,
    crumbs: [{ name: 'Hizmetler', url: `${SITE}/hizmetler/` }, { name: service.name, url: `${SITE}/hizmetler/${service.slug}` }],
    body: serviceBody(service)
  })),
  {
    output: 'hizmetler/index.html',
    url: '/hizmetler/',
    current: 'services',
    title: 'Nakliyat Hizmetleri | Canpolat Nakliyat Edremit',
    description: 'Edremit evden eve, şehirler arası, ofis ve işyeri, asansörlü ve parça eşya taşımacılığı hizmetlerini karşılaştırın.',
    schemaType: 'CollectionPage',
    itemList: true,
    crumbs: [{ name: 'Hizmetler', url: `${SITE}/hizmetler/` }],
    body: serviceHubBody()
  },
  ...customPages
];

const outputs = new Map(generatedPages.map(page => [page.output, renderPage(page)]));
outputs.set('404.html', render404());

function run({ check = false } = {}) {
  const mismatches = [];
  for (const [relativePath, contents] of outputs) {
    const outputPath = path.join(ROOT, relativePath);
    if (check) {
      const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
      if (current !== contents) mismatches.push(relativePath);
      continue;
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, contents, 'utf8');
  }
  if (mismatches.length) {
    console.error(`Üretilmiş SEO sayfaları güncel değil: ${mismatches.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(check ? `${outputs.size} üretilmiş SEO sayfası kaynakla eşleşiyor.` : `${outputs.size} SEO sayfası üretildi.`);
}

if (require.main === module) run({ check: process.argv.includes('--check') });

module.exports = { ADDRESS, EMAIL, ORGANIZATION_ID, PHONE_DISPLAY, PHONE_HREF, SITE, WEBSITE_ID, generatedPages, outputs, run, services };
