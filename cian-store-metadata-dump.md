# CIAN Store Metadata Dump

Generated on 2026-03-12 (Europe/Moscow).

This file is intentionally raw. It does **not** label which field is the short description or the full description. It lists the public metadata sources, the exact extraction commands, and the extracted values so you can point to the right fields.

## Source URLs

- Google Play page: https://play.google.com/store/apps/details?id=ru.cian.main&hl=ru_ru
- App Store page: https://apps.apple.com/ru/app/%D1%86%D0%B8%D0%B0%D0%BD-%D0%BD%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B/id911804296
- App Store lookup API: https://itunes.apple.com/lookup?id=911804296&country=ru

## Working Commands

### 1. Fetch Google Play raw HTML

```powershell
@"
(async () => {
  const response = await fetch('https://play.google.com/store/apps/details?id=ru.cian.main&hl=ru_ru', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
  });
  const html = Buffer.from(await response.arrayBuffer()).toString('utf8');
  process.stdout.write(html);
})();
"@ | node
```

### 2. Extract Google Play `ds:5` candidate paths and text values

```powershell
@"
const vm = require('node:vm');
(async () => {
  const response = await fetch('https://play.google.com/store/apps/details?id=ru.cian.main&hl=ru_ru', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
  });
  const html = Buffer.from(await response.arrayBuffer()).toString('utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  const chunks = {};
  const context = vm.createContext({ AF_initDataCallback(payload) { if (payload?.key) chunks[payload.key] = payload.data; }, window: {}, self: {}, document: {} });
  for (const match of scripts) {
    if (!match[1].includes('AF_initDataCallback({key:')) continue;
    try { vm.runInContext(match[1], context, { timeout: 1000 }); } catch {}
  }
  const details = chunks['ds:5']?.[1]?.[2];
  const results = [];
  const seen = new Set();
  const walk = (value, path) => {
    if (typeof value === 'string') {
      const normalized = value.replace(/\s+/g, ' ').trim();
      if (!normalized || normalized.length < 20 || normalized.startsWith('http')) return;
      if (/^[A-Za-z0-9+/=]+$/.test(normalized) && normalized.length > 60) return;
      const signature = path + ':' + normalized;
      if (seen.has(signature)) return;
      seen.add(signature);
      results.push({ path, length: normalized.length, value: normalized });
      return;
    }
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, path + `[${index}]`));
    if (value && typeof value === 'object') return Object.entries(value).forEach(([key, nested]) => walk(nested, path + '.' + key));
  };
  walk(details, 'details');
  console.log(JSON.stringify({
    knownPaths: {
      'details[72][0][1]': details?.[72]?.[0]?.[1] ?? null,
      'details[73][0][1]': details?.[73]?.[0]?.[1] ?? null,
      'details[144][1][1]': details?.[144]?.[1]?.[1] ?? null,
      'details[12][0][0][1]': details?.[12]?.[0]?.[0]?.[1] ?? null,
    },
    textCandidates: results,
  }, null, 2));
})();
"@ | node
```

### 3. Fetch App Store raw HTML

```powershell
@"
(async () => {
  const response = await fetch('https://apps.apple.com/ru/app/%D1%86%D0%B8%D0%B0%D0%BD-%D0%BD%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B/id911804296', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
  });
  const html = Buffer.from(await response.arrayBuffer()).toString('utf8');
  process.stdout.write(html);
})();
"@ | node
```

### 4. Fetch App Store lookup JSON

```powershell
@"
(async () => {
  const response = await fetch('https://itunes.apple.com/lookup?id=911804296&country=ru', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
  });
  const json = Buffer.from(await response.arrayBuffer()).toString('utf8');
  process.stdout.write(json);
})();
"@ | node
```

## Google Play Metadata

### Page Meta Tags

```json
[
  {
    "index": 0,
    "attrs": {
      "name": "referrer",
      "content": "origin"
    }
  },
  {
    "index": 1,
    "attrs": {
      "name": "viewport",
      "content": "width=device-width, initial-scale=1"
    }
  },
  {
    "index": 2,
    "attrs": {
      "name": "mobile-web-app-capable",
      "content": "yes"
    }
  },
  {
    "index": 3,
    "attrs": {
      "name": "apple-mobile-web-app-capable",
      "content": "yes"
    }
  },
  {
    "index": 4,
    "attrs": {
      "name": "google-site-verification",
      "content": "sBw2N8uateIzRr93vmFze5MF_35vMk5F1wG04L5JcJE"
    }
  },
  {
    "index": 5,
    "attrs": {
      "name": "google-site-verification",
      "content": "PJKdyVFC5jlu_l8Wo_hirJkhs1cmitmn44fgpOc3zFc"
    }
  },
  {
    "index": 6,
    "attrs": {
      "content": "NOODP",
      "name": "robots"
    }
  },
  {
    "index": 7,
    "attrs": {
      "content": "website",
      "property": "og:type"
    }
  },
  {
    "index": 8,
    "attrs": {
      "property": "og:url",
      "content": "https://play.google.com/store/apps/details?id=ru.cian.main&hl=ru"
    }
  },
  {
    "index": 9,
    "attrs": {
      "name": "twitter:url",
      "content": "https://play.google.com/store/apps/details?id=ru.cian.main&hl=ru"
    }
  },
  {
    "index": 10,
    "attrs": {
      "property": "og:title",
      "content": "Приложения в Google Play – Циан. Недвижимость, квартиры"
    }
  },
  {
    "index": 11,
    "attrs": {
      "name": "description",
      "property": "og:description",
      "content": "Купить, снять квартиру от собственника.Аренда квартир или домов суточно. Ипотека"
    }
  },
  {
    "index": 12,
    "attrs": {
      "property": "og:image",
      "content": "https://play-lh.googleusercontent.com/aH9BpmgAQKGhSJHyxf0rRcLDPL70vsWUf2enCbaKFUjvPXJtM-jgMKWO4GRmycXyBco"
    }
  },
  {
    "index": 13,
    "attrs": {
      "name": "twitter:card",
      "content": "summary_large_image"
    }
  },
  {
    "index": 14,
    "attrs": {
      "name": "twitter:site",
      "content": "@GooglePlay"
    }
  },
  {
    "index": 15,
    "attrs": {
      "name": "twitter:title",
      "content": "Приложения в Google Play – Циан. Недвижимость, квартиры"
    }
  },
  {
    "index": 16,
    "attrs": {
      "name": "twitter:description",
      "content": "Купить, снять квартиру от собственника.Аренда квартир или домов суточно. Ипотека"
    }
  },
  {
    "index": 17,
    "attrs": {
      "name": "twitter:image",
      "content": "https://play-lh.googleusercontent.com/aH9BpmgAQKGhSJHyxf0rRcLDPL70vsWUf2enCbaKFUjvPXJtM-jgMKWO4GRmycXyBco=w600-h300-pc0xffffff-pd"
    }
  },
  {
    "index": 18,
    "attrs": {
      "name": "appstore:developer_url",
      "content": "https://cian.ru"
    }
  },
  {
    "index": 19,
    "attrs": {
      "name": "appstore:bundle_id",
      "content": "ru.cian.main"
    }
  },
  {
    "index": 20,
    "attrs": {
      "name": "appstore:store_id",
      "content": "ru.cian.main"
    }
  },
  {
    "index": 21,
    "attrs": {
      "itemprop": "url",
      "content": "https://play.google.com/store/apps/details?id=ru.cian.main&rdid=ru.cian.main&feature=md&offerId"
    }
  },
  {
    "index": 22,
    "attrs": {
      "itemprop": "price",
      "content": "0"
    }
  },
  {
    "index": 23,
    "attrs": {
      "itemprop": "description",
      "content": "Купить, снять квартиру от собственника.Аренда квартир или домов суточно. Ипотека"
    }
  }
]
```

