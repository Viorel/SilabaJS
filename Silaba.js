
Silaba =
{

    Desparte: function ( text )
    {
        var rezultat = "";

        Silaba.Impl.RegexSpl.lastIndex = 0;

        for( ; ; )
        {
            var a = Silaba.Impl.RegexSpl.exec( text );

            if( a == null ) break;

            if( a[1] !== undefined )
            {
                var impl = new Silaba.Impl( a[1] );

                impl.Desparte();

                rezultat += impl.CuvintCuCratime();
            }
            else if( a[2] !== undefined )
            {
                rezultat += a[2];
            }
        }

        return rezultat;
    }
};


(
    function ()
    {
        var impl = function ( cuvint )
        {
            this.cuvintOriginal = cuvint;

            // cuvint ajustat
            this.cuvint = cuvint.toLowerCase().replace( Silaba.Impl.RegexAdj, "î" );
            this.lungime = cuvint.length;

            this.cratime = 0;
            this.inhib = 0;
        };



        impl.prototype.Dictionar =
        {
            /* //...
            "PC": { "anti": 2 },
            "PI": { "contra": 4 },
            "CF": { "antici": 2 },
            "CE": { "antiperistal": 170 },
            "SC": { "metri": 2 },
            "SI": { "algie": 0 },
            "FS": { "dier": 2 }
            */
            /*
            "FS": {
                "dier": 2,
                "iind": 1,
                "iitor": 3,
                "liar": 2,
                "nial": 2,
                "nier": 2,
                "rian": 2,
                "rien": 2,
                "riol": 2,
                "rium": 2,
                "sion": 2,
                "siun": 2,
                "\u0163ial": 2,
                "\u0163ion": 2,
                "\u0163iun": 2,
                "via\u0163ia": 22,
                "via\u0163ie": 22
            }
            */

            "PC": { "aero": 3, "agro": 1, "anti": 2, "arhi": 2, "astro": 2, "auto": 3, "bio": 2, "business": 8, "cardio": 20, "c\u00EEte\u015Fi": 2, "cross": 0, "electro": 9, "extra": 2, "feld": 0, "fizio": 10, "foto": 2, "galvano": 20, "geo": 2, "hiper": 2, "hipo": 2, "homeo": 10, "homo": 2, "inter": 2, "izo": 1, "kilo": 2, "lands": 0, "macro": 2, "magneto": 20, "mc": 0, "mega": 2, "meta": 2, "micro": 2, "mili": 2, "mold": 0, "moldovagaz": 84, "mono": 2, "nemai": 2, "neuro": 6, "nici": 0, "ohmamper": 20, "ori\u015Fi": 4, "paleo": 10, "penta": 4, "petro": 2, "proto": 4, "pseudo": 12, "psih": 0, "psiho": 4, "psihro": 4, "radio": 10, "retro": 2, "semi": 2, "silvo": 4, "sincro": 4, "spectro": 8, "super": 2, "supra": 2, "tele": 2, "telecom": 8, "termo": 4, "termocom": 16, "trans": 0, "ultra": 2, "uni": 1, "vice": 2, "voltamper": 40, "voltohm": 8, "water": 0, "watt": 0, "west": 0, "zoo": 2 }, "PI": { "an": 0, "bi": 0, "contra": 4, "dez": 0, "ex": 0, "hidro": 0, "in": 0, "intra": 2, "ne": 0, "non": 0, "pan": 0, "poli": 0, "port": 0, "post": 0, "pre": 0, "pro": 0, "re": 0, "steto": 4, "sub": 0, "tri": 0 }, "SC": { "metri": 2, "metrii": 2, "metrilor": 18, "metru": 2, "metrul": 2, "scoape": 8, "scoapele": 40, "scoapelor": 40, "scop": 0, "scopia": 20, "scopic": 4, "scopica": 20, "scopic\u0103": 20, "scopice": 20, "scopicei": 20, "scopicele": 84, "scopicelor": 84, "scopici": 4, "scopicii": 20, "scopicilor": 84, "scopicul": 20, "scopicului": 84, "scopie": 4, "scopii": 4, "scopiile": 52, "scopiilor": 52, "scopul": 4, "scopului": 20, "service": 4, "sfera": 4, "sfer\u0103": 4, "sfere": 4, "sferele": 20, "sferi": 0, "sferic": 4, "sferice": 20, "sfericelor": 84, "sferici": 4, "sfericul": 20, "sfericului": 84, "sferii": 4, "sperma": 8, "sperm\u0103": 8, "sperme": 8, "spermei": 8, "spermele": 40, "spermelor": 40, "spermia": 40, "spermie": 40, "spermiei": 40, "spermii": 8, "spermiile": 104, "spermiilor": 104, "sta\u0163ia": 20, "sta\u0163ie": 4, "sta\u0163iei": 20, "sta\u0163ii": 4, "sta\u0163iile": 52, "sta\u0163iilor": 52 }, "SI": { "aldina": 0, "aldin\u0103": 0, "aldine": 0, "aldinei": 0, "aldinele": 0, "aldini": 0, "algia": 0, "algie": 0, "algii": 0, "algiile": 0, "algiilor": 0, "ectazia": 0, "ectazie": 0, "ectaziei": 0, "ectazii": 0, "ectaziile": 0, "ectaziilor": 0, "ectomia": 0, "ectomie": 0, "ectomii": 0, "ectomiile": 0, "ectomiilor": 0, "emia": 0, "emie": 0, "emiei": 0, "emii": 0, "emiile": 0, "emiilor": 0, "estezia": 0, "estezic": 0, "estezica": 0, "estezic\u0103": 0, "estezice": 0, "estezicele": 0, "estezicelor": 0, "estezici": 0, "estezicii": 0, "estezicilor": 0, "estezicului": 0, "estezie": 0, "esteziei": 0, "estezii": 0, "esteziile": 0, "esteziilor": 0, "gnostic": 0, "gnostice": 0, "gnosticele": 0, "gnosticul": 0, "gnosticului": 0, "gnosticuri": 0, "opsia": 0, "opsie": 0, "opsiei": 0, "opsii": 0, "opsiile": 0, "opsiilor": 0, "pter": 0, "ptere": 0, "pterele": 0, "pterelor": 0, "pterul": 0, "pterului": 0, "spasm": 0, "spasme": 0, "spasmele": 0, "spasmul": 0, "spor": 0, "spori": 0, "sporii": 0, "sporilor": 0, "sporul": 0, "sporului": 0, "stat": 0, "state": 0, "statele": 0, "statelor": 0, "static": 0, "statica": 0, "static\u0103": 0, "statici": 0, "staticii": 0, "staticilor": 0, "staticul": 0, "statul": 0 }, "CF": { "adas": 0, "adolphe": 1, "aerobi": 3, "aero\u015Fi": 3, "agerpres": 8, "agroindbank": 72, "altcareva": 84, "altceva": 20, "altcineva": 84, "altc\u00EEndva": 68, "altcum": 4, "altcumva": 36, "altfel": 4, "alt\u00EEncotro": 84, "altminterea": 164, "altminterelea": 676, "altminteri": 36, "altundeva": 84, "antici": 2, "anticva": 18, "anticv\u0103": 18, "anticvei": 18, "antistene": 82, "arthur": 2, "asean": 0, "asirom": 0, "asito": 0, "astfel": 4, "atem": 0, "auschwitz": 2, "autor": 3, "autori": 3, "barb\u0103scump\u0103": 276, "basa": 0, "baudelair": 16, "b\u0103ietr\u0103u": 18, "blues": 0, "braille": 0, "brigitte": 4, "caer": 0, "calalb": 4, "cartney": 8, "charles": 0, "cincilei": 16, "c\u00EEndva": 8, "c\u00EE\u0163iva": 8, "compasinter": 164, "corcimaru": 80, "creditinvest": 164, "deoarece": 42, "despre": 2, "dinadins": 12, "dinafar\u0103": 44, "dinapoi": 12, "dinapoia": 44, "electrecord": 81, "electroni": 9, "electrozi": 9, "extragi": 2, "extra\u015Fi": 2, "fiindc\u0103": 18, "fotoni": 2, "france": 0, "gates": 0, "geoan\u0103": 0, "georges": 0, "hardware": 8, "hiperide": 42, "hiperion": 42, "hiperon": 10, "hiperoni": 10, "hiperonii": 42, "hiperonilor": 170, "hobby": 0, "hollywood": 16, "iap\u0103scurt\u0103": 138, "ibidem": 2, "icral": 0, "indcon": 4, "indmontaj": 4, "interes": 10, "interesa": 42, "interese": 42, "interi": 2, "interii": 10, "interilor": 42, "interim": 10, "interni": 2, "interog\u0103m": 42, "interul": 10, "interului": 42, "irta": 0, "\u00EEnadins": 6, "\u00EEndeob\u015Fte": 42, "\u00EEndeosebi": 26, "jacques": 0, "jane": 0, "jeep": 0, "jiujitsu": 4, "kathmandu": 8, "kathy": 2, "lesotho": 10, "leutze": 4, "liechtenstein": 144, "louis": 0, "lukoil": 4, "macrou": 2, "magnetou": 20, "metacomimpex": 72, "metri": 2, "michael": 2, "milii": 2, "m\u00EEn\u0103scurt\u0103": 138, "molda": 4, "moldan": 4, "mold\u0103": 4, "moldcell": 8, "molde": 4, "moldei": 4, "moldele": 20, "moldelor": 20, "moldocon": 16, "monomi": 2, "montreal": 40, "nato": 0, "neuroni": 6, "ohmi": 0, "onu": 0, "orice": 4, "oricine": 20, "oric\u00EEnd": 4, "oricum": 4, "ori\u00EEncotro": 84, "oriunde": 20, "osce": 0, "pentani": 4, "petroi": 2, "poli\u015Fciuc": 18, "protoni": 4, "radio\u015Fi": 10, "r\u0103salalt\u0103ieri": 332, "reuter": 0, "romarta": 0, "romenergo": 4, "romexpo": 0, "sincroni": 4, "s\u00EEntilie": 8, "slbaslbaslba": 1193, "software": 8, "standart": 16, "superbi": 2, "tarom": 0, "tehoptimed": 68, "teleap": 2, "telex": 2, "totodat\u0103": 44, "totuna": 12, "transa": 8, "trans\u0103": 8, "transei": 8, "transele": 40, "transelor": 40, "trinca": 8, "unesco": 0, "unicef": 0, "unimi": 1, "uni\u0163i": 1, "usa": 0, "voxtel": 4, "water": 2, "zadnipru": 18, "zg\u00EErcibab\u0103": 32 }, "CE": { "abidjan": 5, "ablacta": 18, "ablega": 10, "aborigen": 22, "abrog": 2, "abrup": 2, "absorb\u0163i": 34, "abstrac": 4, "abstrag": 4, "abstr\u0103g": 4, "abstru": 4, "acetonuri": 37, "acidamin": 25, "aciua": 9, "acroparestez": 329, "acrostih": 9, "acrostol": 9, "actinopterigi": 298, "adopt": 2, "adop\u0163": 2, "adumbr": 2, "aeroas": 19, "albaspin": 10, "albgard": 4, "aldosteron": 74, "alohton": 5, "althorn": 4, "altostratus": 138, "amblistom": 146, "amerindi": 41, "amnezi": 1, "amperormetr": 82, "analfab": 10, "anestezi": 10, "anionactiv": 82, "anorgan": 10, "antalgic": 20, "antanaclaz": 44, "antanagog": 44, "antarctic": 36, "antarctid": 36, "antiperistal": 170, "anuri": 2, "apnee": 1, "areal": 5, "armstrong": 4, "arzmahzar": 36, "aspermatic": 81, "aspirit": 9, "astatizare": 169, "astereogno": 105, "astigmat": 17, "astup": 1, "atelectazi": 41, "ateroscler": 21, "athos": 1, "atoate\u015Ftiut": 41, "autarhi": 5, "autoar": 3, "autopsie": 21, "autopsii": 21, "azerbaidjan": 73, "azoturi": 9, "bancnot": 8, "bancru": 8, "bangkok": 8, "bankcoop": 8, "bathor": 2, "batiscaf": 10, "beethoven": 36, "berbantl\u00EEc": 68, "bergman": 8, "bernstein": 8, "bern\u015Ftain": 8, "berthelot": 32, "bethleem": 8, "binocl": 4, "bisanual": 44, "bistabil": 18, "blagoslov": 20, "blefaroptoz": 84, "blochaus": 8, "botswan": 8, "bridgetown": 32, "buchenwald": 34, "buenos": 4, "bun\u0103star": 10, "bun\u0103st\u0103r": 10, "calcutti": 20, "carboxi": 8, "cartnic": 8, "catamnez": 20, "catharsi": 34, "cation": 4, "cauz": 2, "cehoslovac": 74, "centrafrica": 304, "centramerica": 688, "cerargi": 20, "cercosporioz": 660, "cerebrospin": 74, "cetonuri": 18, "chemosorb\u0163i": 276, "chintesen": 48, "cianamid": 26, "cilindruri": 66, "cincisprezec": 272, "cincisut": 16, "cincizeci": 16, "cinorex": 12, "cisalpin": 20, "cisiordan": 44, "cisiord\u0103n": 44, "clarobscur": 40, "cloramin": 24, "cloretan": 24, "cloreton": 24, "cnocaut": 8, "cockpit": 8, "cocktail": 8, "cocost\u00EErc": 10, "codalb": 4, "cod\u0103lb": 4, "codro\u015F": 4, "colalgol": 20, "colenchim": 20, "coleoptil": 26, "colerez": 12, "colester": 20, "colinerg": 10, "conakry": 10, "contralt": 16, "contrasubiect": 292, "conurba\u0163i": 20, "coproscleroz": 274, "coprostaz": 18, "coprosterol": 146, "corectaz": 20, "corectopi": 20, "corticosteron": 596, "co\u015Faveraj": 44, "crear": 4, "creat": 4, "crea\u0163i": 4, "criptorhidi": 80, "criselefan": 88, "cromafin": 24, "cronaxi": 24, "cuproxi": 8, "decaster": 10, "decastil": 10, "decatlo": 12, "decister": 10, "deoch": 2, "deos": 2, "desc\u0103zut": 18, "descri": 2, "descrip": 2, "descuam": 18, "desf\u0103tui": 18, "designul": 34, "despera": 18, "despintec": 34, "destabil": 18, "destrun": 2, "destup": 2, "deutschland": 64, "dezacord": 12, "dezactiv": 20, "dezafect": 12, "dezagreabil": 204, "dezagrega": 76, "dezam\u0103g": 12, "dezamors": 12, "dezaprob": 12, "dezarm": 4, "dezastr": 2, "dezavantaj": 76, "dezechi": 12, "dezert": 2, "dezic": 2, "deziderat": 42, "dezinfec": 20, "dezinform": 20, "dezintegr": 84, "dezordin": 20, "dezorient": 44, "diaftorez": 38, "diagno": 6, "diaspor": 6, "diastaltic": 6, "diastaz": 6, "diastem": 6, "diastil": 6, "diastol": 6, "diastolic": 6, "diftong": 2, "diplopi": 8, "diplur": 8, "dipnoi": 2, "disagio": 12, "disartri": 20, "disenteri": 20, "disneyland": 36, "disneyworld": 36, "disosmi": 4, "distih": 2, "distil": 2, "distom": 2, "disuri": 4, "diu": 2, "doisprezec": 68, "dou\u0103sprezecim": 650, "dreptunghi": 16, "duraci": 4, "duralumin": 44, "elicopter": 21, "emistih": 5, "enarmoni": 10, "endosmoz": 12, "enterectazi": 82, "enterectomi": 82, "entomostrace": 42, "enurezis": 22, "epigastralgi": 133, "episceni": 5, "episcop": 9, "epistaxis": 37, "epistil": 5, "epistrof": 5, "ergosterol": 74, "eritropsin": 17, "etilenoxi": 37, "etnopsiholog": 330, "eupnee": 3, "eurasia": 13, "exarh": 2, "exempl": 1, "exilarh": 9, "exorbi": 2, "extract": 2, "extrac\u0163": 2, "faustpatro": 16, "fiin": 2, "fitosterol": 10, "flancgard": 16, "flancg\u0103rz": 16, "folclor": 8, "formaldehi": 168, "fotodezintegr": 330, "francmason": 80, "frankfurt": 16, "freetown": 8, "fukushim": 10, "gangster": 8, "gentilom": 36, "georg": 8, "ghiocei": 12, "ghiocel": 12, "giravi": 4, "golaveraj": 44, "gulfstream": 8, "habsburg": 8, "haendel": 8, "handbal": 8, "hardpan": 8, "h\u0103r\u015Fne": 8, "h\u0103r\u015Fni": 8, "helmintospor": 164, "hemangi": 4, "hemaralopi": 74, "hemartroz": 20, "hematemez": 18, "hematuri": 18, "hemeostaz": 26, "hemoptizi": 10, "hemostaz": 10, "hermafrodi": 24, "hesperornis": 164, "hexametilentetramin": 17578, "hexastih": 10, "hexod": 4, "hiat": 2, "hidartroz": 4, "hidraci": 8, "hidragof": 8, "hidramnio": 8, "hidrargi": 8, "hidraulic": 56, "hidroftalmi": 40, "hidronim": 24, "hidroscal": 16, "hidroxi": 24, "hiperonul": 42, "hipnagogi": 24, "hipuric": 12, "histamin": 24, "hornblend": 8, "ideal": 5, "ignar": 1, "ignor": 1, "imprescrip": 18, "inacce": 10, "inactiv": 6, "inadecv": 6, "inadmis": 10, "inamic": 6, "inaugur": 14, "indescrip": 10, "indestruc": 10, "inefic": 6, "inegal": 6, "inevitab": 22, "innsburck": 8, "insubordon": 18, "interesan": 42, "interesar": 42, "interesat": 42, "interesa\u0163": 42, "interes\u0103": 42, "interes\u0103r": 42, "intereseaz": 42, "interesel": 42, "interesez": 42, "interes\u00EEnd": 42, "interesul": 42, "interimar": 42, "interimat": 42, "interioar": 42, "interior": 42, "interoga": 42, "interoghe": 42, "interog\u00EEnd": 42, "intransigen": 162, "intransmisibil": 1346, "intranzitiv": 162, "intra\u015Fcolar": 146, "inutil": 6, "iodopsin": 10, "ireal": 5, "iugoslav": 10, "izanomal": 22, "izold": 1, "\u00EEmpreun": 18, "\u00EEnaint": 5, "\u00EEnaltprea": 16, "\u00EEnaltpreasfin": 272, "\u00EEnaltpreasf\u00EEn": 272, "\u00EEnamor": 6, "\u00EEnapoi": 6, "\u00EEnarip": 6, "\u00EEnarm": 2, "\u00EEnaur": 6, "\u00EEnavu\u0163": 6, "\u00EEn\u0103cr": 2, "\u00EEn\u0103lb": 2, "\u00EEn\u0103spr": 2, "\u00EEntrajutor": 88, "\u00EEntrarip": 24, "\u00EEntrarm": 8, "\u00EEntruni": 8, "jackson": 8, "kampuchi": 20, "kilovoltamper": 650, "kingsto": 8, "labirintodon": 138, "lactalbumin": 168, "lagoftalmi": 20, "lagostom": 8, "landgraf": 8, "landlor": 8, "land\u015Faft": 8, "landtag": 8, "laud": 2, "laudanum": 20, "laur": 2, "laurea": 22, "leptospir": 20, "leptospiroz": 148, "leucemi": 26, "limfadeni": 24, "limfangit": 40, "lipiodol": 20, "litarg": 4, "lombartroz": 40, "lombosciatic": 404, "luminoschem": 42, "lungmetraj": 40, "magnanim": 24, "malacostracee": 554, "maladres": 12, "malonest": 12, "malone\u015Ft": 12, "malonilure": 74, "manifestat": 74, "manifesta\u0163": 74, "manoper": 12, "manuscri": 10, "mar\u015Frut": 8, "material": 42, "matronimic": 88, "m\u0103rinim": 12, "medulotransfuz": 1066, "megohm": 4, "melanuri": 18, "metacril": 12, "metalazbest": 82, "metaldehi": 20, "metencef": 20, "metiloranj": 48, "metonim": 12, "metonomasi": 44, "mezalian": 44, "mezencef": 20, "mezenchim": 20, "mezenter": 20, "mezoscaf": 10, "micosterol": 74, "micropsi": 8, "miop": 2, "miori\u0163": 6, "mixedem": 12, "mizanscen": 20, "mizantrop": 20, "m\u00EEn\u0103\u015Fterg": 10, "moldav": 4, "moldavia": 8, "moldov": 4, "moldream": 4, "monoame": 18, "monoclu": 12, "monocular": 36, "monodi": 4, "monoxi": 4, "montimorilloni": 88, "multiubi": 8, "multstima": 8, "naftilamin": 36, "neadopt": 10, "necropsi": 8, "nefroscleroz": 272, "neitzsche": 16, "neo": 2, "neschimb": 2, "nescris": 2, "nesf\u00EEr\u015Fi": 34, "nespus": 2, "netransport": 66, "neurasten": 42, "nev\u00EErstnic": 66, "nevralgi": 8, "nevrectomi": 40, "newyorkez": 4, "nezdruncin": 66, "nicotinamid": 202, "nietzsche": 16, "nimbostrat": 20, "noctambul": 40, "nomarh": 4, "nonexist": 4, "noradrenalin": 332, "nou\u0103sprezec": 138, "nurnberg": 8, "obiect": 2, "obiec\u0163": 2, "oblong": 2, "obova": 2, "obtuzunghi": 18, "odontalgi": 17, "oiconimi": 4, "oligantrop": 41, "oligarh": 9, "oliguri": 9, "omniscien": 10, "omorganic": 10, "omuci": 2, "optsprezec": 68, "optzeci": 4, "orica": 4, "oric\u0103": 4, "oric\u00EEt": 4, "oric\u00EE\u0163i": 4, "oviscapt": 5, "paisprezec": 68, "panameric": 44, "panatenaic": 172, "panatenee": 172, "panelen": 12, "panislam": 20, "panoptic": 20, "panoram": 12, "panortodo": 84, "pantoptoz": 24, "panunional": 108, "paraacetaldehi": 154, "parafaz": 4, "paraformaldehi": 138, "paramnez": 20, "parasc\u00EEnt": 10, "paravalan\u015F": 44, "paraxial": 36, "parenteral": 84, "parodon": 12, "paronim": 12, "paronomaz": 76, "parosmi": 4, "paroxiton": 44, "pa\u015Fopti": 4, "patognom": 10, "patronimic": 88, "patrunghi": 8, "pauz": 2, "pazvantl\u00EE": 68, "pazvantogl": 68, "peninsul": 20, "pentatlo": 24, "pentod": 8, "penultim": 20, "penumbr": 4, "peraci": 4, "perestroi": 10, "peristalti": 10, "peristil": 10, "perminvar": 40, "perora\u0163": 4, "peroxi": 12, "petersburg": 34, "petroaie": 34, "picnostil": 20, "pio": 2, "pionier": 22, "piroscaf": 10, "placodon": 24, "plagistom": 20, "polemarh": 18, "polimetacril": 74, "polisport": 10, "portarm": 8, "portavio": 88, "portbagaj": 40, "postbelic": 40, "postdat": 8, "posteminesc": 88, "poster": 4, "postlice": 40, "postmeridian": 680, "postproces": 72, "postscript": 8, "postuniversitar": 2648, "pravoslav": 20, "preasfin": 8, "preasf\u00EEn": 8, "preasl\u0103v": 8, "preastima": 72, "preastr\u0103lucit": 648, "preaviz": 12, "preo": 4, "preschimb": 4, "prescri": 4, "prescur": 4, "prognatism": 36, "prognostic": 68, "prognoz": 4, "pronosport": 20, "proparoxiton": 356, "proscri": 4, "proscriptor": 132, "proscrip\u0163i": 132, "prosl\u0103v": 4, "prostern": 4, "prostil": 4, "protamin": 24, "protargol": 40, "protoxi": 8, "pruncucider": 176, "pruncuciga\u015F": 176, "pseudartroz": 80, "psihiatr": 20, "psihic": 4, "pteranodon": 40, "punctaveraj": 176, "punctbal": 16, "radioas": 10, "radiotransmisiun": 10778, "r\u0103s\u00EEn\u0163eleg": 84, "reac\u0163": 2, "real": 2, "reosp\u0103l": 6, "reostric\u0163": 6, "resorb\u0163i": 34, "respect": 4, "resping": 4, "respira": 18, "responsabil": 164, "restaur": 18, "restitu": 18, "restric": 2, "restructur": 66, "retransmi": 66, "richard": 2, "rinencefal": 84, "rodanhidric": 84, "roosvelt": 8, "rototransla": 266, "rozalb": 4, "salvconduct": 8, "salvgard": 8, "santiago": 40, "sarcosporidioz": 660, "saun": 2, "savantl\u00EEc": 34, "scintiscanograf": 1320, "scleroftalm": 80, "scopolamin": 100, "scurtcircuit": 656, "scurtmetraj": 80, "selfinduc": 40, "seminc": 2, "semin\u0163": 2, "semi\u0163i": 2, "serodiagnostic": 1130, "serumalbumin": 338, "setaveraj": 44, "shakespear": 16, "siloxi": 4, "sinarhi": 4, "sinarmonism": 84, "sinartroz": 4, "sinoptic": 20, "sinuci": 12, "slavoslov": 20, "somnambul": 40, "soviet": 10, "stanislav": 20, "stockholm": 16, "subapreci": 12, "subestim": 20, "subiect": 4, "subordon": 20, "substrat": 4, "suburb": 4, "sulfamid": 24, "sulfhidric": 40, "superioar": 42, "superior": 42, "suplean": 18, "sveatoslav": 40, "\u015Faisprezec": 68, "\u015Faptesprezec": 276, "\u015Ftiin\u0163": 4, "tahipnee": 10, "talc\u015Fist": 8, "taur": 2, "taut": 2, "taylor": 4, "teatr": 2, "telangiectazi": 340, "teleag": 2, "telencefal": 84, "teo": 2, "tereftalic": 74, "termionic": 56, "termisto": 20, "testosteron": 148, "tetrachen": 24, "tetrarh": 8, "tetratlo": 24, "tetrod": 8, "tiocarbamid\u0103": 198, "tiroxin": 12, "t\u00EErg\u015Fo": 8, "toponim": 12, "toponomastic": 300, "transcri": 8, "transcristal": 272, "transept": 8, "transilv": 8, "transpir": 8, "tranzac\u0163i": 16, "treisprezec": 136, "trencicot": 32, "tricloretilen": 708, "trietanolamin": 812, "triftong": 4, "triptic": 8, "tristabil": 36, "tristearin": 100, "unind": 1, "unsprezec": 34, "untdelemn": 20, "varor": 4, "veaceslav": 20, "velastrai": 10, "vicent": 2, "vicenz": 2, "vinars": 4, "vindiac": 8, "visceroptoz": 36, "v\u00EErstnic": 16, "vreun": 4, "washington": 66, "wehrmacht": 8, "welington": 34, "westminster": 72, "windsor": 8, "xantopsi": 8, "xeroftalmi": 20, "zavistnic": 34, "zinnwaldi": 8 }, "FS": { "dier": 2, "iind": 1, "iitor": 3, "liar": 2, "nial": 2, "nier": 2, "rian": 2, "rien": 2, "riol": 2, "rium": 2, "sion": 2, "siun": 2, "\u0163ial": 2, "\u0163ion": 2, "\u0163iun": 2, "via\u0163ia": 22, "via\u0163ie": 22 }
        };


        impl.RegexAdj = new RegExp( /â/ug );//.compile();
        impl.RegexSpl = new RegExp( /(\p{L}+)|(\P{L}+)/ug ); //.compile();



        impl.prototype.Desparte = function ()
        {
            if( this.lungime == 0 ) return 0;

            var aplicat = this.IncearcaCuvinteFixe();

            if( !aplicat )
            {
                aplicat = this.IncearcaPrefixe();

                if( !aplicat )
                {
                    // nu e cuvint fix nici prefix nici exceptie

                    aplicat = this.IncearcaSufixe();
                }

                if( !aplicat )
                {
                    this.IncearcaAnalitic();
                }
            }

            return aplicat;
        }


        impl.prototype.IncearcaCuvinteFixe = function ()
        {
            if( this.Dictionar.CF === undefined ) return;

            var c = this.Dictionar.CF[this.cuvint];

            if( c === undefined ) return false;

            this.cratime |= c;

            return true;
        }


        impl.prototype.IncearcaPrefixe = function ()
        {
            var prefix_cert = this.CautaPrefix( this.Dictionar.PC );
            var prefix_incert = this.CautaPrefix( this.Dictionar.PI );
            var exceptie = this.CautaPrefix( this.Dictionar.CE );

            if( prefix_incert !== undefined &&
                ( prefix_cert === undefined || prefix_cert[0].length <= prefix_incert[0].length ) &&
                ( exceptie === undefined || exceptie[0].length <= prefix_incert[0].length ) )
            {
                var prefix = prefix_incert[0];
                var lun_prefix = prefix.length;
                //var cratime = prefix_incert[1]; // neutilizat//.........

                var ultima_litera = prefix.slice( -1 );

                if( this.EVocala( ultima_litera ) )
                {
                    // prefix incert terminat in vocala;
                    // REGULA: inhiba cratima in pozitia '~': ...V|C~C...

                    if( this.lungime - lun_prefix >= 2 &&
                        this.EConsoana( this.cuvint[lun_prefix] ) &&
                        this.EConsoana( this.cuvint[lun_prefix + 1] ) )
                    {
                        this.inhib |= 1 << lun_prefix;
                    }
                }
                else
                {
                    // prefix incert terminat in consoana;
                    // REGULA: inhiba cratime in pozitiile '~': ...VC~C~C|...

                    var i = lun_prefix - 1;
                    while( --i >= 0 )
                    {
                        this.inhib |= 1 << i;
                        if( this.EVocala( this.cuvint[i] ) ) break;
                    }
                }

                // NOTA. Cratimele definite pentru prefixe incerte nu au efect.

                if( !this.IncearcaSufixe() )
                {
                    this.IncearcaAnalitic();
                }

                return true;
            }

            if( exceptie !== undefined &&
                ( prefix_cert === undefined || prefix_cert[0].length <= exceptie[0].length ) &&
                ( prefix_incert === undefined || prefix_incert[0].length <= exceptie[0].length ) )
            {
                var cratime = exceptie[1];

                this.cratime |= cratime;

                // segmenteaza portiunea de dupa ultima cratima

                var ultima_cratima = this.UltimaCratima( cratime );

                if( ultima_cratima > 0 )
                {
                    var coada = this.cuvint.slice( ultima_cratima + 1 );

                    var alt = new Silaba.Impl( coada );

                    if( !alt.IncearcaSufixe() )
                    {
                        alt.IncearcaAnalitic();
                    }

                    this.cratime |= alt.cratime << ( ultima_cratima + 1 );
                }

                return true;
            }

            if( prefix_cert !== undefined &&
                ( prefix_incert === undefined || prefix_incert[0].length <= prefix_cert[0].length ) &&
                ( exceptie === undefined || exceptie[0].length <= prefix_cert[0].length ) )
            {
                var prefix = prefix_cert[0];
                var lun_prefix = prefix.length;
                var cratime = prefix_cert[1];

                this.cratime |= cratime;
                this.cratime |= 1 << ( lun_prefix - 1 ); // intre prefix si radacina

                // segmenteaza portiunea de dupa prefix

                var rest = this.cuvint.slice( lun_prefix );

                if( rest.length > 0 )
                {
                    var alt = new Silaba.Impl( rest );

                    if( !alt.IncearcaSufixe() )
                    {
                        alt.IncearcaAnalitic();
                    }

                    this.cratime |= alt.cratime << lun_prefix;
                }

                return true;
            }

            return false;
        }


        impl.prototype.IncearcaSufixe = function ()
        {
            var sufix_cert = this.CautaSufix( this.Dictionar.SC );
            var sufix_incert = this.CautaSufix( this.Dictionar.SI );

            if( sufix_incert !== undefined &&
                ( sufix_cert === undefined || sufix_cert[0].length < sufix_incert[0].length ) )
            {
                var sufix = sufix_incert[0];
                var lun_sufix = sufix.length;
                var lun_radacina = this.lungime - lun_sufix;
                //var cratime = sufix_incert[1]; // neutilizat

                if( this.EConsoana( sufix[0] ) )
                {
                    if( lun_sufix > 1 && this.EConsoana( sufix[1] ) )
                    {
                        // sufix ...|CC...;
                        // REGULA: inhiba cratima in pozitiile 'x': ...|CxCxCxV...

                        var i = lun_radacina;
                        do
                        {
                            this.inhib |= 1 << i++;
                        } while( i < this.lungime && this.EConsoana( this.cuvint[i] ) );

                        // REGULA: inhiba cratima in pozitiile '~': ...VC~C~C~|CC...

                        i = lun_radacina - 1;
                        while( i >= 0 && this.EConsoana( this.cuvint[i] ) )
                        {
                            this.inhib |= 1 << i--;
                        }
                    }
                    else
                    {
                        // sufix ...|CV...
                        // REGULA: inhibare intre consoanele radacinii: ...VC~C~|CV...

                        if( lun_radacina > 1 &&
                            EConsoana( this.cuvint[lunRadacina - 1] ) &&
                            EConsoana( this.cuvint[lunRadacina - 2] ) )
                        {
                            var i = lun_radacina - 1;
                            while( i >= 0 && this.EConsoana( this.cuvint[i] ) )
                            {
                                this.inhib |= 1 << i--;
                            }
                        }
                    }
                }
                else
                {
                    if( this.EConsoana( sufix[1] ) )
                    {
                        // sufix ...|VC...
                        var i = lun_radacina - 1;
                        if( i >= 0 && this.EConsoana( this.cuvint[i] ) )
                        {
                            // sufix ...C|VC...
                            // REGULA: inhiba in pozitiile '~': ...V~C~C~|VC...
                            do
                            {
                                this.inhib |= 1 << i--;
                            } while( i >= 0 && this.EConsoana( this.cuvint[i] ) );

                            if( i >= 0 ) this.inhib |= 1 << i;
                        }
                    }
                }

                this.IncearcaAnalitic();

                return true;
            }

            if( sufix_cert !== undefined &&
                ( sufix_incert === undefined || sufix_incert[0].length < sufix_cert[0].length ) )
            {
                var sufix = sufix_cert[0];
                var lun_sufix = sufix.length;
                var lun_radacina = this.lungime - lun_sefux;
                var cratime = sufix_cert[1];

                if( lun_radacina > 0 )
                {
                    this.cratime |= 1 << lun_radacina - 1; // intre radacina si sufix
                }

                this.cratime |= cratime << lun_radacina;

                var radacina = this.cuvint.slice( 0, lun_radacina );
                var alt = new Silaba.Impl( radacina );

                if( alt.IncearcaAnalitic() )
                {
                    this.cratime |= alt.cratime;
                    this.inhib |= alt.inhib; //?
                }

                return true;
            }

            return false;
        }


        impl.prototype.IncearcaAnalitic = function ()
        {
            var v = this.IncearcaSecventeVocalice();
            var f = this.IncearcaSecventeFonostatistice();
            var c = this.IncearcaSecventeConsonantice();

            return v || f || c;
        }


        impl.prototype.IncearcaSecventeVocalice = function ()
        {
            var aplicat = false;

            for( var i = 0; i < this.lungime - 1; ++i )
            {
                var c0 = this.cuvint[i];
                var c1 = this.cuvint[i + 1];

                if( this.EVocala( c0 ) && this.EVocala( c1 ) )
                {
                    if( !this.EDiftong( c0, c1 ) )
                    {
                        // REGULA: segmenteaze in zona vocalelor care nu constituie diftong: ...V-V...
                        this.cratime |= 1 << i;
                        aplicat = true;
                    }

                    if( i + 2 < this.lungime )
                    {
                        // REGULA: secvente trivocalice V[iu]V,
                        // exceptind 'ciu' si 'giu' (vioa-Ie, aciU-a, biciU-ieste)

                        var c2 = this.cuvint[i + 2];
                        if( ( c1 == 'i' || c1 == 'u' ) &&
                            this.EVocala( c2 ) &&
                            ( i == 0 || ( i >= 1 && this.cuvint[i - 1] != 'c' && this.cuvint[i - 1] != 'g' ) ) )
                        {
                            this.cratime |= 1 << i; // inainte de 'i' si 'u'

                            aplicat = true;
                        }
                    }
                }
            }

            return aplicat;
        }


        impl.prototype.IncearcaSecventeFonostatistice = function ()
        {
            if( this.Dictionar.FS === undefined ) return false;

            var aplicat = false;

            for( var s in this.Dictionar.FS )
            {
                var cratime = this.Dictionar.FS[s];

                for( var p = 0; ; ++p )
                {
                    p = this.cuvint.indexOf( s, p );
                    if( p < 0 ) break;

                    this.cratime |= cratime << p;

                    aplicat = true;
                }
            }

            return aplicat;
        }


        impl.prototype.IncearcaSecventeConsonantice = function ()
        {
            var aplicat = false;

            for( var i = 0; ; )
            {
                // cauta "vocala+consoane+vocala": 'VC+V'

                while( i < this.lungime - 1 && !( this.EVocala( this.cuvint[i] ) && this.EConsoana( this.cuvint[i + 1] ) ) ) ++i;

                var i_prima_consoana = ++i;

                while( i < this.lungime && this.EConsoana( this.cuvint[i] ) ) ++i;

                if( i >= this.lungime ) break;
                if( !this.EVocala( this.cuvint[i] ) ) break;

                var lun_consoane = i - i_prima_consoana;

                switch( lun_consoane )
                {
                    case 1:
                        {
                            // REGULA: ...V-CV...
                            this.cratime |= 1 << i_prima_consoana - 1;
                        }
                        break;
                    case 2:
                        {
                            var c0 = this.cuvint[i_prima_consoana];
                            var c1 = this.cuvint[i_prima_consoana + 1];

                            if( this.EGrup2Cons( c0, c1 ) )
                            {
                                // REGULA: ...V-chV..., ...V-ghV..., ...V-whV..., ...V-ckV...
                                // ori ...V-(bcdfghptv)(lr)V...
                                this.cratime |= 1 << ( i_prima_consoana - 1 );
                            }
                            else
                            {
                                // REGULA: regula generala ...VC-CV...
                                this.cratime |= 1 << i_prima_consoana;
                            }
                        }
                        break;
                    case 3:
                        {
                            var c0 = this.cuvint[i_prima_consoana];
                            var c1 = this.cuvint[i_prima_consoana + 1];
                            var c2 = this.cuvint[i_prima_consoana + 2];

                            if( this.EGrup2ConsDin3( c1, c2 ) || this.EGrup3Cons( c0, c1, c2 ) )
                            {
                                // REGULA: grup special din 3 consoane: ...VCC-CV...
                                this.cratime |= 1 << i_prima_consoana + 1;
                            } else
                            {
                                // REGULA: regula generala: ...VC-CCV...
                                this.cratime |= 1 << i_prima_consoana;
                            }
                        }
                        break;
                    case 4:
                        {
                            var c0 = this.cuvint[i_prima_consoana];
                            var c1 = this.cuvint[i_prima_consoana + 1];
                            var c2 = this.cuvint[i_prima_consoana + 2];
                            var c3 = this.cuvint[i_prima_consoana + 3];

                            if( this.EGrup3ConsDin4( c1, c2, c3 ) || this.EGrup4Cons( c0, c1, c2, c3 ) )
                            {
                                // REGULA: grup special din 4 consoane: ...VCC-CCV...
                                this.cratime |= 1 << ( i_prima_consoana + 1 );
                            }
                            else
                            {
                                // REGULA: regula generala: ...VC-CCCV...
                                this.cratime |= 1 << i_prima_consoana;
                            }
                        }
                        break;
                    case 5:
                        {
                            var c0 = this.cuvint[i_prima_consoana];
                            var c1 = this.cuvint[i_prima_consoana + 1];
                            var c2 = this.cuvint[i_prima_consoana + 2];
                            var c3 = this.cuvint[i_prima_consoana + 3];
                            var c4 = this.cuvint[i_prima_consoana + 4];

                            if( this.EGrup5Cons( c0, c1, c2, c3, c4 ) )
                            {
                                // REGULA: grup special din 5 consoane: ...VCC-CCCV...
                                this.cratime |= 1 << ( i_prima_consoana + 1 );
                            } else
                            {
                                // REGULA: regula generala: ...VC-CCCCV...
                                this.cratime |= 1 << i_prima_consoana;
                            }
                        }
                        break;
                    default:
                        {
                            // REGULA: regula generala: ...VC-CCCCV...
                            this.cratime |= 1 << i_prima_consoana;
                        }
                        break;
                }

                aplicat = true;

                i = i_prima_consoana + lun_consoane;
            }

            return aplicat;
        }


        impl.prototype.Corecteaza = function ()
        {
            this.Corecteaza_CI_Final();
            this.Corecteaza_C_Orfane();
            this.Corecteaza_Romane();
        }


        impl.prototype.Corecteaza_CI_Final = function ()
        {
            // REGULA: nu se separa consoana + i final (pentru evitarea
            // segmentarilor eronate de tip 'po-mi'); exceptie: secventele ...-ki
            // sau ...-schi

            if( this.lungime < 3 ) return;

            var ultima_litera = this.cuvint.slice( -1 );
            if( ultima_litera != 'i' ) return;

            var penultima_litera = this.cuvint.slice( -2 );
            if( !this.EConsoana( penultima_litera ) ) return;

            if( penultima_litera == 'k' ) return;

            if( this.lungime > 4 &&
                this.cuvint.slice( -4 ) == 's' &&
                this.cuvint.slice( -3 ) == 'c' &&
                this.cuvint.slice( -2 ) == 'h' ) return;

            var i = this.lungime - 1;
            do
            {
                this.inhib |= 1 << --i;
            } while( i > 0 && this.EConsoana( this.cuvint[i] ) );
        }


        impl.prototype.Corecteaza_C_Orfane = function ()
        {
            // REGULA: nu se lasa si nu se trece un grup de consoane;
            // (pentru a evita segmentarile eronate in cazul prefixelor
            // certe, daca nu se definesc toate exceptiile; ex.: "contra-r")

            var i = 0;
            while( i < this.lungime && this.EConsoana( this.cuvint[i] ) )
            {
                this.inhib |= 1 << i++;
            }

            i = this.lungime - 2;
            while( i >= 0 && this.EConsoana( this.cuvint[i + 1] ) )
            {
                this.inhib |= 1 << i--;
            }
        }


        impl.prototype.Corecteaza_Romane = function ()
        {
            // REGULA: daca se termina cu "III", si contine numai
            // 'V', 'X', 'L', 'C', 'D' sau 'M', atunci pare
            // a fi numar roman si se interzice segmentarea lui;
            // (secventa 'II' nu apare in interiorul numerelor romane)

            if( this.lungime < 3 ) return;

            var i = this.lungime;
            --i;
            if( this.cuvint[i] != 'i' ) return;
            --i;
            if( this.cuvint[i] != 'i' ) return;
            --i;
            if( this.cuvint[i] != 'i' ) return;

            if( i != 0 )
            {
                for( ; ; )
                {
                    --i;

                    var c = this.cuvint[i];

                    if( /*c != 'i' &&*/
                        c != 'v' &&
                        c != 'x' &&
                        c != 'l' &&
                        c != 'c' &&
                        c != 'd' &&
                        c != 'm' ) return;

                    if( i == 0 ) break;
                }
            }

            this.inhib = ~0;
        }


        impl.prototype.CautaPrefix = function ( dic )
        {
            if( dic === undefined ) return undefined;

            var element_gasit = undefined;
            var cratime_gasite = 0;
            var lun_element_gasit = -1;

            for( element in dic )
            {
                if( element.length > this.lungime ) continue;

                if( this.cuvint.slice( 0, element.length ) == element )
                {
                    if( lun_element_gasit < element.length )
                    {
                        lun_element_gasit = element.length;
                        element_gasit = element;
                        cratime_gasite = dic[element];
                    }
                }
            }

            return element_gasit === undefined ? undefined : [element_gasit, cratime_gasite];
        }


        impl.prototype.CautaSufix = function ( dic )
        {
            if( dic === undefined ) return undefined;

            var element_gasit = undefined;
            var cratime_gasite = 0;
            var lun_element_gasit = -1;

            for( element in dic )
            {
                if( element.length > this.lungime ) continue;

                if( this.cuvint.slice( -element.length ) == element )
                {
                    if( lun_element_gasit < element.length )
                    {
                        lun_element_gasit = element.length;
                        element_gasit = element;
                        cratime_gasite = dic[element];
                    }
                }
            }

            return element_gasit === undefined ? undefined : [element_gasit, cratime_gasite];
        }


        impl.prototype.EVocala = function ( litera )
        {
            return litera == 'a' ||
                litera == 'ă' ||
                litera == 'â' ||
                litera == 'î' ||
                litera == 'e' ||
                litera == 'i' ||
                litera == 'o' ||
                litera == 'u' ||
                litera == 'y';
        }


        impl.prototype.EConsoana = function ( litera )
        {
            return !this.EVocala( litera ); // (varianta rapida)
        }


        impl.prototype.EDiftong = function ( c1, c2 )
        {
            return ( c1 == 'i' && c2 == 'a' ) ||
                ( c1 == 'i' && c2 == 'e' ) ||
                ( c1 == 'i' && c2 == 'o' ) ||
                ( c1 == 'i' && c2 == 'u' ) ||
                ( c1 == 'e' && c2 == 'a' ) ||
                ( c1 == 'e' && c2 == 'o' ) ||
                ( c1 == 'u' && c2 == 'a' ) ||
                ( c1 == 'u' && c2 == 'ă' ) ||
                ( c1 == 'o' && c2 == 'a' ) ||
                ( c1 == 'u' && c2 == 'î' ) ||
                ( c1 == 'a' && c2 == 'i' ) ||
                ( c1 == 'a' && c2 == 'u' ) ||
                ( c1 == 'ă' && c2 == 'i' ) ||
                ( c1 == 'î' && c2 == 'i' ) ||
                ( c1 == 'î' && c2 == 'u' ) ||
                ( c1 == 'e' && c2 == 'u' ) ||
                ( c1 == 'e' && c2 == 'i' ) ||
                ( c1 == 'i' && c2 == 'i' ) ||
                ( c1 == 'o' && c2 == 'i' ) ||
                ( c1 == 'o' && c2 == 'u' ) ||
                ( c1 == 'u' && c2 == 'i' );
            // diftongul 'uu' este exclus, deoarece normele permit segmentarea lui
        }


        impl.prototype.EGrup2Cons = function ( c0, c1 )
        {
            return ( c1 == 'h' && ( c0 == 'c' || c0 == 'g' || c0 == 'w' ) ) ||
                ( c0 == 'c' && c1 == 'k' ) ||
                ( ( c1 == 'l' || c1 == 'r' ) &&
                    ( c0 == 'b' || c0 == 'c' || c0 == 'd' ||
                        c0 == 'f' || c0 == 'g' || c0 == 'h' ||
                        c0 == 'p' || c0 == 't' || c0 == 'v' ) );
        }


        impl.prototype.EGrup2ConsDin3 = function ( c0, c1 )
        {
            return ( c0 == 'c' && c1 == 's' ) ||
                ( c0 == 'c' && c1 == 't' ) ||
                ( c0 == 'c' && c1 == 'ț' ) ||
                ( c0 == 'd' && c1 == 'v' ) ||
                ( c0 == 'p' && c1 == 't' ) ||
                ( c0 == 'p' && c1 == 'ț' ) ||
                ( c0 == 't' && c1 == 'f' ) ||
                ( c0 == 't' && c1 == 'm' );
        }


        impl.prototype.EGrup3Cons = function ( c0, c1, c2 )
        {
            return ( c0 == 'l' && c1 == 'd' && c2 == 'm' ) ||
                ( c0 == 'l' && c1 == 'p' && c2 == 'n' ) ||
                ( c0 == 'l' && c1 == 't' && c2 == 'c' ) ||
                ( c0 == 'n' && c1 == 'd' && c2 == 'c' ) ||
                ( c0 == 'n' && c1 == 's' && c2 == 'l' ) ||
                ( c0 == 'n' && c1 == 's' && c2 == 'r' ) ||
                ( c0 == 'n' && c1 == 's' && c2 == 'v' ) ||
                ( c0 == 'n' && c1 == 't' && c2 == 'l' ) ||
                ( c0 == 'r' && c1 == 'b' && c2 == 'ț' ) ||
                ( c0 == 'r' && c1 == 'g' && c2 == 'ș' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 'b' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 'c' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 'h' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 'j' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 'm' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 'p' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 's' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 't' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 'v' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'b' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'c' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'd' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'f' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'l' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'n' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'p' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 's' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 't' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'v' );
        }


        impl.prototype.EGrup3ConsDin4 = function ( c0, c1, c2 )
        {
            return ( c0 == 'g' && c1 == 's' && c2 == 't' ) ||
                ( c0 == 'n' && c1 == 'b' && c2 == 'l' );
        }


        impl.prototype.EGrup4Cons = function ( c0, c1, c2, c3 )
        {
            return ( c0 == 'b' && c1 == 's' && c2 == 't' && c3 == 'r' ) ||
                ( c0 == 'n' && c1 == 's' && c2 == 'g' && c3 == 'r' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 'd' && c3 == 'r' ) ||
                ( c0 == 'r' && c1 == 't' && c2 == 's' && c3 == 'c' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'p' && c3 == 'r' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 's' && c3 == 'c' ) ||
                ( c0 == 's' && c1 == 't' && c2 == 'ș' && c3 == 'c' );
        }


        impl.prototype.EGrup5Cons = function ( c0, c1, c2, c3, c4 )
        {
            return c0 == 'n' && c1 == 'g' && c2 == 's' && c3 == 't' && c4 == 'r';
        }


        impl.prototype.UltimaCratima = function ( cratime )
        {
            var i = -1;
            var k = 0;
            var m = 1;
            do
            {
                if( cratime & m ) i = k;
                ++k;
                m <<= 1;
            } while( m != 0 );

            return i;
        }



        impl.prototype.CuvintCuCratime = function ()
        {
            var r = "";
            var cratime = this.cratime & ~this.inhib;

            for( var i = 0, m = 1; i < this.lungime; ++i, m <<= 1 )
            {
                r += this.cuvintOriginal[i];

                if( ( cratime & m ) && i < this.lungime - 1 ) r += "-";
            }

            return r;
        }

        //
        Silaba.Impl = impl;
    }
)();

