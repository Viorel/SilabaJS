# SilabaJS

**„Silaba”** a reprezentat un despărțitor în silabe, realizat prin anii 1995-2000 în limbajul de programare C++ pentru o serie de programe de tehnoredactare computerizată, precum Ventura, PageMaker, Word, InDesign, XPress.

Acest depozit GIT redă algoritmul de segmentare prin mijloace JavaScript. 

Pentru experimentare, urmați acești pași:

* Descărcați fișierele **Silaba.js** și **TestSilabaJS.html**; plasați-le într-un folder oarecare. Dacă descărcați o arhivă, dezarhivați-o.
* Deschideți fișierul descărcat **TestSilabaJS.html** într-un navigator Web modern (de ex.: Microsoft Edge). Navigatorul va afișa două cîmpuri de text:
 
![image](https://user-images.githubusercontent.com/246827/144776212-a8b4c99d-60e7-4ade-90c9-8123f951e755.png)

* In cîmpul „Cuvinte”, introduceți cuvintele care urmează a fi despărțite în silabe. (Pot fi introduse mai multe cuvinte pe linie). Cîmpul „Resultat” va afișa rezultatele segmentării pentru toate cuvintele introduse.
 
---

Acest despărțitor are următoarele caracteristici.

### Despărțirea „după structură”

În principal, despărțitorul realizează modalitatea de segmentare „după structură”. De exemplu, cuvîntul „subacvatic” este despărțit „sub-acvatic”, nu „su-bacvatic”, care reprezintă o altă modalitate permisă („după pronunțare”).

### Actualizare conform DOOM 2 și DOOM 3

Față de versiunile anterioare, algoritmul a fost actualizat în conformitate cu _Dicționarul ortografic, ortoepic și morfologic al limbii române. Ediția a II-a revăzută și adăugită_ (DOOM 2). Actualizarea conform Ediției a III-a (DOOM 3), apărute recent, este în curs de examinare.

### Diferențe față de despărțirea strictă

Acest despărțitor încearcă să pună cratimele numai în poziții sigure. De exemplu, cuvîntul „deși” nu este despărțit, pentru că acesta este ori conjuncție monosilabică, care nu se desparte, ori pluralul adjectivului „des”, care s-ar despărți „de-și”. 

Unele cuvinte care încep cu posibile prefixe, de exemplu: „sub”, nu se despart complet dacă rolul lui „sub” este incert. 

Iar unele cuvinte care includ secvențe vocalice, de exemplu: „ia”, nu sînt despărțite în poziția „i-a” dacă dicționarul intern nu conține suficiente detalii despre natura acestei secvențe (diftong sau hiat).

De obicei, despărțirea incompletă nu reprezintă o problemă, deoarece programele de tehnoredactare distribuie spații compensatorii între cuvinte. Programele mai includ funcții de despărțire manuală, care pot fi aplicate dacă rezultatul produs de despărțitor este insuficient.

Silabele constituite dintr-o singură vocală de la începutul sau sfîrșitul cuvintelor sînt considerate neeconomice, de aceea astfel de silabe sînt evitate.

Cuvintele care sînt sau se aseamănă cu numerele romane nu se despart (de exemplu: „viii”).

Nu se face despărțirea care ar produce segmente cu sens neelegant.

---

Sper că transformarea codului din C++ în JavaScript nu a introdus defecte. Unele ajustări ale dicționarului intern mai sînt în lucru.