### JSON-LD Blocks

```json
[
  {
    "index": 0,
    "parsed": {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Циан. Недвижимость, квартиры",
      "url": "https://play.google.com/store/apps/details/%D0%A6%D0%B8%D0%B0%D0%BD_%D0%9D%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C_%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B?id=ru.cian.main&hl=ru",
      "description": "Купить, снять квартиру от собственника.Аренда квартир или домов суточно. Ипотека",
      "operatingSystem": "ANDROID",
      "applicationCategory": "HOUSE_AND_HOME",
      "image": "https://play-lh.googleusercontent.com/aH9BpmgAQKGhSJHyxf0rRcLDPL70vsWUf2enCbaKFUjvPXJtM-jgMKWO4GRmycXyBco",
      "contentRating": "3+",
      "author": {
        "@type": "Person",
        "name": "Cian.ru",
        "url": "https://cian.ru"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.392857074737549",
        "ratingCount": "195602"
      },
      "offers": [
        {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "SEK",
          "availability": "https://schema.org/InStock"
        }
      ]
    }
  }
]
```

### AF_initData `ds:5` Known Candidate Paths

```json
{
  "title_tag": "Приложения в Google Play – Циан. Недвижимость, квартиры",
  "app_h1": "Циан. Недвижимость, квартиры",
  "ds_keys": [
    "ds:1",
    "ds:9",
    "ds:0",
    "ds:2",
    "ds:13",
    "ds:12",
    "ds:4",
    "ds:3",
    "ds:10",
    "ds:7",
    "ds:5",
    "ds:6",
    "ds:11",
    "ds:8"
  ],
  "known_paths": {
    "details[0][0]": "Циан. Недвижимость, квартиры",
    "details[68][1][4][2]": "/store/apps/developer?id=Cian.ru",
    "details[69][4][2][0]": "d. 27 str. 8, ul. Elektrozavodskaya Moscow Москва Russia 107023",
    "details[72][0][1]": "Циан — ведущий сервис в России для тех, кто ищет недвижимость для аренды, покупки или продажи. Здесь можно легко найти жилье для аренды посуточно или на длительный срок, а также предложения по продаже квартир, домов и коммерческих объектов. <br><br>Наш сервис предлагает широкий выбор жилья как в новостройках, так и на вторичном рынке, включая уникальные проекты квартир и детальные планировки. Все объявления проходят модерацию, что гарантирует их актуальность и достоверность. Для желающих купить квартиру или рассчитать ипотеку, Циан предоставляет все необходимые инструменты для оценки стоимости недвижимости. <br><br>🔍🏡Более 80 фильтров для удобного поиска квартир и домов<br>Ищите квартиры и дома для покупки или аренды с помощью интерактивной карты в приложении — просто выберите нужный район. Более 80 фильтров помогут найти подходящий вариант недвижимости с учетом инфраструктуры и характеристик жилья. Фильтруйте по цене, количеству комнат и другим параметрам. Сохраняйте поиск и добавляйте понравившиеся объекты в избранное, чтобы всегда быть в курсе объявлений о покупке, ипотеке или аренде жилья посуточно.<br><br>🏙️🆕Широкий выбор квартир в новостройках<br>Просто задайте параметры поиска квартиры: срок сдачи ЖК, этаж, площадь, наличие или отсутствие отделки, а также цену за всю квартиру или за квадратный метр. Если вы предпочитаете покупку от застройщиков или вам важна комнатность вашей квартиры, для вас доступны специальные фильтры. Таким образом, вы сможете легко найти свой идеальный ЖК.<br><br>📲💬Умный Циан-помощник для поиска недвижимости<br>Циан-помощник — интеллектуальный сервис, который покажет подходящие варианты квартир для аренды или покупки, поможет с ипотекой, сообщит о новых объявлениях, сэкономит время и поможет принять решение. Поручите поиск жилья искусственному интеллекту — задавайте критерии, а помощник пришлет вам подходящие варианты.<br><br>🏦📄Оформление ипотеки<br>Заполните одну анкету и отправьте её сразу в 7 банков — всего за 2 минуты вы получите персональные предложения по ипотеке. Сравните условия с помощью ипотечного калькулятора и выберите лучшее предложение, которое подойдет именно вам. Ипотека — это первый шаг к вашему будущему идеальному дому или квартире. Начните путь к мечте уже сегодня!<br><br>🔑🗺️Посуточная аренда квартир, домов и коттеджей<br>Удобный поиск жилья для аренды посуточно — квартиры, дома, коттеджи и комнаты. Смотрите варианты на карте или в списке, фильтруйте по цене, району, типу и удобствам. Легко сравнивайте объекты и выбирайте лучшее для аренды посуточно — в центре, у метро, у моря или рядом с достопримечательностями.<br><br>📢📝 Размещение объявлений о сдаче и продаже недвижимости<br>Размещайте объявления о продаже или аренде недвижимости любого типа. В личном кабинете доступны инструменты для общения с покупателями и арендаторам. Мы также предлагаем поддержку наших агентов, которые помогут решить любые вопросы, связанные с рынком недвижимости, обеспечивая плавный процесс покупки, продажи или аренды квартиры и другой недвижимости.<br><br>🏢💼Поиск коммерческой недвижимости для вашего бизнеса<br>Ищите коммерческую недвижимость для покупки или аренды, которая подходит под все ваши бизнес-потребности, включая офисы, склады, и торговые помещения. Удобные фильтры помогут быстро найти подходящий вариант по нужным параметрам. Сервис предоставляет широкий выбор недвижимости под разные цели и бюджеты.<br><br>💰📊Быстрая и бесплатная оценка недвижимости<br>Узнайте рыночную цену квартиры, дома или другой недвижимости быстро и бесплатно. Получите данные о кадастровой стоимости, текущих арендных ставках и истории цен по интересующему объекту. Это поможет точно оценить стоимость, выгодно инвестировать и принять обоснованное решение при продаже, покупке, аренде недвижимости и оформлении ипотеки.<br><br>Если недвижимость, то Циан!🏘️✨",
    "details[73][0][1]": "Купить, снять квартиру от собственника.Аренда квартир или домов суточно. Ипотека",
    "details[77][0]": "ru.cian.main",
    "details[79][0][0][1][4][2]": "/store/apps/category/HOUSE_AND_HOME",
    "details[95][0][3][2]": "https://play-lh.googleusercontent.com/aH9BpmgAQKGhSJHyxf0rRcLDPL70vsWUf2enCbaKFUjvPXJtM-jgMKWO4GRmycXyBco",
    "details[144][1][1]": "Стало проще управлять бронированием в посуточной аренде — завезли в личный кабинет раздел «Поездки и брони». Внутри вся база: статусы, чеки, даты, цены. Там же можно связаться с хозяином, внести предоплату, оставить отзыв или отменить бронь, если поменялись планы.",
    "details[12][0][0][1]": null
  }
}
```

