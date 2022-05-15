# SilabaJS

**„Silaba”** a reprezentat un despărțitor în silabe, realizat prin anii 1995-2000 în limbajul de programare C++ pentru o serie de programe de tehnoredactare, precum Ventura, PageMaker, Word, InDesign, XPress.

Acest depozit GIT redă algoritmul de segmentare în limbajul JavaScript. 

Pentru experimentare, urmați acești pași:

* Descărcați fișierele **Silaba.js** și **TestSilabaJS.html**; plasați-le într-un folder oarecare. (Dacă descărcați o arhivă de la secțiunea [Releases](https://github.com/Viorel/SilabaJS/releases), dezarhivați-o).
* Deschideți fișierul descărcat **TestSilabaJS.html** într-un navigator Web modern (de ex.: Microsoft Edge). Navigatorul va afișa două cîmpuri de text:
 
![image](https://user-images.githubusercontent.com/246827/167702599-48c9810e-001b-4872-be89-a50fc2cd74ed.png)

* In cîmpul „Cuvinte”, introduceți cuvintele care urmează a fi despărțite în silabe. (Pot fi introduse mai multe cuvinte pe linie). Cîmpul „Despărțire în silabe” va afișa segmentarea pentru toate cuvintele introduse.
 
---

Acest despărțitor are următoarele caracteristici.

### Despărțirea „după structură”

În principal, despărțitorul realizează modalitatea de segmentare „după structură”. De exemplu, cuvîntul „subacvatic” este despărțit „sub-acvatic”, nu „su-bacvatic”, care reprezintă o altă modalitate permisă („după pronunțare”).

### Actualizare conform DOOM 3

Algoritmul a fost actualizat în conformitate cu _Dicționarul ortografic, ortoepic și morfologic al limbii române. Ediția a III-a revăzută și adăugită_ (DOOM 3), inclusiv Erata din aprilie 2022.

### Diferențe față de despărțirea strictă

Acest despărțitor încearcă să pună cratime numai în poziții sigure. În unele situații incerte referitoare la prefixe sau hiaturi, despărțirea este incompletă.

De obicei, segmentarea incompletă nu reprezintă o problemă, deoarece programele de tehnoredactare distribuie spații compensatorii între cuvinte. Programele mai includ funcții de despărțire manuală, care pot fi aplicate atunci cînd despărțirea automată este insuficientă.

Silabele constituite dintr-o singură vocală de la începutul sau sfîrșitul cuvintelor sînt considerate neeconomice, de aceea astfel de despărțiri sînt evitate.

Cuvintele care se aseamănă cu numerele romane nu se despart (de exemplu: „viii”).

Nu se face despărțirea care ar produce segmente cu sens neelegant.

---

Sper că transformarea codului din C++ în JavaScript (cam inutilă, ce-i drept) nu a introdus defecte.

