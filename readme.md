SELECT * FROM people OFFSET 0 LIMIT 10

bara muna næst
# Vefforritun 2, 2022. Verkefni 2: Viðburðakerfi

[Kynning á verkefni í tíma](https://youtu.be/pLwY4LiR6gc).

Búa þarf til viðburðakerfi sem hefur admin viðmót þar sem hægt er að búa til og breyta viðburðum ásamt opinni skráningu á viðburði á vef.

## Markmið

Eftirfarandi eru markmið verkefnisins:

- Setja upp express vef með dýnamískum routes og EJS templateum til að útbúa HTML og tengja við útlit
- Setja upp form sem sendir gögn af framenda á bakenda og staðfestir þau
- Setja upp postgres gagnagrunn með tveim tengdum töflum og vinna með gögn í þeim
- Setja upp auðkenningarkerfi með innskráningu
- Halda áfram að nota tæki, tól og test
- Setja upp verkefni á Heroku

Bent er á [verkefni 3 í vefforritun 2 árið 2021](https://github.com/vefforritun/vef2-2021-v3) og [sýnilausn á því](https://github.com/vefforritun/vef2-2021-v3-synilausn) sem er svipað og getur hjálpað til við að ná skilning á uppsetningu.

Að auki er gefinn grunnur með uppsettningu sem leyfir keyrslu á testum með mismunandi `.env` skrám.

### Express og útlit

Halda áfram skal með express uppsetningu með þeim routes sem þarf til að birta og taka við gögnum:

- `GET /` birtir forsíðu með skráðum viðburðum, ef engir birta skilaboð um það
- `GET /:slug` birtir viðburð með þeim `slug`, skráða aðila og skráningarform, ef engin `404` villusíðu
- `POST /:slug` tekur við skráningu á viðburð
- `GET /admin/login` birtir innskráningarsíðu
- `GET /admin/` birtir lista yfir viðburði ásamt formi neðst til að búa til nýjan viðburð
- `POST /admin/` býr til nýjan viðburð
- `GET /admin/:slug` birtir viðburð með þeim `slug` og formi til að breyta, ef engin `404` villusíðu
- `POST /admin/:slug` uppfærir viðburð

Setja skal upp merkingarfræðilegt HTML með útliti sem notar flexbox eða grid. Gefin er einföld fyrirmynd sem nýta má eða útfæra eigið útlit sem sýnir sömu gögn.

Fyrirmynd er undir [`utlit/`](./utlit), gildi fyrir letur og liti:

```css
--fonts: Helvetica, Arial, sans-serif;
--color-white: #eee;
--color-accent: #aa6;
--color-accent-dark: #663;
--color-accent-light: #cc8;
```

### Form og gagnavinnsla

Þar sem tekið er við gögnum skal útbúa `<form>` sem tekur við gögnum. Þegar þau eru send á bakenda skal framkvæma _validation_ og _sanitization_ á gögnum áður en þau eru vistuð í gagnagrunn.

Ef villur eru í gögnum skal birta það á framenda ásamt þeim gildum sem komu fram.

Huga þarf að öryggi, sér í lagi að engar _xss_ holur séu til staðar. Leyfilegt er að taka við HTML og birta, ef það er öruggt.

### Postgres grunnur

Vista skal gögn í postgres gagnagrunni.

Fyrir viðburði:

- `id` primary key fyrir töflu
- `name` krafist, nafn á viðburði hámark 64 stafir, t.d. `Hönnuðahittingur í mars`
- `slug` útbúið útfrá nafni hámark 64 stafir, krafist, útbúið útfrá `name` þ.a. aðeins `ASCII` stafir séu notaðir og `-` í staðinn fyrir bil, t.d. `honnudahittingur-i-mars`
- `description`, texti, valkvæmt
- `created`, dagstími þegar færsla var búin til
- `updated`, dagstími þegar færslu var breytt

Fyrir skráningar:

- `id` primary key fyrir töflu
- `name` krafist, nafn á þeim sem skráir sig, hámark 64 stafir
- `comment` valkvæmt, athugasemd við skráningu
- `event` tala, krafist, vísun í `id` í viðburðatöflu
- `created`, dagstími þegar færsla var búin til

Huga þarf að öryggi, sér í lagi að engar _injection_ holur séu til staðar.

Útbúa skal a.m.k. þrjá test viðburði og eina til þrjár test skráningar á hvern þeirra.

### Auðkenningarkerfi með innskráningu

Útfæra skal innskráningarkerfi með `passport` og `passport-local`. Ekki þarf að setja upp nýskráningu en nota skal töflu í postgres grunni til að geyma notendanafn og lykilorð. Lykilorð skal vista með `bcrypt`.

Nota skal `passport` og `passport-local` til að setja upp innskráningu, ekki þarf að setja upp nýskráningu.

Geyma skal gögn fyrir notanda í töflu í gagnagrunni:

- `id` primary key fyrir töflu
- `username` einkvæmt og krafist, hámark 64 stafir
- `password` krafist, hámark 256 stafir

Útbúa skal a.m.k. einn notanda með gefið notendanafn lykilorð í `readme` í skilum.

Innskráningu skal birta ef farið er á `/admin` og innskráning er ekki til staðar. Ef reynt er að innskrá og villa kemur upp skal birta villuskilaboð um það.

Inni á admin síðu skal birta viðburði og möguleiki á að skoða þá, breyta, og síðan bæta við nýjum viðburðum.

Huga þarf að öryggi, sér í lagi að aðeins sé hægt að framkvæma aðgerðir ef viðkomandi er innskráður og að lykilorð sé geymt á öruggan máta.

### Tæki, tól og test

Uppsett er `eslint`, `prettier` og `stylelint` fyrir JavaScript og CSS. Engar villur skulu koma fram ef `npm run lint` er keyrt.

`jest` er uppsett með dæmi um hvernig keyra megi test á _sér_ test gagnagrunn.

Skrifa skal test fyrir a.m.k.:

- eina skráningu í gagnagrunn
- validation á einu formi

### Heroku

Setja skal upp vefinn á Heroku tengt við GitHub með Heroku postgres settu upp.

## Mat

- 20% Express uppsetning, EJS template, HTML og útlit
- 20% Form á framenda og validation og sanitization á gögnum í bakenda
- 20% Uppsetning á gagnagrunni
- 20% Innskráningarkerfi
- 10% Tæki, tól og test
- 10% Heroku

## Sett fyrir

Verkefni sett fyrir í fyrirlestri miðvikudaginn 2. febrúar 2022.

## Skil

Skila skal í Canvas í seinasta lagi fyrir lok dags föstudaginn 18. febrúar 2022.

Skil skulu innihalda:

- Slóð á verkefni keyrandi á Heroku
- Slóð á GitHub repo fyrir verkefni. Dæmatímakennurum skal hafa verið boðið í repo. Notendanöfn þeirra eru:
  - `MarzukIngi`
  - `WhackingCheese`

# Vefforritun 2, 2023, verkefni 2: enn betra viðburðakerfi

[Kynning í fyrirlestri](https://www.youtube.com/watch?v=p0z71I1qOCg)

## Markmið

- Vinna með og uppfæra kóða úr keyrandi verkefni
- Setja upp express vef með: routes, EJS templateum, formum með staðfestingu og notendaumsjón
- Setja upp postgres gagnagrunn, vinna með skema og gögn sem til eru og bæta við þau
- Setja upp verkefni í hýsingu

## Verkefnið

Halda skal áfram með [verkefni 2: viðburðakerfi](https://github.com/vefforritun/vef2-2022-v2) frá því í vefforritun 2 árið 2022. Byggja skal ofan á [sýnilausn sem gefin var út](https://github.com/vefforritun/vef2-2022-v2-synilausn) (ekki er krafa að gera; það má byggja verkefnið alveg frá grunni en það er töluvert meiri vinna.)

### Uppfærslur á pökkum og lagfæringar

Uppfæra skal alla pakka í verkefni í nýjustu útgáfu og passa að verkefni keyri.

Uppfæra skal þ.a. nota skal node útgáfu 18.

Laga skal hvernig test keyra, ef test sem nota test gagnagrunn keyra geta þau skilið eftir gögn sem valda því að næsta keyrsla getur ekki „droppa“ gagnagrunni.

### Almennir notendur og skráning á viðburði

Bæta skal við virkni fyrir „almenna notendur“ (þ.e.a.s. ekki stjórnendur) með nýskráningu og innskráningu.

Skráning á viðburði krefur notanda um að vera innskráður eða fara gegnum nýskráningu.

Notendur sem eru innskráðir geta skráð sig á viðburði eða skráð sig af þeim.

### Möguleiki á að eyða viðburðum og auka gögn

Bæta skal við möguleika á að eyða viðburðum ef innskráður notandi er stjórnandi.

Bæta við fleiri gögnum á viðburði:

- Staðsetning, má vera tóm.
- Slóð (URL), má vera tóm.

### Paging á viðburðum

Bæta skal við _paging_ á gögnum þ.a. ef viðburðir fara yfir 10 þá sé boðið upp á að fara á næstu síðu. Á síðu sem sýnir viðuburði 11+ skal bjóða upp á að fara á fyrri síðu.

Ekki þarf að bæta við paging á skráningar.

### Tæki, tól og test

`eslint` og `jest` er uppsett í verkefninu. Ekki ættu að vera neinar `eslint` villur og öll test ættu að keyra.

Bæta skal við a.m.k. einu testi fyrir hverja nýja virkni.

Aðeins skal nota ECMAScript modules (ESM) og ekki CommonJS.

### GitHub og hýsing

Setja skal upp vefinn á Render, Railway eða Heroku (ath að uppsetning á Heroku mun kosta) tengt við GitHub með postgres settu upp.

## Mat

- 10% Uppfærslur á pökkum og lagfæringar
- 30% Almennir notendur og skráning á viðburði
- 20% Möguleiki á að eyða viðburðum og auka gögn
- 20% Paging á viðburðum
- 10% Tæki, tól og test
- 10% GitHub og hýsing

## Sett fyrir

Verkefni sett fyrir í fyrirlestri mánudaginn 6. febrúar 2023.

## Skil

Skila skal í Canvas í seinasta lagi fyrir lok dags fimmtudaginn 23. febrúar 2023.

Skil skulu innihalda:

- Slóð á verkefni keyrandi í hýsingu.
- Slóð á GitHub repo fyrir verkefni. Dæmatímakennurum skal hafa verið boðið í repo. Notendanöfn þeirra eru:
  - `MarzukIngi`
  - `ofurtumi`
  - `osk`