### AF_initData `ds:5` Text Candidates (all strings `>= 20` chars after filtering obvious URLs/base64)

```json
[
  {
    "path": "details[0][0]",
    "length": 28,
    "value": "Циан. Недвижимость, квартиры"
  },
  {
    "path": "details[9][4][1]",
    "length": 80,
    "value": "<a href=\"https://support.google.com/googleplay?p=appgame_ratings\">Подробнее…</a>"
  },
  {
    "path": "details[9][6][1]",
    "length": 400,
    "value": "Приложения этой категории подходят для всех возрастов. Их персонажи могут проявлять комическую агрессию по отношению друг к другу, как, например, в мультсериалах \"Ну, погоди!\" или \"Том и Джерри\". При этом вымышленные герои не должны напоминать реальных. Кроме того, в приложениях этой категории нельзя использовать звуки или изображения, которые могут напугать маленьких детей, а также бранные слова."
  },
  {
    "path": "details[68][1][4][2]",
    "length": 32,
    "value": "/store/apps/developer?id=Cian.ru"
  },
  {
    "path": "details[69][4][2][0]",
    "length": 63,
    "value": "d. 27 str. 8, ul. Elektrozavodskaya Moscow Москва Russia 107023"
  },
  {
    "path": "details[72][0][1]",
    "length": 3843,
    "value": "Циан — ведущий сервис в России для тех, кто ищет недвижимость для аренды, покупки или продажи. Здесь можно легко найти жилье для аренды посуточно или на длительный срок, а также предложения по продаже квартир, домов и коммерческих объектов. <br><br>Наш сервис предлагает широкий выбор жилья как в новостройках, так и на вторичном рынке, включая уникальные проекты квартир и детальные планировки. Все объявления проходят модерацию, что гарантирует их актуальность и достоверность. Для желающих купить квартиру или рассчитать ипотеку, Циан предоставляет все необходимые инструменты для оценки стоимости недвижимости. <br><br>🔍🏡Более 80 фильтров для удобного поиска квартир и домов<br>Ищите квартиры и дома для покупки или аренды с помощью интерактивной карты в приложении — просто выберите нужный район. Более 80 фильтров помогут найти подходящий вариант недвижимости с учетом инфраструктуры и характеристик жилья. Фильтруйте по цене, количеству комнат и другим параметрам. Сохраняйте поиск и добавляйте понравившиеся объекты в избранное, чтобы всегда быть в курсе объявлений о покупке, ипотеке или аренде жилья посуточно.<br><br>🏙️🆕Широкий выбор квартир в новостройках<br>Просто задайте параметры поиска квартиры: срок сдачи ЖК, этаж, площадь, наличие или отсутствие отделки, а также цену за всю квартиру или за квадратный метр. Если вы предпочитаете покупку от застройщиков или вам важна комнатность вашей квартиры, для вас доступны специальные фильтры. Таким образом, вы сможете легко найти свой идеальный ЖК.<br><br>📲💬Умный Циан-помощник для поиска недвижимости<br>Циан-помощник — интеллектуальный сервис, который покажет подходящие варианты квартир для аренды или покупки, поможет с ипотекой, сообщит о новых объявлениях, сэкономит время и поможет принять решение. Поручите поиск жилья искусственному интеллекту — задавайте критерии, а помощник пришлет вам подходящие варианты.<br><br>🏦📄Оформление ипотеки<br>Заполните одну анкету и отправьте её сразу в 7 банков — всего за 2 минуты вы получите персональные предложения по ипотеке. Сравните условия с помощью ипотечного калькулятора и выберите лучшее предложение, которое подойдет именно вам. Ипотека — это первый шаг к вашему будущему идеальному дому или квартире. Начните путь к мечте уже сегодня!<br><br>🔑🗺️Посуточная аренда квартир, домов и коттеджей<br>Удобный поиск жилья для аренды посуточно — квартиры, дома, коттеджи и комнаты. Смотрите варианты на карте или в списке, фильтруйте по цене, району, типу и удобствам. Легко сравнивайте объекты и выбирайте лучшее для аренды посуточно — в центре, у метро, у моря или рядом с достопримечательностями.<br><br>📢📝 Размещение объявлений о сдаче и продаже недвижимости<br>Размещайте объявления о продаже или аренде недвижимости любого типа. В личном кабинете доступны инструменты для общения с покупателями и арендаторам. Мы также предлагаем поддержку наших агентов, которые помогут решить любые вопросы, связанные с рынком недвижимости, обеспечивая плавный процесс покупки, продажи или аренды квартиры и другой недвижимости.<br><br>🏢💼Поиск коммерческой недвижимости для вашего бизнеса<br>Ищите коммерческую недвижимость для покупки или аренды, которая подходит под все ваши бизнес-потребности, включая офисы, склады, и торговые помещения. Удобные фильтры помогут быстро найти подходящий вариант по нужным параметрам. Сервис предоставляет широкий выбор недвижимости под разные цели и бюджеты.<br><br>💰📊Быстрая и бесплатная оценка недвижимости<br>Узнайте рыночную цену квартиры, дома или другой недвижимости быстро и бесплатно. Получите данные о кадастровой стоимости, текущих арендных ставках и истории цен по интересующему объекту. Это поможет точно оценить стоимость, выгодно инвестировать и принять обоснованное решение при продаже, покупке, аренде недвижимости и оформлении ипотеки.<br><br>Если недвижимость, то Циан!🏘️✨"
  },
  {
    "path": "details[73][0][1]",
    "length": 80,
    "value": "Купить, снять квартиру от собственника.Аренда квартир или домов суточно. Ипотека"
  },
  {
    "path": "details[74][2][0][1][2][0][1]",
    "length": 41,
    "value": "Примерное местоположение (на основе сети)"
  },
  {
    "path": "details[74][2][0][1][2][1][1]",
    "length": 53,
    "value": "Точное местоположение (на основе сети и сигналов GPS)"
  },
  {
    "path": "details[74][2][0][2][2][0][1]",
    "length": 32,
    "value": "Осуществление телефонных вызовов"
  },
  {
    "path": "details[74][2][0][2][2][1][1]",
    "length": 35,
    "value": "Получение данных о статусе телефона"
  },
  {
    "path": "details[74][2][0][3][0]",
    "length": 22,
    "value": "Фото/мультимедиа/файлы"
  },
  {
    "path": "details[74][2][0][3][2][0][1]",
    "length": 33,
    "value": "Просмотр данных на USB-накопителе"
  },
  {
    "path": "details[74][2][0][3][2][1][1]",
    "length": 43,
    "value": "Изменение/удаление данных на USB-накопителе"
  },
  {
    "path": "details[74][2][0][4][2][0][1]",
    "length": 33,
    "value": "Просмотр данных на USB-накопителе"
  },
  {
    "path": "details[74][2][0][4][2][1][1]",
    "length": 43,
    "value": "Изменение/удаление данных на USB-накопителе"
  },
  {
    "path": "details[74][2][0][7][0]",
    "length": 29,
    "value": "Данные о подключении по Wi-Fi"
  },
  {
    "path": "details[74][2][0][7][2][0][1]",
    "length": 26,
    "value": "Просмотр подключений Wi-Fi"
  },
  {
    "path": "details[74][2][0][8][0]",
    "length": 43,
    "value": "Идентификатор устройства и данные о вызовах"
  },
  {
    "path": "details[74][2][0][8][2][0][1]",
    "length": 35,
    "value": "Получение данных о статусе телефона"
  },
  {
    "path": "details[74][2][0][8][3][0]",
    "length": 23,
    "value": "perm_device_information"
  },
  {
    "path": "details[74][2][1][0][2][0][1]",
    "length": 28,
    "value": "Просмотр сетевых подключений"
  },
  {
    "path": "details[74][2][1][0][2][1][1]",
    "length": 48,
    "value": "Установление соединения с устройствами Bluetooth"
  },
  {
    "path": "details[74][2][1][0][2][2][1]",
    "length": 26,
    "value": "Изменение сетевых настроек"
  },
  {
    "path": "details[74][2][1][0][2][3][1]",
    "length": 33,
    "value": "Подключение/отключение сети Wi-Fi"
  },
  {
    "path": "details[74][2][1][0][2][4][1]",
    "length": 33,
    "value": "Неограниченный доступ к Интернету"
  },
  {
    "path": "details[74][2][1][0][2][5][1]",
    "length": 24,
    "value": "Изменение настроек аудио"
  },
  {
    "path": "details[74][2][1][0][2][6][1]",
    "length": 31,
    "value": "Запуск при включении устройства"
  },
  {
    "path": "details[74][2][1][0][2][7][1]",
    "length": 36,
    "value": "Упорядочивание запущенных приложений"
  },
  {
    "path": "details[74][2][1][0][2][8][1]",
    "length": 32,
    "value": "Управление функцией вибросигнала"
  },
  {
    "path": "details[74][2][1][0][2][9][1]",
    "length": 53,
    "value": "Предотвращение переключения устройства в спящий режим"
  },
  {
    "path": "details[74][2][1][0][2][10][1]",
    "length": 35,
    "value": "Просмотр конфигурации службы Google"
  },
  {
    "path": "details[74][2][2][0][1]",
    "length": 29,
    "value": "Получение данных из интернета"
  },
  {
    "path": "details[79][0][0][1][4][2]",
    "length": 35,
    "value": "/store/apps/category/HOUSE_AND_HOME"
  },
  {
    "path": "details[136][1][0][1]",
    "length": 67,
    "value": "Это приложение может передавать указанные типы данных третьим лицам"
  },
  {
    "path": "details[136][1][0][2][1]",
    "length": 41,
    "value": "Местоположение, Личная информация и ещё 7"
  },
  {
    "path": "details[136][1][1][1]",
    "length": 51,
    "value": "Это приложение может собирать указанные типы данных"
  },
  {
    "path": "details[136][1][1][2][1]",
    "length": 44,
    "value": "Личная информация, Финансовые данные и ещё 5"
  },
  {
    "path": "details[136][1][2][1]",
    "length": 20,
    "value": "Данные не шифруются."
  },
  {
    "path": "details[136][1][3][1]",
    "length": 35,
    "value": "Вы можете запросить удаление данных"
  },
  {
    "path": "details[144][1][1]",
    "length": 264,
    "value": "Стало проще управлять бронированием в посуточной аренде — завезли в личный кабинет раздел «Поездки и брони». Внутри вся база: статусы, чеки, даты, цены. Там же можно связаться с хозяином, внести предоплату, оставить отзыв или отменить бронь, если поменялись планы."
  }
]
```

## App Store Metadata

### Visible Page Fields

```json
{
  "title_tag": "‎Приложение «Циан. Недвижимость. Квартиры.» — App Store",
  "title_h1": "Циан. Недвижимость. Квартиры.",
  "subtitle_h2_first": "Снять,продать,купить квартиру",
  "h2_headings": [
    "Снять,продать,купить квартиру",
    "События",
    "Оценки и отзывы",
    "Что нового",
    "Конфиденциальность приложения",
    "Данные, используе­мые для отслежи­вания информации",
    "Связанные с пользова­телем данные",
    "Данные, используе­мые для отслежи­вания информации",
    "Связанные с пользова­телем данные",
    "Универсальный доступ",
    "Информация",
    "Вам может также понравиться",
    "Африка, Ближний Восток и Индия",
    "Азиатско-Тихоокеанский регион",
    "Европа",
    "Латинская Америка и страны Карибского бассейна",
    "США и Канада"
  ]
}
```

### Page Meta Tags

```json
[
  {
    "index": 0,
    "attrs": {
      "charset": "utf-8"
    }
  },
  {
    "index": 1,
    "attrs": {
      "http-equiv": "X-UA-Compatible",
      "content": "IE=edge"
    }
  },
  {
    "index": 2,
    "attrs": {
      "name": "viewport",
      "content": "width=device-width,initial-scale=1"
    }
  },
  {
    "index": 3,
    "attrs": {
      "name": "applicable-device",
      "content": "pc,mobile"
    }
  },
  {
    "index": 4,
    "attrs": {
      "name": "referrer",
      "content": "strict-origin"
    }
  },
  {
    "index": 5,
    "attrs": {
      "name": "version",
      "content": "2606.9.0-external"
    }
  },
  {
    "index": 6,
    "attrs": {
      "name": "description",
      "content": "Загрузите приложение «Циан. Недвижимость. Квартиры.» от этого разработчика (Cian.ru) в App Store. См. скриншоты, оценки и отзывы, советы пользователей и другие…"
    }
  },
  {
    "index": 7,
    "attrs": {
      "name": "apple:title",
      "content": "Приложение «Циан. Недвижимость. Квартиры.» — App Store"
    }
  },
  {
    "index": 8,
    "attrs": {
      "name": "apple:description",
      "content": "Загрузите приложение «Циан. Недвижимость. Квартиры.» от этого разработчика (Cian.ru) в App Store. См. скриншоты, оценки и отзывы, советы пользователей и другие…"
    }
  },
  {
    "index": 9,
    "attrs": {
      "property": "og:title",
      "content": "Приложение «Циан. Недвижимость. Квартиры.» — App Store"
    }
  },
  {
    "index": 10,
    "attrs": {
      "property": "og:description",
      "content": "Загрузите приложение «Циан. Недвижимость. Квартиры.» от этого разработчика (Cian.ru) в App Store. См. скриншоты, оценки и отзывы, советы пользователей и другие…"
    }
  },
  {
    "index": 11,
    "attrs": {
      "property": "og:site_name",
      "content": "App Store"
    }
  },
  {
    "index": 12,
    "attrs": {
      "property": "og:url",
      "content": "https://apps.apple.com/ru/app/%D1%86%D0%B8%D0%B0%D0%BD-%D0%BD%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B/id911804296"
    }
  },
  {
    "index": 13,
    "attrs": {
      "property": "og:image",
      "content": "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/d2/10/30/d210305a-9a5b-df41-dfde-976ae15c4d4a/Placeholder.mill/1200x630wa.jpg"
    }
  },
  {
    "index": 14,
    "attrs": {
      "property": "og:image:secure_url",
      "content": "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/d2/10/30/d210305a-9a5b-df41-dfde-976ae15c4d4a/Placeholder.mill/1200x630wa.jpg"
    }
  },
  {
    "index": 15,
    "attrs": {
      "property": "og:image:alt",
      "content": "Циан. Недвижимость. Квартиры. в App Store"
    }
  },
  {
    "index": 16,
    "attrs": {
      "property": "og:image:width",
      "content": "1200"
    }
  },
  {
    "index": 17,
    "attrs": {
      "property": "og:image:height",
      "content": "630"
    }
  },
  {
    "index": 18,
    "attrs": {
      "property": "og:image:type",
      "content": "image/jpg"
    }
  },
  {
    "index": 19,
    "attrs": {
      "property": "og:locale",
      "content": "ru"
    }
  },
  {
    "index": 20,
    "attrs": {
      "name": "twitter:title",
      "content": "Приложение «Циан. Недвижимость. Квартиры.» — App Store"
    }
  },
  {
    "index": 21,
    "attrs": {
      "name": "twitter:description",
      "content": "Загрузите приложение «Циан. Недвижимость. Квартиры.» от этого разработчика (Cian.ru) в App Store. См. скриншоты, оценки и отзывы, советы пользователей и другие…"
    }
  },
  {
    "index": 22,
    "attrs": {
      "name": "twitter:site",
      "content": "@AppStore"
    }
  },
  {
    "index": 23,
    "attrs": {
      "name": "twitter:image",
      "content": "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/d2/10/30/d210305a-9a5b-df41-dfde-976ae15c4d4a/Placeholder.mill/1200x630wa.jpg"
    }
  },
  {
    "index": 24,
    "attrs": {
      "name": "twitter:image:alt",
      "content": "Циан. Недвижимость. Квартиры. в App Store"
    }
  }
]
```

### JSON-LD Blocks

```json
[
  {
    "index": 0,
    "parsed": {
      "@context": "https://schema.org",
      "@id": "https://apps.apple.com/#organization",
      "@type": "Organization",
      "name": "App Store",
      "url": "https://apps.apple.com",
      "logo": "https://apps.apple.com/assets/app-store.png",
      "sameAs": [
        "https://www.wikidata.org/wiki/Q368215",
        "https://twitter.com/AppStore",
        "https://www.instagram.com/appstore/",
        "https://www.facebook.com/appstore/"
      ],
      "parentOrganization": {
        "@type": "Organization",
        "name": "Apple",
        "@id": "https://www.apple.com/#organization",
        "url": "https://www.apple.com/"
      }
    }
  },
  {
    "index": 1,
    "parsed": {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Циан. Недвижимость. Квартиры.",
      "description": "Циан — ведущий сервис в России для тех, кто ищет недвижимость для аренды или покупки. Здесь можно легко найти жилье на короткий или длительный срок, а также предложения по продаже квартир, домов и коммерческих объектов. \n\nНаш сервис предлагает широкий выбор жилья как в новостройках, так и на вторичном рынке, включая уникальные проекты квартир и детальные планировки. Все объявления проходят модерацию, что гарантирует их актуальность и достоверность.\n\nБолее 80 фильтров для удобного поиска квартир и домов\nИщите квартиры и дома для покупки или аренды с помощью интерактивной карты в приложении — просто выберите нужный район. Более 80 фильтров помогут найти подходящий вариант с учетом инфраструктуры и характеристик жилья. Фильтруйте по цене, количеству комнат и другим параметрам. Сохраняйте поиск и добавляйте понравившиеся объекты в избранное, чтобы не упустить выгодные предложения от собственников без скрытых комиссий.\n\nШирокий выбор квартир в новостройках\nПросто задайте параметры поиска: срок сдачи ЖК, этаж, площадь, наличие или отсутствие отделки, а также цену за всю квартиру или за квадратный метр. Если вы предпочитаете покупку от застройщиков или вам важна комнатность вашей квартиры, для вас доступны специальные фильтры. Таким образом, вы сможете легко найти свой идеальный ЖК.\n\nУмный Циан-помощник для поиска недвижимости\nЦиан-помощник — интеллектуальный сервис, который покажет подходящие варианты, поможет с ипотекой, сообщит о новых объявлениях, сэкономит время и поможет принять решение. Поручите поиск жилья искусственному интеллекту — задавайте критерии, а помощник пришлет вам подходящие варианты.\n\nОформление ипотеки\nЗаполните одну анкету и отправьте её сразу в 7 банков — всего за 2 минуты вы получите персональные предложения по ипотеке. Сравните условия и выберите то, что подходит именно вам. Ипотека — это первый шаг к вашему будущему дому или квартире. Начните путь к мечте уже сегодня!\n\nПосуточная аренда квартир, домов и коттеджей\nУдобный поиск жилья для посуточной аренды — квартиры, дома, коттеджи и комнаты. Смотрите варианты на карте или в списке, фильтруйте по цене, району, типу и удобствам. Легко сравнивайте объекты и выбирайте лучшее - в центре, у метро, у моря или рядом с достопримечательностями.\n\nРазмещение объявлений о сдаче и продаже недвижимости\nРазмещайте объявления о продаже или аренде недвижимости любого типа. В личном кабинете доступны инструменты для общения с покупателями и арендаторами — звонки, чат и поддержка агентов, которые помогут на всех этапах сделки.\n\nПоиск коммерческой недвижимости для вашего бизнеса\nАрендуйте или покупайте коммерческую недвижимость, подходящую под все ваши бизнес-потребности, включая офисы, склады, и торговые помещения. Удобные фильтры помогут быстро найти подходящий вариант по нужным параметрам. Сервис предоставляет широкий выбор предложений под разные цели и бюджеты.\n\nБыстрая и бесплатная оценка недвижимости\nУзнайте рыночную цену квартиры, дома или другой недвижимости быстро и бесплатно. Получите данные о кадастровой стоимости, текущих арендных ставках и истории цен по интересующему объекту. Это поможет точно оценить стоимость, выгодно инвестировать и принять обоснованное решение при продаже, покупке или аренде.\n\nЕсли недвижимость, то Циан!",
      "image": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/ca/9c/0f/ca9c0f97-a69a-fedb-0fba-b983d67454a2/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/1200x630wa.png",
      "availableOnDevice": "iPhone, iPad",
      "operatingSystem": "Требуется iOS 16.0 и новее. Совместимо с iPhone, iPad и iPod touch.",
      "offers": {
        "@type": "Offer",
        "price": 0,
        "priceCurrency": "RUB",
        "category": "free"
      },
      "applicationCategory": "Образ жизни",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.7,
        "reviewCount": 279739
      },
      "author": {
        "@type": "Organization",
        "name": "Cian.ru",
        "url": "https://apps.apple.com/ru/developer/cian-ru/id1100203582"
      }
    }
  }
]
```

### Lookup API Raw App Object

```json
{
  "isGameCenterEnabled": false,
  "artistViewUrl": "https://apps.apple.com/ru/developer/cian-ru/id1100203582?uo=4",
  "artworkUrl60": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/ca/9c/0f/ca9c0f97-a69a-fedb-0fba-b983d67454a2/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/60x60bb.jpg",
  "artworkUrl100": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/ca/9c/0f/ca9c0f97-a69a-fedb-0fba-b983d67454a2/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/100x100bb.jpg",
  "features": [
    "iosUniversal"
  ],
  "supportedDevices": [
    "iPhone5s-iPhone5s",
    "iPadAir-iPadAir",
    "iPadAirCellular-iPadAirCellular",
    "iPadMiniRetina-iPadMiniRetina",
    "iPadMiniRetinaCellular-iPadMiniRetinaCellular",
    "iPhone6-iPhone6",
    "iPhone6Plus-iPhone6Plus",
    "iPadAir2-iPadAir2",
    "iPadAir2Cellular-iPadAir2Cellular",
    "iPadMini3-iPadMini3",
    "iPadMini3Cellular-iPadMini3Cellular",
    "iPodTouchSixthGen-iPodTouchSixthGen",
    "iPhone6s-iPhone6s",
    "iPhone6sPlus-iPhone6sPlus",
    "iPadMini4-iPadMini4",
    "iPadMini4Cellular-iPadMini4Cellular",
    "iPadPro-iPadPro",
    "iPadProCellular-iPadProCellular",
    "iPadPro97-iPadPro97",
    "iPadPro97Cellular-iPadPro97Cellular",
    "iPhoneSE-iPhoneSE",
    "iPhone7-iPhone7",
    "iPhone7Plus-iPhone7Plus",
    "iPad611-iPad611",
    "iPad612-iPad612",
    "iPad71-iPad71",
    "iPad72-iPad72",
    "iPad73-iPad73",
    "iPad74-iPad74",
    "iPhone8-iPhone8",
    "iPhone8Plus-iPhone8Plus",
    "iPhoneX-iPhoneX",
    "iPad75-iPad75",
    "iPad76-iPad76",
    "iPhoneXS-iPhoneXS",
    "iPhoneXSMax-iPhoneXSMax",
    "iPhoneXR-iPhoneXR",
    "iPad812-iPad812",
    "iPad834-iPad834",
    "iPad856-iPad856",
    "iPad878-iPad878",
    "iPadMini5-iPadMini5",
    "iPadMini5Cellular-iPadMini5Cellular",
    "iPadAir3-iPadAir3",
    "iPadAir3Cellular-iPadAir3Cellular",
    "iPodTouchSeventhGen-iPodTouchSeventhGen",
    "iPhone11-iPhone11",
    "iPhone11Pro-iPhone11Pro",
    "iPadSeventhGen-iPadSeventhGen",
    "iPadSeventhGenCellular-iPadSeventhGenCellular",
    "iPhone11ProMax-iPhone11ProMax",
    "iPhoneSESecondGen-iPhoneSESecondGen",
    "iPadProSecondGen-iPadProSecondGen",
    "iPadProSecondGenCellular-iPadProSecondGenCellular",
    "iPadProFourthGen-iPadProFourthGen",
    "iPadProFourthGenCellular-iPadProFourthGenCellular",
    "iPhone12Mini-iPhone12Mini",
    "iPhone12-iPhone12",
    "iPhone12Pro-iPhone12Pro",
    "iPhone12ProMax-iPhone12ProMax",
    "iPadAir4-iPadAir4",
    "iPadAir4Cellular-iPadAir4Cellular",
    "iPadEighthGen-iPadEighthGen",
    "iPadEighthGenCellular-iPadEighthGenCellular",
    "iPadProThirdGen-iPadProThirdGen",
    "iPadProThirdGenCellular-iPadProThirdGenCellular",
    "iPadProFifthGen-iPadProFifthGen",
    "iPadProFifthGenCellular-iPadProFifthGenCellular",
    "iPhone13Pro-iPhone13Pro",
    "iPhone13ProMax-iPhone13ProMax",
    "iPhone13Mini-iPhone13Mini",
    "iPhone13-iPhone13",
    "iPadMiniSixthGen-iPadMiniSixthGen",
    "iPadMiniSixthGenCellular-iPadMiniSixthGenCellular",
    "iPadNinthGen-iPadNinthGen",
    "iPadNinthGenCellular-iPadNinthGenCellular",
    "iPhoneSEThirdGen-iPhoneSEThirdGen",
    "iPadAirFifthGen-iPadAirFifthGen",
    "iPadAirFifthGenCellular-iPadAirFifthGenCellular",
    "iPhone14-iPhone14",
    "iPhone14Plus-iPhone14Plus",
    "iPhone14Pro-iPhone14Pro",
    "iPhone14ProMax-iPhone14ProMax",
    "iPadTenthGen-iPadTenthGen",
    "iPadTenthGenCellular-iPadTenthGenCellular",
    "iPadPro11FourthGen-iPadPro11FourthGen",
    "iPadPro11FourthGenCellular-iPadPro11FourthGenCellular",
    "iPadProSixthGen-iPadProSixthGen",
    "iPadProSixthGenCellular-iPadProSixthGenCellular",
    "iPhone15-iPhone15",
    "iPhone15Plus-iPhone15Plus",
    "iPhone15Pro-iPhone15Pro",
    "iPhone15ProMax-iPhone15ProMax",
    "iPadAir11M2-iPadAir11M2",
    "iPadAir11M2Cellular-iPadAir11M2Cellular",
    "iPadAir13M2-iPadAir13M2",
    "iPadAir13M2Cellular-iPadAir13M2Cellular",
    "iPadPro11M4-iPadPro11M4",
    "iPadPro11M4Cellular-iPadPro11M4Cellular",
    "iPadPro13M4-iPadPro13M4",
    "iPadPro13M4Cellular-iPadPro13M4Cellular",
    "iPhone16-iPhone16",
    "iPhone16Plus-iPhone16Plus",
    "iPhone16Pro-iPhone16Pro",
    "iPhone16ProMax-iPhone16ProMax",
    "iPadMiniA17Pro-iPadMiniA17Pro",
    "iPadMiniA17ProCellular-iPadMiniA17ProCellular",
    "iPhone16e-iPhone16e",
    "iPadA16-iPadA16",
    "iPadA16Cellular-iPadA16Cellular",
    "iPadAir11M3-iPadAir11M3",
    "iPadAir11M3Cellular-iPadAir11M3Cellular",
    "iPadAir13M3-iPadAir13M3",
    "iPadAir13M3Cellular-iPadAir13M3Cellular",
    "iPhone17Pro-iPhone17Pro",
    "iPhone17ProMax-iPhone17ProMax",
    "iPhone17-iPhone17",
    "iPhoneAir-iPhoneAir",
    "iPadPro11M5-iPadPro11M5",
    "iPadPro11M5Cellular-iPadPro11M5Cellular",
    "iPadPro13M5-iPadPro13M5",
    "iPadPro13M5Cellular-iPadPro13M5Cellular"
  ],
  "kind": "software",
  "screenshotUrls": [
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/3d/80/25/3d80250a-511d-6473-8b6b-7058b6b46f1d/13fd7430-59dc-4c53-b88d-0680d2146d77_1_1242_U04452208.jpg/392x696bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/04/85/b2/0485b2b5-c191-141b-a608-94c940753a0e/db82f472-f56b-4c90-a57f-17493985ea8d_2_1242_U04452208.jpg/392x696bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/65/e4/98/65e498a9-e205-654b-e372-8bace1f54638/970d3957-a4a1-4be0-9cdc-fbe14c4779a9_3_1242_U04452208.jpg/392x696bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/20/22/4e/20224e9c-55f7-7fab-3e36-73027595df38/775bfc97-d051-47a4-b762-d61241e92153_1242_U04452208_4.jpg/392x696bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/ca/71/ed/ca71edb3-975b-a4d4-a5ab-f96556946da4/53f23ef9-0439-470a-bf9d-616b6fdc6fa0_5_1242_U04452208.jpg/392x696bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/e2/18/45/e2184599-abce-deb1-7d0a-353419f04f53/61cb0128-9757-4b9a-83c4-ec4e0fc11d39_6_1242_U04452208.jpg/392x696bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/bb/b6/48/bbb648d7-f9a6-1f5e-f20b-935023e90366/e00dd35a-b03b-4ce5-b2c8-3bc8a0496379_7_1242_U04452208.jpg/392x696bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/fe/e6/ad/fee6ad89-9a69-0638-b322-ddef8ba9fecd/3de1bd1c-62ca-4812-b945-0567a36fc37f_8_1242_U04452208.jpg/392x696bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/8b/1e/ca/8b1eca54-f7c3-704e-6368-86e6db1febba/ff261339-1272-444f-ba4f-ee64dcdca6e3_9_1242_U04452208.jpg/392x696bb.jpg"
  ],
  "ipadScreenshotUrls": [
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/2a/e8/97/2ae89726-d3d9-27f8-d778-556a13ce355e/45488268-2b6a-4b2d-938e-c1f8c6f1ccfd_2048__U00d7_2732_1.jpg/576x768bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/26/6f/3f/266f3fd4-6636-d172-69cb-061d479acb0a/d66d8663-2a00-4583-a185-d186553f13a0_2048__U00d7_2732_2.jpg/576x768bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/aa/94/af/aa94af2a-c3fe-03b1-e866-c2850e9b4bfe/dfb1c579-ae27-45cf-b340-3cdd4a53a539_2048__U00d7_2732_3.jpg/576x768bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/f6/2c/cc/f62ccc33-67ea-7fbf-dc69-ede6f86f2d86/952035f3-7c16-4b83-a389-725454ccc8ac_2048__U00d7_2732_4.jpg/576x768bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/37/70/24/37702442-aa4f-de26-1543-94a356f2f209/34a24ded-c00a-4d96-b407-a976bd6620cf_2048__U00d7_2732_5.jpg/576x768bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/b2/8c/19/b28c19fd-fe04-9de6-bd75-0fbaec5eaed8/0228cd73-06b8-4a8d-92c8-f63ad48fbbc1_2048__U00d7_2732_6.jpg/576x768bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/e5/18/72/e51872eb-4f8d-d9e3-5729-2d053d455db4/46b5fd8d-0acb-4b4d-afb9-dd4612351455_2048__U00d7_2732_7.jpg/576x768bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/c8/a5/fb/c8a5fb21-e92b-c7c1-38a1-7c45dc7e57c7/4dd0541e-26ea-4268-b548-b4e5532da973_2048__U00d7_2732_8.jpg/576x768bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/48/9e/78/489e7881-2d61-707a-06e8-12b073ad7221/a5ae367b-45b3-42f9-8d03-1a7031568df0_2048__U00d7_2732_9.jpg/576x768bb.jpg"
  ],
  "appletvScreenshotUrls": [],
  "artworkUrl512": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/ca/9c/0f/ca9c0f97-a69a-fedb-0fba-b983d67454a2/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg",
  "advisories": [],
  "contentAdvisoryRating": "4+",
  "averageUserRating": 4.65591,
  "trackCensoredName": "Циан. Недвижимость. Квартиры.",
  "trackViewUrl": "https://apps.apple.com/ru/app/%D1%86%D0%B8%D0%B0%D0%BD-%D0%BD%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B/id911804296?uo=4",
  "genres": [
    "Образ жизни",
    "Бизнес"
  ],
  "price": 0,
  "bundleId": "ru.cian.mobile",
  "sellerName": "CIAN TECHNOLOGIES LIMITED",
  "genreIds": [
    "6012",
    "6000"
  ],
  "isVppDeviceBasedLicensingEnabled": true,
  "currentVersionReleaseDate": "2026-03-08T23:57:05Z",
  "trackId": 911804296,
  "trackName": "Циан. Недвижимость. Квартиры.",
  "releaseDate": "2014-12-21T15:12:07Z",
  "primaryGenreName": "Lifestyle",
  "primaryGenreId": 6012,
  "releaseNotes": "Как выглядел дикий Циан до вмешательства человека? Может, там древние люди искали уютную пещеру? Этого мы не узнаем, потому что обновили приложение.",
  "version": "1.417.1",
  "wrapperType": "software",
  "currency": "RUB",
  "description": "Циан — ведущий сервис в России для тех, кто ищет недвижимость для аренды или покупки. Здесь можно легко найти жилье на короткий или длительный срок, а также предложения по продаже квартир, домов и коммерческих объектов. \n\nНаш сервис предлагает широкий выбор жилья как в новостройках, так и на вторичном рынке, включая уникальные проекты квартир и детальные планировки. Все объявления проходят модерацию, что гарантирует их актуальность и достоверность.\n\nБолее 80 фильтров для удобного поиска квартир и домов\nИщите квартиры и дома для покупки или аренды с помощью интерактивной карты в приложении — просто выберите нужный район. Более 80 фильтров помогут найти подходящий вариант с учетом инфраструктуры и характеристик жилья. Фильтруйте по цене, количеству комнат и другим параметрам. Сохраняйте поиск и добавляйте понравившиеся объекты в избранное, чтобы не упустить выгодные предложения от собственников без скрытых комиссий.\n\nШирокий выбор квартир в новостройках\nПросто задайте параметры поиска: срок сдачи ЖК, этаж, площадь, наличие или отсутствие отделки, а также цену за всю квартиру или за квадратный метр. Если вы предпочитаете покупку от застройщиков или вам важна комнатность вашей квартиры, для вас доступны специальные фильтры. Таким образом, вы сможете легко найти свой идеальный ЖК.\n\nУмный Циан-помощник для поиска недвижимости\nЦиан-помощник — интеллектуальный сервис, который покажет подходящие варианты, поможет с ипотекой, сообщит о новых объявлениях, сэкономит время и поможет принять решение. Поручите поиск жилья искусственному интеллекту — задавайте критерии, а помощник пришлет вам подходящие варианты.\n\nОформление ипотеки\nЗаполните одну анкету и отправьте её сразу в 7 банков — всего за 2 минуты вы получите персональные предложения по ипотеке. Сравните условия и выберите то, что подходит именно вам. Ипотека — это первый шаг к вашему будущему дому или квартире. Начните путь к мечте уже сегодня!\n\nПосуточная аренда квартир, домов и коттеджей\nУдобный поиск жилья для посуточной аренды — квартиры, дома, коттеджи и комнаты. Смотрите варианты на карте или в списке, фильтруйте по цене, району, типу и удобствам. Легко сравнивайте объекты и выбирайте лучшее - в центре, у метро, у моря или рядом с достопримечательностями.\n\nРазмещение объявлений о сдаче и продаже недвижимости\nРазмещайте объявления о продаже или аренде недвижимости любого типа. В личном кабинете доступны инструменты для общения с покупателями и арендаторами — звонки, чат и поддержка агентов, которые помогут на всех этапах сделки.\n\nПоиск коммерческой недвижимости для вашего бизнеса\nАрендуйте или покупайте коммерческую недвижимость, подходящую под все ваши бизнес-потребности, включая офисы, склады, и торговые помещения. Удобные фильтры помогут быстро найти подходящий вариант по нужным параметрам. Сервис предоставляет широкий выбор предложений под разные цели и бюджеты.\n\nБыстрая и бесплатная оценка недвижимости\nУзнайте рыночную цену квартиры, дома или другой недвижимости быстро и бесплатно. Получите данные о кадастровой стоимости, текущих арендных ставках и истории цен по интересующему объекту. Это поможет точно оценить стоимость, выгодно инвестировать и принять обоснованное решение при продаже, покупке или аренде.\n\nЕсли недвижимость, то Циан!",
  "averageUserRatingForCurrentVersion": 4.65591,
  "sellerUrl": "http://www.cian.ru",
  "languageCodesISO2A": [
    "RU"
  ],
  "fileSizeBytes": "301461504",
  "formattedPrice": "Бесплатно",
  "userRatingCountForCurrentVersion": 279739,
  "trackContentRating": "4+",
  "minimumOsVersion": "16.0",
  "artistId": 1100203582,
  "artistName": "Cian.ru",
  "userRatingCount": 279739
}
```
