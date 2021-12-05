﻿'use strict';

const Silaba = ( function ()
{
    let Impl = function ( cuvint, optiuni )
    {
        this.cuvintOriginal = cuvint;
        this.optiuni = optiuni;
        if( this.optiuni === undefined )
        {
            this.optiuni = {};
        }

        this.accente = [];
        const This = this;

        // cuvint ajustat
        this.cuvint = cuvint.toLowerCase()
            .replace( /[\u0300\u0301]/g, function ( c, offset ) { This.accente.push( offset ); return ""; } )
            .replace( /[^a-z]/g, function ( c ) { return Impl.Echivalente[c] || c } );

        this.lungime = cuvint.length;

        this.cratime = 0;
        this.inhib = 0;

        this.e_sufix_cert = false;
    };


    Impl.RegexSpl = /([\p{L}\u0300\u0301]+)|(\P{L}+)/ug;
    Impl.Echivalente =
    {
        //
        "á": "a",
        "ắ": "ă",
        "ấ": "î",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        //
        "ǻ": "å",
        "ǘ": "ü",
        //
        "â": "î",
        "ş": "ș",
        "ţ": "ț"
    };


    Impl.prototype.Desparte = function ()
    {
        if( this.lungime === 0 ) return 0;

        let aplicat = this.IncearcaCuvinteFixe();

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
                aplicat = this.IncearcaAnalitic();
            }

            this.Corecteaza();
        }

        return aplicat;
    }


    Impl.prototype.IncearcaCuvinteFixe = function ()
    {
        if( Impl.Dictionar.CF === undefined ) return;

        let cratime = Impl.Dictionar.CF[this.cuvint];

        if( cratime === undefined ) return false;

        this.cratime |= cratime;

        return true;
    }


    Impl.prototype.IncearcaPrefixe = function ()
    {
        let prefix_cert = this.CautaPrefix( Impl.Date.PC );
        let prefix_incert = this.CautaPrefix( Impl.Date.PI );
        let exceptie = this.CautaPrefix( Impl.Date.CE );

        /*
        // TODO: A se sterge

        {
            const n = ( prefix_cert === undefined ? 0 : 1 ) +
                ( prefix_incert === undefined ? 0 : 1 ) +
                ( exceptie === undefined ? 0 : 1 );

            console.assert( n === 0 || n === 1 );

            let start_time = performance.now();
            for( let i = 0; i < 1000; ++i )
            {
                let prefix_cert2 = this.CautaPrefix( Impl.Date.PC );
                let prefix_incert2 = this.CautaPrefix( Impl.Date.PI );
                let exceptie2 = this.CautaPrefix( Impl.Date.CE );
            }
            let end_time = performance.now()
            console.log( `   ${end_time - start_time} ms` )
        }
        */


        if( prefix_incert !== undefined &&
            ( prefix_cert === undefined || prefix_cert[0].length <= prefix_incert[0].length ) &&
            ( exceptie === undefined || exceptie[0].length <= prefix_incert[0].length ) )
        {
            let prefix = prefix_incert[0];
            let lun_prefix = prefix.length;
            //let cratime = prefix_incert[1]; // neutilizat

            /*
            // inhiba cratimele in pozitiile (V)~C~C~C~(V) de la sfirsitul prefixului
            // si partea de dupa prefix

            let i = lun_prefix;
            while( --i >= 0 && !this.EConsoana( this.cuvint[i] ) );
            while( i >= 0 )
            {
                this.inhib |= 1 << i;
                if( !this.EConsoana( this.cuvint[i--] ) ) break;
            }

            i = lun_prefix;
            while( i < this.lungime && !this.EConsoana( this.cuvint[i] ) ) ++i;
            --i;
            do
            {
                this.inhib |= 1 << i;
            } while( ++i < this.lungime && this.EConsoana( this.cuvint[i] ) );

            */

            let ultima_litera = prefix.slice( -1 );

            if( this.EVocala( ultima_litera ) )
            {
                // prefix incert terminat in vocala;
                // REGULA: inhiba cratime in pozitiile '~': ...V|C~C~CV... //...........

                let i = lun_prefix;

                while( i < this.lungime && this.EConsoana( this.cuvint[i] ) )
                {
                    this.inhib |= 1 << i++;
                }

                // REGULA: inhiba cratime in pozitiile '~': ...V~C~C~CV|...

                i = lun_prefix;
                while( --i >= 0 && !this.EConsoana( this.cuvint[i] ) );
                while( i >= 0 )
                {
                    this.inhib |= 1 << i;
                    if( !this.EConsoana( this.cuvint[i--] ) ) break;
                }
            }
            else
            {
                // prefix incert terminat in consoana;
                // REGULA: inhiba cratime in pozitiile '~': ...V~C~C~C~|...

                let i = lun_prefix;//.............. - 1;
                while( --i >= 0 )
                {
                    this.inhib |= 1 << i;
                    if( this.EVocala( this.cuvint[i] ) ) break;
                }

                // REGULA: inhiba cratime in pozitiile '~': ...C|C~C~C~V...

                for( let i = lun_prefix; i < this.lungime && this.EConsoana( this.cuvint[i] ); ++i )
                {
                    this.inhib |= 1 << i;
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
            let cratime = exceptie[1];

            this.cratime |= cratime;

            // segmenteaza portiunea de dupa ultima cratima

            let ultima_cratima = this.UltimaCratima( cratime );
            let coada = this.cuvint.slice( ultima_cratima + 1 );
            let alt = new Impl( coada, this.optiuni );

            if( !alt.IncearcaSufixe() )
            {
                alt.IncearcaAnalitic();
            }

            this.cratime |= alt.cratime << ( ultima_cratima + 1 );

            return true;
        }

        if( prefix_cert !== undefined &&
            ( prefix_incert === undefined || prefix_incert[0].length <= prefix_cert[0].length ) &&
            ( exceptie === undefined || exceptie[0].length <= prefix_cert[0].length ) )
        {
            let prefix = prefix_cert[0];
            let lun_prefix = prefix.length;
            let cratime = prefix_cert[1];

            this.cratime |= cratime;
            this.cratime |= 1 << ( lun_prefix - 1 ); // intre prefix si radacina

            // segmenteaza portiunea de dupa prefix

            let rest = this.cuvint.slice( lun_prefix );

            if( rest.length > 0 )
            {
                let alt = new Impl( rest, this.optiuni );

                if( this.optiuni.PrefixeMultiple === true ) // (experimental)
                {
                    if( alt.Desparte() )
                    {
                        this.cratime |= alt.cratime << lun_prefix;
                        this.inhib |= alt.inhib << lun_prefix;
                    }
                }
                else
                {
                    if( !alt.IncearcaSufixe() )
                    {
                        alt.IncearcaAnalitic();
                    }

                    this.cratime |= alt.cratime << lun_prefix;
                }
            }

            return true;
        }

        return false;
    }


    Impl.prototype.IncearcaSufixe = function ()
    {
        let sufix_cert = this.CautaSufix( Impl.Date.SC );
        let sufix_incert = this.CautaSufix( Impl.Date.SI );

        /*
        // TODO: A se sterge

        {
            const n = ( sufix_cert === undefined ? 0 : 1 ) +
                ( sufix_incert === undefined ? 0 : 1 );

            console.assert( n === 0 || n === 1 );
        }
        */

        if( sufix_incert !== undefined &&
            ( sufix_cert === undefined || sufix_cert[0].length < sufix_incert[0].length ) )
        {
            let sufix = sufix_incert[0];
            let lun_sufix = sufix.length;
            let lun_radacina = this.lungime - lun_sufix;
            //let cratime = sufix_incert[1]; // neutilizat

            if( this.EConsoana( sufix[0] ) )
            {
                if( lun_sufix > 1 && this.EConsoana( sufix[1] ) )
                {
                    // sufix ...|CC...;
                    // REGULA: inhiba cratime in pozitiile '~': ...|C~C~C~V...

                    let i = lun_radacina;
                    do
                    {
                        this.inhib |= 1 << i++;
                    } while( i < this.lungime && this.EConsoana( this.cuvint[i] ) );

                    // REGULA: inhiba cratime in pozitiile '~': ...VC~C~C~|CC...

                    i = lun_radacina - 1;
                    while( i >= 0 && this.EConsoana( this.cuvint[i] ) )
                    {
                        this.inhib |= 1 << i--;
                    }
                }
                else
                {
                    // sufix ...|CV...
                    // REGULA: inhiba cratime in pozitiile '~': ...VC~C~|CV...

                    if( lun_radacina > 1 &&
                        EConsoana( this.cuvint[lunRadacina - 1] ) &&
                        EConsoana( this.cuvint[lunRadacina - 2] ) )
                    {
                        let i = lun_radacina - 1;
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
                    let i = lun_radacina - 1;
                    if( i >= 0 && this.EConsoana( this.cuvint[i] ) )
                    {
                        // sufix ...C|VC...
                        // REGULA: inhiba cratime in pozitiile '~': ...V~C~C~|VC...
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
            let sufix = sufix_cert[0];
            let lun_sufix = sufix.length;
            let lun_radacina = this.lungime - lun_sufix;
            let cratime = sufix_cert[1];

            if( lun_radacina > 0 )
            {
                this.cratime |= 1 << lun_radacina - 1; // intre radacina si sufix
            }

            this.cratime |= cratime << lun_radacina;
            this.e_sufix_cert = true;

            let radacina = this.cuvint.slice( 0, lun_radacina );
            let alt = new Impl( radacina, this.optiuni );

            if( alt.IncearcaAnalitic() )
            {
                this.cratime |= alt.cratime;
                this.inhib |= alt.inhib; //?
            }

            return true;
        }

        return false;
    }


    Impl.prototype.IncearcaAnalitic = function ()
    {
        let v = this.IncearcaSecventeVocalice();
        let f = this.IncearcaSecventeFonostatistice();
        let c = this.IncearcaSecventeConsonantice();

        return v || f || c;
    }


    Impl.prototype.IncearcaSecventeVocalice = function ()
    {
        let aplicat = false;

        for( let i = 0; i < this.lungime - 1; ++i )
        {
            let c0 = this.cuvint[i];
            let c1 = this.cuvint[i + 1];

            if( this.EVocala( c0 ) && this.EVocala( c1 ) )
            {
                if( !this.EDiftong( c0, c1, i === this.lungime - 2 ) )
                {
                    // REGULA: segmenteaze in zona vocalelor care nu constituie diftong: ...V-V...
                    this.cratime |= 1 << i;

                    aplicat = true;
                }

                if( i + 2 < this.lungime )
                {
                    // REGULA: secvente trivocalice V-iV sau V-uV ("cA-iEt", "vioA-iE"),
                    // exceptind 'ciu' si 'giu' ("aciua", "biciuieste")

                    if( ( c1 === 'i' || c1 === 'u' ) && this.EVocala( this.cuvint[i + 2] ) )
                    {
                        if( !( c0 === 'i' && c1 === 'u' && i > 0 && ( this.cuvint[i - 1] === 'c' || this.cuvint[i - 1] === 'g' ) ) )
                        {
                            this.cratime |= 1 << i; // inainte de 'i' sau 'u'

                            aplicat = true;
                        }
                    }
                }
            }
        }

        return aplicat;
    }


    Impl.prototype.IncearcaSecventeFonostatistice = function ()
    {
        if( Impl.Dictionar.FS === undefined ) return false;

        let aplicat = false;

        for( let s in Impl.Dictionar.FS )
        {
            let cratime = Impl.Dictionar.FS[s];

            for( let p = 0; ; ++p )
            {
                p = this.cuvint.indexOf( s, p );
                if( p < 0 ) break;

                this.cratime |= cratime << p;

                aplicat = true;
            }
        }

        return aplicat;
    }


    Impl.prototype.IncearcaSecventeConsonantice = function ()
    {
        let aplicat = false;

        for( let i = 0; ; )
        {
            // cauta "vocala+consoane+vocala": 'VC+V'

            while( i < this.lungime - 1 && !( this.EVocala( this.cuvint[i] ) && this.EConsoana( this.cuvint[i + 1] ) ) ) ++i;

            let i_prima_consoana = ++i;

            while( i < this.lungime && this.EConsoana( this.cuvint[i] ) ) ++i;

            if( i >= this.lungime ) break;
            if( !this.EVocala( this.cuvint[i] ) ) break;

            let lun_consoane = i - i_prima_consoana;

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
                        let c0 = this.cuvint[i_prima_consoana];
                        let c1 = this.cuvint[i_prima_consoana + 1];

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
                        let c0 = this.cuvint[i_prima_consoana];
                        let c1 = this.cuvint[i_prima_consoana + 1];
                        let c2 = this.cuvint[i_prima_consoana + 2];

                        if( this.EGrup3Cons( c0, c1, c2 ) )
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
                        let c0 = this.cuvint[i_prima_consoana];
                        let c1 = this.cuvint[i_prima_consoana + 1];
                        let c2 = this.cuvint[i_prima_consoana + 2];
                        let c3 = this.cuvint[i_prima_consoana + 3];

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
                        let c0 = this.cuvint[i_prima_consoana];
                        let c1 = this.cuvint[i_prima_consoana + 1];
                        let c2 = this.cuvint[i_prima_consoana + 2];
                        let c3 = this.cuvint[i_prima_consoana + 3];
                        let c4 = this.cuvint[i_prima_consoana + 4];

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


    Impl.prototype.Corecteaza = function ()
    {
        if( !this.e_sufix_cert ) this.Corecteaza_CI_Final();
        this.Corecteaza_C_Orfane();
        this.Corecteaza_Romane();
        if( this.optiuni.EvitaSilabeNeeconomice ) this.Corecteaza_Silabe_Neeconomice();
        if( this.optiuni.EvitaSecventeNeelegante ) this.Corecteaza_Secvente_Neelegante();
    }


    Impl.prototype.Corecteaza_CI_Final = function ()
    {
        // REGULA: nu se separa consoana + i final (pentru evitarea
        // segmentarilor eronate de tip 'po-mi'); exceptie: secventele '-ki' si '-schi'

        if( this.lungime < 3 ) return;

        let ultima_litera = this.cuvint.slice( -1 );
        if( ultima_litera !== 'i' ) return;

        let penultima_litera = this.cuvint.slice( -2, -1 );
        if( !this.EConsoana( penultima_litera ) ) return;

        if( penultima_litera === 'k' ) return;

        if( this.lungime > 4 && this.cuvint.slice( -4, -4 + 3 ) === 'sch' ) return;

        let i = this.lungime - 1;
        do
        {
            this.inhib |= 1 << --i;
        } while( i > 0 && this.EConsoana( this.cuvint[i] ) );
    }


    Impl.prototype.Corecteaza_C_Orfane = function ()
    {
        // REGULA: nu se lasa si nu se trece un grup de consoane;
        // (pentru a evita segmentarile eronate in cazul prefixelor
        // certe, daca nu se definesc toate exceptiile; ex.: "contra-r")

        let i = 0;
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


    Impl.prototype.Corecteaza_Romane = function ()
    {
        // REGULA: daca se termina cu "III", si contine numai
        // 'V', 'X', 'L', 'C', 'D' sau 'M', atunci poate
        // fi numar roman si se interzice segmentarea lui;
        // (secventa 'II' nu apare in interiorul numerelor romane)

        if( this.lungime < 3 ) return;

        let i = this.lungime;
        --i;
        if( this.cuvint[i] !== 'i' ) return;
        --i;
        if( this.cuvint[i] !== 'i' ) return;
        --i;
        if( this.cuvint[i] !== 'i' ) return;

        if( i !== 0 )
        {
            for( ; ; )
            {
                --i;

                let c = this.cuvint[i];

                if( /*c !== 'i' &&*/
                    c !== 'v' &&
                    c !== 'x' &&
                    c !== 'l' &&
                    c !== 'c' &&
                    c !== 'd' &&
                    c !== 'm' ) return;

                if( i === 0 ) break;
            }
        }

        this.inhib = ~0;
    }


    Impl.prototype.Corecteaza_Silabe_Neeconomice = function ()
    {
        // REGULA: nu se lasă silabele inițiale și nu se trec silabele finale formate dintr-o singură literă (vocală); este neeconomic

        this.inhib |= 1;
        if( this.lungime >= 2 ) this.inhib |= 1 << ( this.lungime - 2 );
    }


    Impl.prototype.Corecteaza_Secvente_Neelegante = function ()
    {
        if( Impl.Dictionar.NE === undefined ) return;

        for( let i = 0; i < Impl.Dictionar.NE.length; ++i )
        {
            let secv = Impl.Dictionar.NE[i];
            if( this.cuvint.startsWith( secv ) )
            {
                this.inhib |= 1 << ( secv.length - 1 );
            }
            if( this.cuvint.endsWith( secv ) )
            {
                this.inhib |= 1 << ( this.lungime - secv.length - 1 );
            }
        }
    }


    Impl.prototype.CautaPrefix = function ( date )
    {
        if( date === undefined ) return undefined;

        for( let l = date.LMax; l >= date.LMin; --l )
        {
            let parte = this.cuvint.slice( 0, l );
            let cratime = date.D[parte];

            if( cratime !== undefined )
            {
                return [parte, cratime];
            }
        }

        return undefined;
    }


    Impl.prototype.CautaSufix = function ( date )
    {
        if( date === undefined ) return undefined;

        for( let l = date.LMax; l >= date.LMin; --l )
        {
            let parte = this.cuvint.slice( -l );
            let cratime = date.D[parte];

            if( cratime !== undefined )
            {
                return [parte, cratime];
            }
        }

        return undefined;
    }


    Impl.prototype.EVocala = function ( litera )
    {
        return (
            litera === 'a' ||
            litera === 'ă' ||
            litera === 'â' || // (de fapt, 'â' a fost convertit în 'î')
            litera === 'î' ||
            litera === 'e' ||
            litera === 'i' ||
            litera === 'o' ||
            litera === 'u' ||
            litera === 'y' ||
            litera === 'å' ||
            litera === 'ö' ||
            litera === 'ü' ||
            litera === 'è' ||
            litera === 'ä' ||
            litera === 'à'
        );
    }


    Impl.prototype.EConsoana = function ( litera )
    {
        return !this.EVocala( litera ); // (varianta rapida)
    }


    Impl.prototype.EDiftong = function ( c1, c2, sfirsit )
    {
        return (
            ( c1 === 'i' && c2 === 'a' ) ||
            ( c1 === 'i' && c2 === 'e' ) ||
            ( c1 === 'i' && c2 === 'o' ) ||
            ( c1 === 'i' && c2 === 'u' ) ||
            ( c1 === 'e' && c2 === 'a' ) ||
            ( c1 === 'e' && c2 === 'o' ) ||
            ( c1 === 'u' && c2 === 'a' ) ||
            ( c1 === 'u' && c2 === 'ă' ) ||
            ( c1 === 'o' && c2 === 'a' ) ||
            ( c1 === 'u' && c2 === 'î' ) ||
            ( c1 === 'a' && c2 === 'i' ) ||
            ( c1 === 'a' && c2 === 'u' ) ||
            ( c1 === 'ă' && c2 === 'i' ) ||
            ( c1 === 'ă' && c2 === 'u' && sfirsit ) ||
            ( c1 === 'î' && c2 === 'i' ) ||
            ( c1 === 'î' && c2 === 'u' && sfirsit ) ||
            ( c1 === 'e' && c2 === 'u' ) ||
            ( c1 === 'e' && c2 === 'i' ) ||
            ( c1 === 'i' && c2 === 'i' ) ||
            ( c1 === 'o' && c2 === 'i' ) ||
            ( c1 === 'o' && c2 === 'u' && sfirsit ) ||
            ( c1 === 'u' && c2 === 'i' ) ||

            ( c1 === 'a' && c2 === 'y' ) ||
            ( c1 === 'o' && c2 === 'y' ) ||
            ( c1 === 'e' && c2 === 'y' ) ||
            ( c1 === 'y' && c2 === 'a' ) ||
            ( c1 === 'y' && c2 === 'e' ) ||
            ( c1 === 'y' && c2 === 'o' )
            // diftongul 'uu' este exclus, deoarece normele permit segmentarea lui
        );
    }


    Impl.prototype.EGrup2Cons = function ( c0, c1 )
    {
        return (
            ( ( c0 === 'b' || c0 === 'c' || c0 === 'd' ||
                c0 === 'f' || c0 === 'g' || c0 === 'h' ||
                c0 === 'p' || c0 === 't' || c0 === 'v' ) && ( c1 === 'l' || c1 === 'r' ) ) ||
            ( c0 === 'c' && c1 === 'k' ) ||
            ( ( c0 === 'c' || c0 === 'g' || c0 === 'w' ) && c1 === 'h' )
        );
    }


    Impl.prototype.EGrup3Cons = function ( c0, c1, c2 )
    {
        return (
            ( c0 === 'l' && c1 === 'd' && c2 === 'm' ) ||
            ( c0 === 'l' && c1 === 'p' && c2 === 'n' ) ||
            ( c0 === 'l' && c1 === 'p' && c2 === 't' ) ||
            ( c0 === 'l' && c1 === 't' && c2 === 'c' ) || // (DOOM2 indică doar "ltč")
            ( c0 === 'm' && c1 === 'p' && c2 === 't' ) ||
            ( c0 === 'm' && c1 === 'p' && c2 === 'ț' ) ||
            ( c0 === 'n' && c1 === 'c' && c2 === 't' ) || // (una din excepții: "punctaveraj")
            ( c0 === 'n' && c1 === 'c' && c2 === 'ț' ) ||
            ( c0 === 'n' && c1 === 'c' && c2 === 'ș' ) || // ("linx -- lincșii")
            ( c0 === 'n' && c1 === 'd' && c2 === 'b' ) ||
            ( c0 === 'n' && c1 === 'd' && c2 === 'c' ) ||
            ( c0 === 'n' && c1 === 'd' && c2 === 'v' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'b' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'd' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'h' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'l' ) || // ("trans-lata", dar: "pan-slav")
            ( c0 === 'n' && c1 === 's' && c2 === 'm' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'n' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 's' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'r' ) || // (nu e în DOOM2, care nici nu include astfel de cuvinte)
            ( c0 === 'n' && c1 === 's' && c2 === 'v' ) ||
            ( c0 === 'n' && c1 === 't' && c2 === 'l' ) ||
            ( c0 === 'r' && c1 === 'b' && c2 === 'ț' ) || // (nu e în DOOM2)
            ( c0 === 'r' && c1 === 'c' && c2 === 't' ) ||
            ( c0 === 'r' && c1 === 'g' && c2 === 'ș' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'b' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'c' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'f' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'h' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'j' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'm' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'p' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 's' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 't' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'ț' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'v' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'b' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'c' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'd' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'f' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'g' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'l' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'm' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'n' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'p' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 's' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 't' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'v' )
        );

        // Altele din DOOM2, problematice:
        // nsc
        // nsf
        // nsp
        // str
    }


    Impl.prototype.EGrup3ConsDin4 = function ( c1, c2, c3 )
    {
        return (
            ( c1 === 'g' && c2 === 's' && c3 === 't' ) ||
            ( c1 === 'n' && c2 === 'b' && c3 === 'l' )
        );
    }


    Impl.prototype.EGrup4Cons = function ( c0, c1, c2, c3 )
    {
        // Anulat de DOOM2: c0 === 'b' && c1 === 's' && c2 === 't' && c3 === 'r'
        // Ex.: "abstract", "obstrucție"

        return (
            ( c0 === 'n' && c1 === 's' && c2 === 'g' && c3 === 'r' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'd' && c3 === 'r' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 's' && c3 === 'c' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'p' && c3 === 'r' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 's' && c3 === 'c' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'ș' && c3 === 'c' ) ||
            // noi, din DOOM2
            ( c0 === 'n' && c1 === 's' && c2 === 'f' && c3 === 'r' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'p' && c3 === 'l' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'c' && c3 === 'h' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 's' && c3 === 't' ) ||
            ( c0 === 'l' && c1 === 'd' && c2 === 's' && c3 === 'p' )
            //( c0 === 'n' && c1 === 'g' && c2 === 's' && c3 === 't' ) // (vezi 'EGrup3ConsDin4')
        );
    }


    Impl.prototype.EGrup5Cons = function ( c0, c1, c2, c3, c4 )
    {
        return (
            ( c0 === 'p' && c1 === 't' && c2 === 's' && c3 === 'p' && c4 === 'r' ) ||
            ( c0 === 'n' && c1 === 'g' && c2 === 's' && c3 === 't' && c4 === 'r' )
        );
    }


    Impl.prototype.UltimaCratima = function ( cratime )
    {
        let i = -1;
        let k = 0;
        let m = 1;
        do
        {
            if( cratime & m ) i = k;
            ++k;
            m <<= 1;
        } while( m !== 0 );

        return i;
    }


    Impl.prototype.CuvintCuCratime = function ()
    {
        let r = "";
        let cratime = this.cratime & ~this.inhib;

        for( let i = 0; i < this.accente.length; ++i )
        {
            let k = this.accente[i] - 1;
            if( k < 0 ) continue;
            let m = ~0 << k; // ...11100...

            cratime = ( ( cratime & m ) << 1 ) | ( cratime & ~m );
        }

        for( let i = 0, m = 1; i < this.lungime; ++i, m <<= 1 )
        {
            r += this.cuvintOriginal[i];

            if( ( cratime & m ) && i < this.lungime - 1 ) r += "-";
        }

        return r;
    }


    Impl.Dictionar =
{"PC":{"abio":5,"adeno":5,"aero":3,"aerogeo":43,"agro":1,"agrobio":41,"agrogeo":41,"agrometeo":169,"ante":2,"anti":2,"antropo":0,"arhi":2,"astro":2,"audio":11,"audiovideo":347,"auto":3,"biblio":18,"bio":2,"business":10,"cardio":20,"chimio":20,"c\u00EEte\u0219i":2,"electro":9,"extra":2,"fizio":10,"foto":2,"galvano":20,"geo":2,"hemi":2,"hetero":10,"hiper":2,"hipo":2,"histo":4,"homeo":10,"homo":2,"infra":2,"kilo":2,"landsknecht":16,"macro":2,"magneto":20,"mc":0,"mega":2,"meta":2,"micro":2,"mili":2,"mono":2,"nemai":2,"neuro":6,"nici":0,"ohmamper":20,"ori\u0219i":4,"poli":2,"proto":4,"pseudo":12,"psicro":8,"psiho":4,"psihro":8,"radio":10,"retro":2,"semi":2,"silvo":4,"sincro":4,"socio":10,"spectro":8,"stereo":20,"steto":4,"super":2,"supra":2,"tele":2,"termo":4,"trans":0,"ultra":2,"uni":1,"vice":2,"voltamper":40,"voltohm":8,"watt":0,"west":0,"zoo":2},"PI":{"acet":0,"aceti":0,"aceto":0,"aceton":0,"bi":0,"contra":0,"de":0,"des":0,"dez":0,"ex":0,"hidro":0,"hister":0,"histero":0,"in":0,"inter":0,"intra":0,"izo":0,"mold":0,"mult":0,"multi":0,"ne":0,"non":0,"pan":0,"par":0,"para":0,"penta":0,"petro":0,"port":0,"post":0,"pre":0,"prea":0,"pro":0,"psih":0,"re":0,"reo":0,"smith":0,"sub":0,"tri":0},"SC":{"ectazia":42,"ectazie":42,"ectaziei":42,"ectazii":10,"ectaziile":106,"ectaziilor":106,"metri":2,"metrii":2,"metrilor":18,"metru":2,"metrul":2,"metrului":18,"pter":0,"ptera":4,"pter\u0103":4,"ptere":4,"pterei":4,"pterele":20,"pterelor":20,"pteri":0,"pterii":4,"pterilor":20,"pterul":4,"pterului":20,"scoape":8,"scoapele":40,"scoapelor":40,"scop":0,"scopia":20,"scopic":4,"scopica":20,"scopic\u0103":20,"scopice":20,"scopicei":20,"scopicele":84,"scopicelor":84,"scopici":4,"scopicii":20,"scopicilor":84,"scopicul":20,"scopicului":84,"scopie":20,"scopiei":20,"scopii":4,"scopiile":52,"scopiilor":52,"scopul":4,"scopului":20,"service":4,"sfera":4,"sfer\u0103":4,"sfere":4,"sferei":4,"sferele":20,"sferelor":20,"sferic":4,"sferica":20,"sferic\u0103":20,"sferice":20,"sfericei":20,"sfericele":84,"sfericelor":84,"sferici":4,"sfericii":20,"sfericilor":84,"sfericul":20,"sfericului":84,"spasm":0,"spasme":8,"spasmele":40,"spasmelor":40,"spasmul":8,"spasmului":40,"sperm":0,"sperma":8,"sperm\u0103":8,"sperme":8,"spermei":8,"spermele":40,"spermelor":40,"spermi":0,"spermia":40,"spermie":40,"spermiei":40,"spermii":8,"spermiile":104,"spermiilor":104,"spermilor":40,"spermul":8,"spermului":40,"spor":0,"spori":0,"sporii":4,"sporilor":20,"sporul":4,"sporului":20,"static":4,"statica":20,"static\u0103":20,"statice":20,"staticei":20,"staticele":84,"staticelor":84,"statici":4,"staticii":20,"staticilor":84,"staticul":20,"staticului":84,"sta\u021Bia":20,"sta\u021Bie":20,"sta\u021Biei":20,"sta\u021Bii":4,"sta\u021Biile":52,"sta\u021Biilor":52},"SI":{"aldina":0,"aldin\u0103":0,"aldine":0,"aldinei":0,"aldinele":0,"aldinelor":0,"algia":0,"algie":0,"algii":0,"algiile":0,"algiilor":0,"ectomia":0,"ectomie":0,"ectomiei":0,"ectomii":0,"ectomiile":0,"ectomiilor":0,"emia":0,"emie":0,"emiei":0,"emii":0,"emiile":0,"emiilor":0,"estezia":0,"estezic":0,"estezica":0,"estezic\u0103":0,"estezice":0,"estezicei":0,"estezicele":0,"estezicelor":0,"estezici":0,"estezicii":0,"estezicilor":0,"estezicul":0,"estezicului":0,"estezie":0,"esteziei":0,"estezii":0,"esteziile":0,"esteziilor":0,"gnostic":0,"gnostica":0,"gnostic\u0103":0,"gnostice":0,"gnosticei":0,"gnosticele":0,"gnosticelor":0,"gnostici":0,"gnosticii":0,"gnosticilor":0,"gnosticul":0,"gnosticule":0,"gnosticului":0,"opsia":0,"opsie":0,"opsiei":0,"opsii":0,"opsiile":0,"opsiilor":0,"stat":0,"state":0,"statele":0,"statelor":0,"statul":0,"statului":0},"CF":{"abia":1,"aboli":5,"acetat":5,"acetatu":21,"acetatul":21,"acetatului":85,"aceta\u021Bi":5,"aceta\u021Bii":21,"aceta\u021Bilor":85,"acetilena":85,"acetilen\u0103":85,"acetilene":85,"acetilenei":85,"acetona":21,"aceton\u0103":21,"acetone":21,"acetonei":21,"acetonele":85,"acetonelor":85,"adas":0,"adenoame":37,"adenoamele":165,"adenoamelor":165,"adolphe":1,"adumbri":10,"aequo":2,"aeroaei":19,"aeroaie":19,"aerobi":3,"aero\u0219i":3,"agerpres":8,"agerpress":8,"agroindbank":72,"altfel":4,"alt\u00EEncotro":84,"altminterea":164,"altminterelea":676,"altminteri":36,"altundeva":84,"am\u0103gi":5,"ame\u021Bi":5,"aminti":9,"amor\u021Bi":9,"amurgi":9,"amu\u021Bi":5,"anaida":12,"andreici":18,"andrei\u021Ba":50,"andrei\u021B\u0103":50,"andreu\u021B":18,"anghelachi":82,"antici":2,"anticva":18,"anticv\u0103":18,"anticvei":18,"antistene":82,"antochi":10,"antofi":10,"antohi":10,"antoni":10,"arhiri":10,"asean":0,"asirom":0,"asito":0,"atem":0,"auschwitz":2,"babyschi":10,"background":8,"barb\u0103scump\u0103":276,"basa":0,"baudelair":16,"b\u0103ietr\u0103u":18,"bicsanda":36,"bic\u0219oc":4,"bidi":2,"bijboac\u0103":36,"bilba":4,"bilboc":4,"biliu\u021B\u0103":26,"bimbea":4,"bimbirel":20,"bimbiric\u0103":84,"binchiciu":36,"bindea":4,"bindeanu":36,"bindja":4,"binga":4,"bingheac":4,"bintea":4,"bin\u021Bin\u021Ban":36,"biobere":20,"bioc":0,"biolan":4,"biorou":4,"bio\u0219an":4,"birde\u0219":4,"birdici":4,"birgean":4,"bischin":4,"bissau":4,"biste":4,"bistea":4,"bistrae":36,"bistran":4,"bistranu":36,"bistreanu":68,"bistrian":36,"bistricean":36,"bistriceanu":292,"bistricianu":292,"bi\u0219boac\u0103":36,"bizdadea":20,"bizdideanu":148,"bizdigheanu":276,"bizdrighean":36,"bizdrigheanu":548,"bizdrighenu":292,"boghead":4,"braille":0,"brigitte":4,"brother":0,"byte":0,"caer":0,"cailor":6,"calalb":4,"cartney":8,"cathedra":18,"charles":0,"chianti":16,"ciao":0,"cincilei":16,"c\u00EE\u021Biva":8,"compasinter":164,"contra":4,"contra\u0219":4,"cor\u0103bia":10,"cor\u0103biaua":74,"corcimaru":80,"cornflakes":8,"country":8,"creditinvest":164,"creek":0,"daimio":20,"deadweight":8,"deck":0,"defta":4,"deftu":4,"delca":4,"delc\u0103":4,"delc\u0103rean":20,"delcea":4,"delcescu":36,"delcioiu":36,"delcu":4,"dembinschi":36,"demca":4,"demcu":4,"demian":2,"dem\u0219a":4,"dem\u0219oreanu":148,"denciu":4,"denciu\u021B":4,"dencu":4,"dendiu":4,"denghel":4,"dengjel":4,"densu\u0219ean":20,"densu\u0219ianu":148,"deoarece":42,"deocamdat\u0103":166,"deodat\u0103":22,"deoparte":38,"deopotriv\u0103":150,"derbac":4,"derban":4,"derda":4,"derdena":20,"derderian":84,"derdeu":4,"derjac":4,"derlean":4,"dermangiu":36,"dermengi":36,"dermengiu":36,"derpe\u0219":4,"der\u0219eanu":36,"der\u0219idan":20,"der\u021Biu":4,"dervi\u0219":4,"des\u0103gi":10,"des\u0103v\u00EEr\u0219i":74,"descria":34,"descriai":34,"descriam":34,"descria\u021Bi":34,"descriau":34,"descrie":34,"descriem":34,"descriere":98,"descrie\u021Bi":34,"descrii":2,"descriind":34,"descriindu":34,"descris":2,"descrise":34,"descrisei":34,"descriser\u0103":162,"descriser\u0103m":162,"descriser\u0103\u021Bi":162,"descrisese":162,"descrisesem":162,"descriseser\u0103":674,"descriseser\u0103m":674,"descriseser\u0103\u021Bi":674,"descrisese\u0219i":162,"descrisese\u021Bi":162,"descrise\u0219i":34,"descrisu":34,"descriu":2,"descump\u0103ni":164,"deseori":10,"deservi":18,"deslu\u0219i":20,"desp\u0103duri":84,"desp\u0103gubi":84,"desp\u0103ienjeni":660,"desp\u0103r\u021Bi":36,"desp\u0103turi":84,"despleti":36,"despodobi":84,"despotcovi":164,"despotmoli":164,"despre":2,"desrobitu":84,"des\u021Beleni":84,"desuci":10,"desz\u0103pezi":84,"de\u0219liu":4,"de\u0219ter":4,"detc\u0103u":4,"deum":2,"deun\u0103zi":6,"dezaburi":44,"dezaerisi":92,"dezam\u0103gi":44,"dezgoli":20,"dezgovi":20,"dezlipi":20,"dezme\u021Bi":20,"dezmiri\u0219ti":148,"dezmor\u021Bi":36,"dezmo\u0219teni":164,"dezr\u0103suci":84,"dezrobi":20,"dezuni":12,"dezv\u0103l\u0103tuci":340,"dezveli":20,"dezvinov\u0103\u021Bi":340,"dinadins":12,"dinafar\u0103":44,"dinapoi":12,"dinapoia":44,"discount":4,"disper":2,"disperi":2,"drive":0,"drugstore":8,"dubli":2,"duelgi":10,"dyke":0,"electrecord":81,"episcoape":69,"episcoapele":325,"episcoapelor":325,"episcop":1,"episcope":41,"episcopi":9,"episcopii":41,"episcopiilor":425,"episcopilor":169,"episcopul":33,"episcopule":169,"episcopului":161,"ethno":4,"five":0,"foehn":0,"france":0,"free":0,"galimatias":170,"gates":0,"geoab\u0103":8,"geoad\u0103":8,"geoan\u0103":8,"geoars\u0103":16,"geobegescu":148,"geogea":4,"geogean":4,"geogeanu":36,"geogescu":36,"geogia":4,"geoglovan":36,"geolde\u0219":8,"geolea":4,"geolg\u0103u":8,"geomea":4,"geomolean":20,"geonea":4,"georges":0,"georgiadi":104,"geornea":8,"geornoiu":40,"geor\u0219oiu":40,"geosanu":20,"geovanovici":84,"gerunziu":18,"gimnaziu":20,"goethit":4,"grazioso":36,"grecque":8,"grisaille":4,"gui\u021B":0,"habeas":10,"hain":2,"haini":6,"hardware":8,"hiol\u0103":6,"hobby":0,"hollywood":16,"homordean":18,"homo\u0219dean":18,"homo\u0219tean":18,"iap\u0103scurt\u0103":138,"ibid":0,"ibidem":2,"icral":0,"imbroglio":18,"indcon":4,"indmontaj":4,"indoor":2,"inrie\u0219":10,"interes":10,"interesa":42,"interesai":42,"interesam":42,"interesar\u0103":170,"interesar\u0103m":170,"interesar\u0103\u021Bi":170,"interesare":170,"interesase":170,"interesasem":170,"interesaser\u0103":682,"interesaser\u0103m":682,"interesaser\u0103\u021Bi":682,"interesase\u0219i":170,"interesase\u021Bi":682,"interesa\u0219i":42,"interesat":42,"interesatu":170,"interesa\u021Bi":42,"interesau":42,"interes\u0103":42,"interes\u0103m":42,"interese":42,"intereseaz\u0103":298,"interesele":170,"intereselor":170,"interesez":42,"intereseze":170,"interesezi":42,"interes\u00EEnd":42,"interes\u00EEndu":298,"interesul":42,"interesului":170,"interi":2,"interii":10,"interilor":42,"interul":10,"interului":42,"interverti":146,"intestat":18,"irta":0,"\u00EEmp\u00EEcli":10,"\u00EEmpotrivi":74,"\u00EEnadins":6,"\u00EEndeajuns":26,"\u00EEndeaproape":282,"\u00EEndeob\u0219te":42,"\u00EEndeosebi":26,"\u00EEndeplini":74,"\u00EEnfiere":26,"\u00EEnfierea":26,"\u00EEnnegri":10,"\u00EEnr\u0103ut\u0103\u021Bi":90,"\u00EEnr\u00EEuri":26,"\u00EEnsufle\u021Bi":74,"\u00EEntruni":18,"jacques":0,"jane":0,"jeep":0,"jian":2,"jiana":6,"jianul":6,"jitsu":2,"jiujitsu":20,"kathmandu":8,"kathy":2,"knockout":16,"koala":6,"layout":4,"lesotho":10,"leutze":4,"longue":4,"louis":0,"lukoil":4,"macrone":2,"macrou":2,"magnetou":20,"magneziu":20,"malaya":10,"marciale":36,"mauritius":86,"medjidia":82,"metacomimpex":72,"metahirisi":170,"miau":0,"michael":2,"micronucleu":82,"mied":0,"miei":0,"miel":0,"mierl\u0103":8,"mierte":8,"milian":2,"milieu":2,"milii":2,"milincovici":82,"m\u00EEn\u0103scurt\u0103":138,"molda":4,"moldav":4,"moldava":20,"moldav\u0103":20,"moldave":20,"moldavei":20,"moldavele":84,"moldavelor":84,"moldavi":4,"moldavii":20,"moldavilor":84,"moldavit":20,"moldavite":84,"moldavitele":340,"moldavitelor":340,"moldavitul":84,"moldavitului":340,"moldavu":20,"moldavul":20,"moldavule":84,"moldavului":84,"mold\u0103":4,"molde":4,"moldei":4,"moldele":20,"moldelor":20,"moldocon":20,"monoame":18,"monoamele":82,"monoamelor":82,"monodia":44,"monodie":44,"monodiei":44,"monodii":12,"monodiile":108,"monodiilor":108,"montreal":40,"nato":0,"neagoie":20,"nealta":10,"nealt\u0103dat\u0103":170,"nealteia":42,"nealtele":42,"nealtora":42,"nealtuia":42,"nealtul":10,"neal\u021Bii":10,"necinsti":18,"necoi\u021B\u0103":26,"nedumeri":42,"neferici":42,"negoiescu":74,"nehnici":4,"nehtu":4,"nejderu":20,"nejloveanu":148,"nejnec":4,"nejneru":20,"nemeice":26,"nemuri":10,"nencu":4,"nenoroci":42,"nerciu":4,"nerge\u0219":4,"nerghe":4,"nerghe\u0219":4,"nerglea":4,"nescovici":20,"nescui":4,"nescu\u021B\u0103":20,"nesocoti":42,"neste":4,"nesteian":20,"nesteriuc":20,"nestor":4,"nestorescu":148,"ne\u0219tian":4,"ne\u0219tine":20,"ne\u0219tiut":18,"nona":2,"non\u0103":2,"none":2,"nonea":2,"nonei":2,"nonele":10,"nonelor":10,"nonet":2,"nonete":10,"nonetele":42,"nonetelor":42,"nonetul":10,"nonetului":42,"noneu":4,"nonica":10,"nonoac\u0103":18,"nontaru":20,"nonu":2,"nonu\u0219":2,"nonu\u021B":2,"oare\u0219ice":34,"ohmi":0,"omert\u00E0":9,"onu":0,"orice":4,"oricine":20,"oric\u00EEnd":4,"oricum":4,"ori\u00EEncotro":84,"oriunde":20,"oronim":6,"osce":0,"panac":2,"panacee":42,"panaceele":106,"panaceelor":106,"panaceu":10,"panaceul":42,"panaceului":106,"panache":10,"panaci":2,"panagachie":42,"panaghia":10,"panaghie":10,"panaghioiu":138,"panaidor":18,"panait":10,"panama":10,"panamale":42,"panamalei":42,"panamalele":170,"panamalelor":170,"panamaua":42,"pan\u0103":2,"pandi":4,"pandichi":20,"pane":2,"panea":2,"panel":2,"panelul":10,"panelului":42,"paneluri":10,"panelurile":42,"panelurilor":170,"pane\u0219":2,"panete":10,"pangrati":36,"panica":10,"panicai":10,"panicam":10,"panicar\u0103":42,"panicar\u0103m":42,"panicar\u0103\u021Bi":42,"panicare":42,"panicase":42,"panicasem":42,"panicaser\u0103":170,"panicaser\u0103m":170,"panicaser\u0103\u021Bi":170,"panicase\u0219i":42,"panica\u0219i":10,"panicat":10,"panica\u021Bi":10,"panicau":10,"panic\u0103":10,"panic\u0103m":10,"panicheaz\u0103":138,"panichez":10,"panicheze":74,"panichezi":10,"panici":2,"panicii":10,"panic\u00EEnd":10,"panii":2,"panilor":10,"paniova":18,"paniti":10,"panou":2,"panoul":10,"panoului":26,"panouri":10,"panourile":90,"panourilor":90,"panteleon":84,"panu":2,"panul":2,"panule":10,"panului":10,"para":2,"parada":10,"parad\u0103":10,"parade":10,"paradei":10,"paradele":42,"paradelor":42,"paradis":10,"paradisul":42,"paradisului":170,"paradisuri":42,"paradisurile":682,"paradisurilor":682,"parafa":10,"parafai":10,"parafam":10,"parafar\u0103":42,"parafar\u0103m":42,"parafar\u0103\u021Bi":42,"parafare":42,"parafarea":42,"parafase":42,"parafasem":42,"parafaser\u0103":170,"parafaser\u0103m":170,"parafaser\u0103\u021Bi":170,"parafase\u0219i":42,"parafase\u021Bi":42,"parafa\u0219i":10,"parafat":10,"parafatu":42,"parafa\u021Bi":10,"parafau":10,"paraf\u0103":10,"paraf\u0103m":10,"paraf\u0103ri":10,"paraf\u0103rii":42,"paraf\u0103rile":170,"paraf\u0103rilor":170,"parafe":10,"parafeaz\u0103":74,"parafei":10,"parafele":42,"parafelor":42,"parafez":10,"parafeze":42,"parafezi":10,"parafina":42,"parafin\u0103":42,"parafine":42,"parafinei":42,"parafinele":170,"parafinelor":170,"paraf\u00EEnd":10,"paraf\u00EEndu":74,"parafum":10,"parafumul":42,"parafumului":170,"parafumuri":42,"parafumurile":682,"parafumurilor":682,"paragina":42,"paragin\u0103":42,"paragini":10,"paraginii":42,"paraginile":170,"paraginilor":170,"paragraf":10,"paragrafe":74,"paragrafele":330,"paragrafelor":330,"paragraful":74,"paragrafului":330,"parai":2,"paraii":10,"parailor":26,"paralaxa":42,"paralax\u0103":42,"paralaxe":42,"paralaxei":42,"paralaxele":170,"paralaxelor":170,"parale":10,"paralei":10,"paraleii":42,"paraleilor":106,"paralel":10,"paralela":42,"paralel\u0103":42,"paralele":42,"paralelei":42,"paralelele":170,"paralelelor":170,"paraleli":10,"paralelii":42,"paralelilor":170,"paralelor":42,"paralelul":42,"paralelului":170,"paraleluri":42,"paralelurile":682,"paralelurilor":682,"paraleu":10,"paraleul":42,"paraleule":106,"paraleului":106,"param":2,"parapet":10,"parapete":42,"parapetele":170,"parapetelor":170,"parapetu":42,"parapetul":42,"parapetului":170,"parar\u0103":10,"parar\u0103m":10,"parar\u0103\u021Bi":10,"parare":10,"parase":10,"parasem":10,"paraser\u0103":42,"paraser\u0103m":42,"paraser\u0103\u021Bi":42,"parase\u0219i":10,"parase\u021Bi":10,"para\u0219i":2,"parat":2,"paratu":10,"para\u021Bi":2,"parau":2,"paraua":10,"paravan":10,"paravane":42,"paravanele":170,"paravanelor":170,"paravanul":42,"paravanului":170,"par\u0103":2,"par\u0103m":2,"pareaz\u0103":18,"parez":2,"pareze":10,"parezi":10,"pariu":2,"pariul":10,"pariului":26,"pariuri":10,"pariurile":90,"pariurilor":90,"par\u00EEnd":2,"par\u00EEndu":18,"paroh":2,"parohi":2,"parohia":42,"parohie":42,"parohiei":42,"parohii":10,"parohiile":106,"parohiilor":106,"parohilor":42,"parohu":10,"parohul":10,"parohule":42,"parohului":42,"parol":2,"parola":10,"parol\u0103":10,"parole":10,"parolei":10,"parolele":42,"parolelor":42,"pedigri":10,"penalti":18,"pentada":20,"pentad\u0103":20,"pentade":20,"pentadei":20,"pentadele":84,"pentadelor":84,"pentan":4,"pentani":4,"pentanii":20,"pentanilor":84,"pentanul":20,"pentanului":84,"pentateuh":84,"petroaia":34,"petroaica":66,"petroaie":34,"petroaiei":34,"petrof":2,"petroi":2,"petroianu":82,"petroiu":18,"petrol":2,"petrolul":18,"petrolului":82,"petroluri":18,"petrolurile":338,"petrolurilor":338,"petrom\u0103nean\u021B":82,"petrom\u0103nian\u021B":82,"petrone":18,"petronela":82,"petroniu":18,"petros":2,"petroschi":34,"petro\u0219":2,"petro\u0219el":18,"petro\u0219ni\u021Ba":162,"petrou":2,"petrova":18,"petrovai":18,"petrovan":18,"petrovanu":82,"petrovaselo":338,"petrovici":18,"petroviciu":82,"petrovi\u021Ba":82,"petrovschi":34,"pianissimo":164,"piano":4,"pi\u00E8ces":4,"pieile":12,"pitchpine":16,"pleiocaziu":84,"poli\u0219ciuc":18,"portal":4,"portalul":20,"portalului":84,"portaluri":20,"portalurile":340,"portalurilor":340,"portan":4,"portant":4,"portanta":36,"portant\u0103":36,"portante":36,"portantei":36,"portantele":164,"portantelor":164,"portantul":36,"portantului":164,"portan\u021Bi":4,"portan\u021Bii":36,"portan\u021Bilor":164,"portar":4,"portare":20,"portari":4,"portarii":20,"portarilor":84,"portaru":20,"portarul":20,"portarule":84,"portarului":84,"portase":20,"port\u0103rescu":148,"portic":4,"porticul":20,"porticului":84,"porticuri":20,"porticurile":340,"porticurilor":340,"portiera":52,"portier\u0103":52,"portiere":52,"portierei":52,"portierele":180,"portierelor":180,"porti\u021Ba":20,"porti\u021B\u0103":20,"porti\u021Be":20,"porti\u021Bei":20,"porti\u021Bele":84,"porti\u021Belor":84,"porto":4,"portoare":36,"portoarele":164,"portoarelor":164,"portor":4,"portorul":20,"portorului":84,"portoul":20,"portoului":52,"portouri":20,"portourile":180,"portourilor":180,"portret":4,"portreta":36,"portretai":36,"portretam":36,"portretar\u0103":164,"portretar\u0103m":164,"portretar\u0103\u021Bi":164,"portretare":164,"portretase":164,"portretasem":164,"portretaser\u0103":676,"portretaser\u0103m":676,"portretaser\u0103\u021Bi":676,"portretase\u0219i":164,"portretase\u021Bi":676,"portreta\u0219i":36,"portretat":36,"portretatu":164,"portreta\u021Bi":36,"portretau":36,"portret\u0103":36,"portret\u0103m":36,"portrete":36,"portreteaz\u0103":292,"portretele":164,"portretelor":164,"portretez":36,"portreteze":164,"portretezi":36,"portret\u00EEnd":36,"portret\u00EEndu":292,"portretul":36,"portretului":164,"portul":4,"portului":20,"porturi":4,"porturile":84,"porturilor":84,"posta":4,"postai":4,"postam":4,"postar\u0103":20,"postar\u0103m":20,"postar\u0103\u021Bi":20,"postare":20,"postase":20,"postasem":20,"postaser\u0103":84,"postaser\u0103m":84,"postaser\u0103\u021Bi":84,"postase\u0219i":20,"postase\u021Bi":20,"posta\u0219i":4,"postat":4,"postata":20,"postat\u0103":20,"postate":20,"postatei":20,"postatele":84,"postatelor":84,"postatu":20,"posta\u021Bi":4,"postau":4,"postav":4,"postava":20,"postav\u0103":20,"postavul":20,"postavului":84,"postavuri":20,"postavurile":340,"postavurilor":340,"post\u0103":4,"post\u0103m":4,"post\u0103vi":4,"post\u0103vii":20,"post\u0103vile":84,"post\u0103vilor":84,"postea":4,"posteai":4,"posteam":4,"posteanu":36,"posteasc\u0103":68,"postea\u021Bi":4,"posteau":4,"posteaz\u0103":36,"postei":4,"posteiu":20,"postelnecu":164,"poster":4,"postere":20,"posterele":84,"posterelor":84,"posterul":20,"posterului":84,"postesc":4,"postescu":36,"poste\u0219te":36,"poste\u0219ti":4,"posteuca":36,"posteuc\u0103":36,"posteuci":4,"posteucii":36,"posteucile":164,"posteucilor":164,"postez":4,"posteze":20,"postezi":4,"posti":4,"postic\u0103":20,"postii":4,"postim":4,"postind":4,"postindu":36,"postir\u0103":20,"postir\u0103m":20,"postir\u0103\u021Bi":20,"postire":20,"postise":20,"postisem":20,"postiser\u0103":84,"postiser\u0103m":84,"postiser\u0103\u021Bi":84,"postise\u0219i":20,"postise\u021Bi":20,"posti\u0219i":4,"postit":4,"postitu":20,"posti\u021Bi":4,"post\u00EEc\u0103":20,"post\u00EEnd":4,"post\u00EEndu":36,"postole":20,"postolea":20,"postovaru":84,"postovei":20,"postu":4,"postul":4,"postula":20,"postulache":84,"postulai":20,"postulam":20,"postular\u0103":84,"postular\u0103m":84,"postular\u0103\u021Bi":84,"postulare":84,"postulase":84,"postulasem":84,"postulaser\u0103":340,"postulaser\u0103m":340,"postulaser\u0103\u021Bi":340,"postulase\u0219i":84,"postulase\u021Bi":84,"postula\u0219i":20,"postulat":20,"postulatu":84,"postula\u021Bi":20,"postulau":20,"postul\u0103":20,"postul\u0103m":20,"postuleaz\u0103":148,"postulez":20,"postuleze":84,"postulezi":20,"postul\u00EEnd":20,"postul\u00EEndu":148,"postului":20,"postum":4,"postuma":20,"postum\u0103":20,"postume":20,"postumei":20,"postumele":84,"postumelor":84,"postumi":4,"postumii":20,"postumilor":84,"postumul":20,"postumului":84,"postura":20,"postur\u0103":20,"posturi":4,"posturii":20,"posturile":84,"posturilor":84,"preajma":16,"preajm\u0103":16,"pream\u0103ri":40,"preaviz":12,"preaviza":44,"preavizai":44,"preavizam":44,"preavizar\u0103":172,"preavizar\u0103m":172,"preavizar\u0103\u021Bi":172,"preavizare":172,"preavizase":172,"preavizasem":172,"preavizaser\u0103":684,"preavizaser\u0103m":684,"preavizaser\u0103\u021Bi":684,"preavizase\u0219i":172,"preavizase\u021Bi":172,"preaviza\u0219i":44,"preavizat":44,"preavizatu":172,"preaviza\u021Bi":44,"preavizau":44,"preaviz\u0103":44,"preaviz\u0103m":44,"preavize":44,"preavizeaz\u0103":300,"preavizele":172,"preavizelor":172,"preavizez":44,"preavizeze":172,"preavizezi":44,"preaviz\u00EEnd":44,"preaviz\u00EEndu":300,"preavizul":44,"preavizului":172,"precump\u0103ni":164,"preg\u0103ti":20,"preorocu":40,"prescan":8,"prescean":8,"prescorni\u021Boiu":1352,"prescura":40,"prescur\u0103":40,"prescure":40,"prescurea":40,"prescuri":8,"prescurii":40,"prescurile":168,"prescurilor":168,"prescurniac":72,"presta":8,"prestabil":40,"prestabila":168,"prestabil\u0103":168,"prestabile":168,"prestabilea":164,"prestabileai":164,"prestabileam":164,"prestabileasc\u0103":2212,"prestabilea\u021Bi":164,"prestabileau":164,"prestabilei":168,"prestabilele":680,"prestabilelor":680,"prestabilesc":164,"prestabile\u0219te":1188,"prestabile\u0219ti":164,"prestabililor":680,"prestabilim":164,"prestabilind":164,"prestabilindu":1188,"prestabilir\u0103":676,"prestabilir\u0103m":676,"prestabilir\u0103\u021Bi":676,"prestabilire":676,"prestabilise":676,"prestabilisem":676,"prestabiliser\u0103":2724,"prestabiliser\u0103m":2724,"prestabiliser\u0103\u021Bi":2724,"prestabilise\u0219i":676,"prestabilise\u021Bi":676,"prestabili\u0219i":164,"prestabilit":164,"prestabilitu":676,"prestabili\u021Bi":164,"prestabilul":168,"prestabilului":680,"prestai":8,"prestam":8,"prestar\u0103":40,"prestar\u0103m":40,"prestar\u0103\u021Bi":40,"prestare":40,"prestase":40,"prestasem":40,"prestaser\u0103":168,"prestaser\u0103m":168,"prestaser\u0103\u021Bi":168,"prestase\u0219i":40,"prestase\u021Bi":40,"presta\u0219i":8,"prestat":8,"prestatu":40,"presta\u021Bi":8,"prestau":8,"prest\u0103":8,"prest\u0103m":8,"presteaz\u0103":72,"prestez":8,"presteze":40,"prestezi":8,"prest\u00EEnd":8,"prest\u00EEndu":72,"presto":8,"pre\u0219mereanu":296,"pre\u0219neanu":72,"preuteasa":76,"preutescu":76,"preutu":12,"preu\u021Bescu":76,"preveni":20,"prevesti":36,"proasta":16,"proast\u0103":16,"proaste":16,"proastei":16,"proastele":80,"proastelor":80,"probozi":20,"procopsi":36,"prohibi":20,"prohodi":20,"prohorisi":84,"prop\u0103\u0219i":20,"propta":8,"propt\u0103":8,"propte":8,"proptea":8,"propteai":8,"propteala":72,"propteal\u0103":72,"propteam":8,"propteasc\u0103":136,"proptea\u021Bi":8,"propteau":8,"propteaua":72,"proptei":8,"proptele":40,"proptelei":40,"proptelele":168,"proptelelor":168,"proptelor":40,"proptesc":8,"propte\u0219te":72,"propte\u0219ti":8,"propti":8,"proptii":8,"proptim":8,"proptind":8,"proptindu":72,"proptir\u0103":40,"proptir\u0103m":40,"proptir\u0103\u021Bi":40,"proptire":40,"proptise":40,"proptisem":40,"proptiser\u0103":168,"proptiser\u0103m":168,"proptiser\u0103\u021Bi":168,"proptise\u0219i":40,"proptise\u021Bi":40,"propti\u0219i":8,"proptit":8,"proptitu":40,"propti\u021Bi":8,"proscanu":40,"proscomidi":168,"prospect":8,"prospecta":72,"prospectai":72,"prospectam":72,"prospectar\u0103":328,"prospectar\u0103m":328,"prospectar\u0103\u021Bi":328,"prospectare":328,"prospectase":328,"prospectasem":328,"prospectaser\u0103":1352,"prospectaser\u0103m":1352,"prospectaser\u0103\u021Bi":1352,"prospectase\u0219i":328,"prospectase\u021Bi":328,"prospecta\u0219i":72,"prospectat":72,"prospectatu":328,"prospecta\u021Bi":72,"prospectau":72,"prospect\u0103":72,"prospect\u0103m":72,"prospecte":72,"prospecteaz\u0103":584,"prospectele":328,"prospectelor":328,"prospectez":72,"prospecteze":328,"prospectezi":72,"prospect\u00EEnd":72,"prospect\u00EEndu":584,"prospectul":72,"prospectului":328,"prosper":8,"prospera":40,"prosperai":40,"prosperam":40,"prosperar\u0103":168,"prosperar\u0103m":168,"prosperar\u0103\u021Bi":168,"prosperare":168,"prosperase":168,"prosperasem":168,"prosperaser\u0103":680,"prosperaser\u0103m":680,"prosperaser\u0103\u021Bi":680,"prosperase\u0219i":168,"prosperase\u021Bi":168,"prospera\u0219i":40,"prosperat":40,"prosperatu":168,"prospera\u021Bi":40,"prosperau":40,"prosper\u0103":40,"prosper\u0103m":40,"prospere":40,"prosperei":40,"prosperele":168,"prosperelor":168,"prosperi":8,"prosperii":40,"prosperilor":168,"prosper\u00EEnd":40,"prosper\u00EEndu":296,"prosperul":40,"prosperului":168,"prost":0,"prostan":8,"prostana":40,"prostan\u0103":40,"prostane":40,"prostanei":40,"prostanele":168,"prostanelor":168,"prostani":8,"prostanii":40,"prostanilor":168,"prostanul":40,"prostanului":168,"prostata":40,"prostat\u0103":40,"prostate":40,"prostatei":40,"prostatele":168,"prostatelor":168,"prostea":8,"prosteai":8,"prosteala":72,"prosteal\u0103":72,"prosteam":8,"prosteasc\u0103":136,"prostea\u021Bi":8,"prosteau":8,"prosteli":8,"prostelii":40,"prostelile":168,"prostelilor":168,"prostesc":8,"proste\u0219te":72,"proste\u0219ti":8,"prosti":8,"prostia":40,"prostic":8,"prostica":40,"prostic\u0103":40,"prostice":40,"prosticei":40,"prosticele":168,"prosticelor":168,"prostici":8,"prosticii":40,"prosticilor":168,"prosticul":40,"prosticului":168,"prostie":40,"prostiei":40,"prostii":8,"prostiile":104,"prostiilor":104,"prostim":8,"prostime":40,"prostimea":40,"prostimi":8,"prostimii":40,"prostind":8,"prostindu":72,"prostir\u0103":40,"prostir\u0103m":40,"prostir\u0103\u021Bi":40,"prostire":40,"prostise":40,"prostisem":40,"prostiser\u0103":168,"prostiser\u0103m":168,"prostiser\u0103\u021Bi":168,"prostise\u0219i":40,"prostise\u021Bi":40,"prosti\u0219i":8,"prostit":8,"prostitu":40,"prosti\u021Bi":8,"prostrat":8,"prostrata":72,"prostrat\u0103":72,"prostrate":72,"prostratei":72,"prostratele":328,"prostratelor":328,"prostratul":72,"prostratului":328,"prostra\u021Bi":8,"prostra\u021Bii":72,"prostra\u021Bilor":328,"prostu":8,"prostul":8,"prostului":40,"pro\u0219ca":8,"pro\u0219can":8,"pro\u0219ti":0,"pro\u0219tii":8,"pro\u0219tilor":40,"protchi":8,"proveni":20,"psihic":4,"psihica":20,"psihic\u0103":20,"psihice":20,"psihicei":20,"psihicele":84,"psihicelor":84,"psihici":4,"psihicii":20,"psihicilor":84,"psihicul":20,"psihicului":84,"quechua":36,"rablagi":18,"radioasa":42,"radioas\u0103":42,"radioase":42,"radioasei":42,"radioasele":170,"radioaselor":170,"r\u0103salalt\u0103ieri":332,"rec\u0103s\u0103tori":170,"reciti":10,"rec\u00EEnt\u0103ri":82,"recl\u0103di":18,"reconverti":146,"recte":4,"rectul":4,"rectului":20,"recturi":4,"recturile":84,"recturilor":84,"recuceri":42,"redeveni":42,"rednic":4,"redob\u00EEndi":74,"refgian":4,"refolosi":42,"reg\u0103si":10,"reggae":4,"reg\u00EEndi":18,"regneal\u0103":36,"regnul":4,"regnului":20,"regnuri":4,"regnurile":84,"regnurilor":84,"reinvesti":74,"re\u00EEnc\u0103lzi":74,"re\u00EEncol\u021Bi":74,"re\u00EEnflori":74,"re\u00EEns\u0103n\u0103to\u0219i":682,"re\u00EEnsufle\u021Bi":298,"re\u00EEntineri":170,"re\u00EEnt\u00EElni":74,"re\u00EEntregi":74,"re\u00EEnverzi":74,"re\u00EEnvesti":74,"remake":2,"remba\u0219":4,"remghea":4,"renchez":4,"rende\u0219":4,"rendez":4,"renghea":4,"rep\u0103r\u021Bi":18,"repciuc":4,"repovesti":74,"repta":4,"resca\u0219iu":20,"rescu":4,"reslescu":36,"resmeli\u021B\u0103":84,"resmeri\u021B\u0103":84,"respir":4,"respira":20,"respirai":20,"respiram":20,"respirar\u0103":84,"respirar\u0103m":84,"respirar\u0103\u021Bi":84,"respirare":84,"respirase":84,"respirasem":84,"respiraser\u0103":340,"respiraser\u0103m":340,"respiraser\u0103\u021Bi":340,"respirase\u0219i":340,"respirase\u021Bi":84,"respira\u0219i":20,"respirat":20,"respiratu":84,"respira\u021Bi":20,"respirau":20,"respir\u0103":20,"respir\u0103m":20,"respire":20,"respiri":4,"respir\u00EEnd":20,"respir\u00EEndu":148,"respirul":20,"respirului":84,"ressu":4,"restabili":82,"resta\u0219":4,"restei":4,"resteie":20,"resteiele":84,"resteielor":84,"resteman":20,"reste\u0219an":20,"resteu":4,"resteul":20,"resteului":52,"restie":4,"restitutio":340,"restivan":20,"restul":4,"restului":20,"resturi":4,"resturile":84,"resturilor":84,"res\u021Bea":4,"resvedeanu":148,"re\u0219ca":4,"re\u0219can":4,"re\u0219c\u0103":4,"re\u0219ce":4,"re\u0219ceanu":36,"re\u0219cei":4,"re\u0219cele":20,"re\u0219celor":20,"re\u0219cu\u021Ba":20,"re\u0219te":4,"re\u0219tea":4,"retopi":10,"reu\u0219i":6,"reuter":0,"reu\u021B":2,"reveni":10,"revnic":4,"revopsi":18,"revu\u021Bchi":18,"rezban":4,"rezidi":10,"rezluc":4,"rezmeri\u021B\u0103":84,"rezme\u0219":4,"rezmeuve\u0219":36,"rezmive\u0219":20,"rocaille":2,"romarta":0,"romexpo":0,"romsteel":4,"room":0,"russe":0,"saligny":8,"sfecli":4,"sida":0,"sinchisi":36,"s\u00EEntilie":8,"slbaslbaslba":1193,"smithsonit":80,"software":8,"spaniel":4,"standart":16,"style":0,"subarba":18,"subarb\u0103":18,"subarbe":18,"subarbei":18,"subarbele":82,"subarbelor":82,"suba\u0219a":10,"suber":2,"suberina":42,"suberin\u0103":42,"suberine":42,"suberinei":42,"suberul":10,"suberului":42,"subit":2,"subita":10,"subit\u0103":10,"subite":10,"subitei":10,"subitele":42,"subitelor":42,"subitul":10,"subitului":42,"subi\u021Bi":2,"subi\u021Bii":10,"subi\u021Bilor":42,"sublim":2,"sublima":18,"sublimai":18,"sublimam":18,"sublimar\u0103":82,"sublimar\u0103m":82,"sublimar\u0103\u021Bi":82,"sublimare":82,"sublimase":82,"sublimasem":82,"sublimaser\u0103":338,"sublimaser\u0103m":338,"sublimaser\u0103\u021Bi":338,"sublimase\u0219i":82,"sublimase\u021Bi":82,"sublima\u0219i":18,"sublimat":18,"sublimatu":82,"sublima\u021Bi":18,"sublimau":18,"sublim\u0103":18,"sublim\u0103m":18,"sublime":18,"sublimeaz\u0103":146,"sublimei":18,"sublimele":82,"sublimelor":82,"sublimez":18,"sublimeze":82,"sublimezi":18,"sublimi":2,"sublimii":18,"sublimilor":82,"sublimitate":338,"sublimitatea":338,"sublimit\u0103\u021Bi":82,"sublimit\u0103\u021Bii":338,"sublimit\u0103\u021Bile":1362,"sublimit\u0103\u021Bilor":1362,"sublim\u00EEnd":18,"sublim\u00EEndu":146,"sublimul":18,"sublimului":82,"subodie":10,"subota":10,"subra":2,"subra\u021B":2,"subra\u021Be":18,"subra\u021Bele":82,"subra\u021Belor":82,"subra\u021Bul":18,"subra\u021Bului":82,"subraul":18,"subraului":50,"subrauri":18,"subraurile":178,"subraurilor":178,"subreta":18,"subret\u0103":18,"subrete":18,"subretei":18,"subretele":82,"subretelor":82,"subreto":18,"subzidi":20,"superioara":170,"superioar\u0103":170,"superioare":170,"superioarei":170,"superioarele":682,"superioarelor":682,"superior":42,"superiori":42,"superiorii":106,"superiorilor":362,"superiorul":106,"superiorului":362,"supra\u00EEnc\u0103lzi":594,"supranumi":82,"talkie":0,"tarom":0,"technology":168,"tehoptimed":68,"teleac":2,"teleaga":18,"teleag\u0103":18,"teleap":2,"telearc\u0103":34,"telea\u0219\u0103":18,"telecom":8,"telegi":2,"telegii":10,"telegile":42,"telegilor":42,"telejman":18,"telejna":18,"telembici":18,"telenche":18,"telescu":18,"tele\u0219man":18,"tele\u0219pan":18,"teleuc\u0103":18,"t\u00E8ne":0,"termocom":16,"tiramis\u00F9":42,"totodat\u0103":44,"totuna":12,"transa":8,"trans\u0103":8,"transcria":136,"transcriai":136,"transcriam":136,"transcria\u021Bi":136,"transcriau":136,"transcrie":136,"transcriem":136,"transcriere":392,"transcrie\u021Bi":136,"transcrii":8,"transcriind":136,"transcriindu":648,"transcript":8,"transcris":8,"transcrise":136,"transcrisei":136,"transcriser\u0103":648,"transcriser\u0103m":648,"transcriser\u0103\u021Bi":648,"transcrisese":648,"transcrisesem":648,"transcriseser\u0103":2696,"transcriseser\u0103m":2696,"transcriseser\u0103\u021Bi":2696,"transcrisese\u0219i":648,"transcrisese\u021Bi":648,"transcrise\u0219i":136,"transcrisu":136,"transcriu":8,"transe":8,"transei":8,"transele":40,"transelor":40,"transept":8,"transeptul":72,"transeptului":328,"transepturi":72,"transepturile":1352,"transepturilor":1352,"transfer":8,"transfera":72,"transferai":72,"transferam":72,"transferar\u0103":328,"transferar\u0103m":328,"transferar\u0103\u021Bi":328,"transferare":328,"transferarea":328,"transferase":328,"transferasem":328,"transferaser\u0103":1352,"transferaser\u0103m":1352,"transferaser\u0103\u021Bi":1352,"transferase\u0219i":328,"transferase\u021Bi":328,"transfera\u0219i":72,"transferat":72,"transferatu":328,"transfera\u021Bi":72,"transferau":72,"transfer\u0103":72,"transfer\u0103m":72,"transfer\u0103ri":72,"transfer\u0103rii":328,"transfer\u0103rile":1352,"transfer\u0103rilor":1352,"transfere":72,"transferi":8,"transfer\u00EEnd":72,"transfer\u00EEndu":584,"transferul":72,"transferului":328,"transferuri":72,"transferurile":1352,"transferurilor":1352,"transpir":8,"transpira":72,"transpirai":72,"transpiram":72,"transpirar\u0103":328,"transpirar\u0103m":328,"transpirar\u0103\u021Bi":328,"transpirare":72,"transpirase":328,"transpirasem":328,"transpiraser\u0103":1352,"transpiraser\u0103m":1352,"transpiraser\u0103\u021Bi":1352,"transpirase\u0219i":1352,"transpirase\u021Bi":328,"transpira\u0219i":72,"transpirat":72,"transpiratu":328,"transpira\u021Bi":72,"transpirau":72,"transpir\u0103":72,"transpir\u0103m":72,"transpire":72,"transpiri":8,"transpir\u00EEnd":72,"transpir\u00EEndu":584,"treilea":12,"trist":0,"trista":8,"trist\u0103":8,"triste":8,"tristei":8,"tristele":40,"tristelor":40,"tristu":8,"tristul":8,"tristului":40,"tri\u0219nevschi":72,"tri\u0219te":8,"tri\u0219tea":8,"tri\u0219ti":0,"tri\u0219tii":8,"tri\u0219tile":40,"tri\u0219tilor":40,"\u021Binghilinghi":292,"unea":1,"uneai":1,"uneam":1,"uneasc\u0103":17,"unea\u021Bi":1,"uneau":1,"unesc":1,"unesco":0,"une\u0219te":9,"une\u0219ti":1,"unicef":0,"unii":1,"unim":1,"unind":1,"unindu":9,"unir\u0103":5,"unir\u0103m":5,"unir\u0103\u021Bi":5,"unire":5,"unise":5,"unisem":5,"uniser\u0103":21,"uniser\u0103m":21,"uniser\u0103\u021Bi":21,"unise\u0219i":21,"unise\u021Bi":5,"uni\u0219i":5,"unit":1,"unitu":5,"uni\u021Bi":1,"uracil":2,"usa":0,"via\u021Ba":4,"via\u021B\u0103":4,"vicea":2,"viceaua":18,"vivendi":18,"voxtel":0,"vreo":0,"walkie":0,"watergate":18,"yucca":4,"zadnipru":18,"zg\u00EErcibab\u0103":32,"zoopsia":42,"zoopsii":10},"CE":{"abagiu":21,"abdominalgi":74,"abidjan":5,"abiet":5,"ablact":2,"ablaut":18,"ableg":2,"abrevier":41,"academi":21,"acetaldehi":9,"acetami":9,"acetazolamid":345,"acetonemi":101,"acetonuri":37,"acianopsi":85,"acidamin":25,"aciua":9,"acromatopsi":329,"acroparestezi":1353,"acrostih":9,"acrostol":9,"actinopterigi":298,"adagietto":69,"admonesta":74,"adumbr":2,"aeroas":19,"aeroreac":43,"aerotransport":267,"agnos":1,"agnoz":1,"airbusul":36,"airbusur":36,"ajusta":9,"albaspin":10,"albgard":4,"albinioar":138,"albuminuri":74,"alcoolemi":106,"aldosteron":74,"alohton":5,"alozaur":21,"althorn":4,"altostratus":138,"amaltheus":73,"amblistom":18,"amerindi":41,"amfineur":42,"amfioc\u0219":10,"amfiox":10,"amfiprostil":74,"amiaz":9,"amigdalectomi":1353,"amigdaloid":169,"amigdaloiz":169,"amiloidoz":53,"aminoaci":21,"amiotrof":13,"amnez":1,"amoniuri":21,"amperormetr":82,"amplexiun":82,"anaerob":14,"anafrodiz":38,"anagnos":6,"anagno\u0219":6,"analfab":10,"analgez":10,"anamnez":5,"anarhoindiv":169,"anartri":10,"anastaltic":69,"anastatic":37,"anastigma":70,"anastomotic":165,"anastomoz":37,"anastrof":5,"anchilostom":82,"andrioa":18,"android":18,"androiz":18,"andropauz":82,"androster":18,"aneantiz":21,"anecoid":22,"anecoiz":22,"anemostat":21,"anencefal":42,"anergi":10,"aneroid":21,"anestez":9,"aneur":13,"anevoin\u021B":21,"anexion":21,"anexiun":21,"angeit":10,"angio":10,"aniconic":22,"anion":2,"anionactiv":82,"anistor":10,"anizocitoz":86,"anizogam":22,"anizometro":86,"anizotrop":22,"anoftalm":10,"anonim":6,"anonym":6,"anorex":6,"anorgan":10,"anorhid":10,"anosm":2,"anovar":6,"anoxem":6,"anoxi":6,"antalgic":20,"antanaclaz":44,"antanagog":44,"antapex":4,"antarctic":36,"antarctid":36,"antepenultim":74,"anterozoid":170,"anterozoiz":170,"antiperistal":170,"anti\u0219tiin\u021B":74,"antonim":4,"antozoar":42,"antrectom":40,"antropogeo":338,"antropoid":82,"antropoiz":82,"antroponim":98,"antroponomast":354,"anuit":5,"anuri":6,"anxio":10,"apendicectomi":1321,"apnee":1,"apogiatur":37,"apostat":9,"apostilb":5,"appassionat":146,"apropiat":41,"apropia\u021B":41,"apter":2,"aramaic":21,"arameic":21,"arcuit":10,"arcui\u021B":10,"areal":5,"aresta":9,"arioso":9,"armstrong":4,"arterioscleroz":106,"arthur":2,"artralgi":34,"arzmahzar":36,"ascorbic":17,"asista":9,"aspermat":17,"aspirit":9,"astatiz":9,"astereogno":105,"astigmat":17,"astup":1,"ateroscler":21,"atesta":9,"atestat":9,"athos":1,"atoate\u0219tiut":41,"atotbiruit":169,"atot\u0219tiin\u021B":73,"atot\u0219tiut":73,"auramin":13,"autarhi":5,"autoar":3,"autopsi":21,"autotransform":267,"autotransport":267,"auz":1,"azerbaidjan":73,"azotemi":25,"azoturi":9,"babyschi":10,"babyschilift":10,"bacilemi":50,"background":8,"backhand":8,"bacteriostaz":212,"bacteriuri":84,"bancnot":8,"bancru":8,"bangkok":8,"bangladeshian":1188,"bangladeshien":1188,"bankcoop":8,"batho":2,"bathor":2,"batiscaf":10,"beethoven":36,"benchmark":16,"bergman":8,"bernstein":8,"bern\u0219tain":8,"berthelot":32,"bethleem":8,"bicf\u0103l\u0103u":20,"bielorus":20,"bie\u0219t":2,"biftec":0,"bijghir":4,"bilbor":4,"bilc":0,"bildungsroman":132,"bimba\u0219":0,"bimzui":0,"binder":0,"bindis":0,"binocl":4,"binocular":4,"biospeolog":102,"birj":0,"birlic":0,"birman":0,"birnic":0,"birt":0,"bisanual":44,"biscui":0,"bismut":0,"bistabil":18,"bistri\u021B":0,"bistrou":0,"bisturi":0,"bi\u0219ni\u021B":0,"bitter":0,"biunivoc":22,"blagoslov":20,"blasfemi":40,"blefaroptoz":84,"blochaus":8,"bluejean":8,"blues":8,"bogheadu":68,"boln\u0103vioar":276,"boln\u0103vior":148,"botswan":8,"bradipsih":20,"brahistocron":20,"bridgetown":32,"briefing":8,"buchenwald":34,"buciard":34,"buenos":4,"bujie":10,"bun\u0103star":10,"bun\u0103st\u0103r":10,"calcemi":20,"calcutti":20,"campioan":20,"campion":20,"canioan":34,"canion":18,"caniot":18,"carboxi":8,"carmaniol":148,"cartnic":8,"castaniet":148,"catamnez":20,"catharsi":34,"cation":4,"cauciuc":6,"caudill":20,"cauz":2,"cauzalgi":10,"c\u0103t\u0103nioar":138,"cefalalgi":18,"cehoslovac":74,"celostat":10,"cenestezi":84,"centrafrica":304,"centramerica":688,"cerargi":20,"cerargirit":4,"cercospor":20,"cerebrospin":74,"cerithium":74,"cernoziom":148,"cetonuri":18,"cetosteroi":10,"charleston":64,"cheflii":8,"chefliu":8,"chimion":20,"chinaldin":8,"chinestezi":168,"chintesen":48,"ciacal":4,"ciachi":4,"ciac\u00EEi":4,"ciacl":4,"ciacon":4,"ciad":4,"cianamid":26,"ciancobalamin":298,"ciclostom":18,"cilindruri":146,"cincisprezec":272,"cincisut":16,"cincizeci":16,"cinorex":12,"cinquecent":36,"cirenaic":42,"cirostrat":10,"cisalpin":20,"cisiordan":44,"cisiord\u0103n":44,"citodiagnostic":1130,"c\u00EErcserdar":8,"clarobscur":40,"claustrofob":4,"climostat":20,"cloramin":24,"cloretan":24,"cloreton":24,"cloroanemi":180,"cloroleucit":212,"cnocaut":8,"coaliz":2,"coapta\u021Bi":2,"cobalamin":18,"cockpit":8,"cocktail":8,"cocost\u00EErc":10,"codalb":4,"cod\u0103lb":4,"codro\u0219":4,"coexista":38,"colalgol":20,"colargol":4,"colemi":12,"colenchim":20,"coleopter":26,"coleoptil":26,"colerez":12,"colester":10,"colinerg":10,"colinergic":18,"colinesteraz":18,"colivioar":138,"comintern":4,"companioan":276,"companion":148,"conakry":10,"condolean":84,"confetti":36,"congestion":164,"coniac":18,"contesta":36,"contracc":4,"contract":4,"contrac\u021B":4,"contradic":36,"contragreut":292,"contraindic":164,"contrainform":164,"contralto":68,"contrapiuli\u021B":420,"contrarier":164,"contrascot":36,"contraspion":292,"contrast":4,"contravenien":676,"contraven\u021B":36,"conurba\u021Bi":20,"copiatoar":10,"copiator":10,"coproscleroz":274,"coprostaz":18,"coprosterol":146,"copywriter":10,"cor\u0103biel":74,"cor\u0103biil":106,"corectopi":20,"coreic":10,"corticosteron":596,"costalgi":8,"co\u0219averaj":44,"coxalgi":4,"crear":4,"creat":4,"crea\u021Bi":4,"creekul":8,"creekuri":8,"crestat":8,"criosco":12,"criostat":12,"criptonim":16,"criptorhidi":80,"criselefan":88,"croat":4,"croa\u021B":4,"cromafin":24,"cromatopsi":164,"cromopsi":40,"cronaxi":24,"crossbar":16,"crossing":16,"cuest":8,"cui\u0219ori\u021B":6,"cumulostratus":42,"cuneiform":26,"cuproxi":8,"curiepunct":18,"curieterap":18,"dayac":2,"deaferent":22,"deambula":42,"decalcifier":338,"decarboxil":34,"decaster":10,"decastil":10,"decister":10,"deck":2,"decofeiniz":106,"deflexiun":82,"deflui":18,"defraud":18,"degusta":18,"deific":6,"dejurstv":66,"deleatur":26,"delfinar":20,"delineavit":106,"delni\u021B":20,"deltaic":20,"deltaplan":20,"demachia":74,"demiurg":10,"dendrar":4,"dendrograf":36,"dendrometr":36,"densigram":20,"densimetr":20,"densu\u0219":0,"dent":0,"denti\u021B":4,"denuclear":74,"deoch":6,"deodor":6,"deontolog":42,"deoseb":6,"depeiz":10,"depista":18,"depresiometr":210,"deproteiniz":210,"dermatalgi":36,"dermatograf":84,"dermatonevroz":340,"dermograf":20,"dermotrop":20,"dern":0,"dersc":0,"der\u0219id":0,"desa":2,"des\u0103":2,"desc":0,"desc\u0103z":2,"descongestion":1316,"descrier":34,"descrip":2,"descuia":20,"descuie":20,"dese":2,"desf":0,"desf\u0103tui":82,"desh":0,"desi":0,"desktop":8,"desl":0,"desm":0,"desn\u0103\u021Bu":0,"deso":0,"desp":0,"despecetlui":596,"despera\u021B":18,"despintec":34,"despr\u0103fui":164,"despreun":36,"dest":0,"destabiliz":82,"destaliniz":82,"dest\u0103inuir":164,"dest\u0103inuit":164,"dest\u0103inui\u021B":164,"destituir":84,"destituit":84,"destitui\u021B":84,"destructur":66,"destrun":2,"desu":0,"desz":0,"detesta":18,"deutschland":64,"devasta":18,"devier":10,"dezabon":12,"dezabur":12,"dezabuz":12,"dezacord":12,"dezactiv":20,"dezadapt":12,"dezaer":4,"dezafect":12,"dezaglomer":76,"dezagreabil":204,"dezagreg":12,"dezagremen":76,"dezalcool":84,"dezam\u0103g":12,"dezambal":20,"dezambiguiz":340,"dezambrei":20,"dezamin":12,"dezamors":12,"dezancol":20,"dezangaj":20,"dezaprob":12,"dezarm":4,"dezarticul":84,"dezasambl":12,"dezasfalt":20,"dezasimil":44,"dezastr":2,"dezavantaj":76,"dezavu":12,"dezavua":44,"dezax":4,"dezdoi":20,"dezechilibr":332,"dezechip":12,"dezemulsion":332,"dezert":2,"dezer\u021B":2,"dezesper":18,"deze\u0219t":0,"dezetatiz":44,"dezexcit":20,"dezghioc":36,"dezic":2,"dezideologiz":364,"dezider":10,"deziluz":12,"dezincrimin":148,"dezincrust":20,"dezinfect":20,"dezinfec\u021B":20,"dezinfest":20,"dezinflam":20,"dezinform":20,"dezinhib":20,"dezinsect":20,"dezinsec\u021B":20,"dezinser\u021B":20,"dezintegr":20,"dezinteres":84,"dezintoxic":84,"dezinvol":18,"dezirabil":42,"dezl\u0103n\u021Bui":164,"dezmierd":68,"dezmierz":68,"dezobi\u0219n":12,"dezobi\u0219nui":332,"dezobstr":20,"dezocup":12,"dezodoriz":44,"dezola":2,"dezol\u0103":2,"dezole":2,"dezol\u00EE":2,"dezongul":20,"dezonoar":12,"dezonor":12,"dezordin":20,"dezordon":20,"dezorganiz":84,"dezorient":44,"dezos":4,"dezoxicorticoster":9516,"dezoxid":12,"dezoxiribonucleic":19116,"dezulei":12,"dezumaniz":44,"dezumfl":4,"dezun":4,"dezv\u0103lui":84,"dezvinui":84,"diabolo":4,"diaftorez":38,"diagno":6,"diastaltic":6,"diastaz":6,"diastem":6,"diastil":6,"diastol":6,"diastolic":6,"diastrof":6,"diavol":4,"dibrometan":34,"dicromatopsi":658,"diesel":4,"dietanolamin":150,"difeniloxi":74,"diftong":2,"dimetilformami":1098,"diploid":18,"diploiz":18,"diplopi":8,"diplur":8,"dipnoi":2,"diptic":2,"disagio":12,"disartri":20,"discountul":132,"discounturi":132,"discromatopsi":1316,"disenteri":20,"disestezi":84,"disneyland":36,"disneyworld":36,"disodia":4,"disodie":4,"disodii":4,"disosmi":4,"dispera":2,"disper\u0103":2,"distih":2,"distil":2,"distom":2,"disuri":4,"diu":2,"dodecastil":42,"doisprezec":68,"donjuanism":20,"dou\u0103sprezecim":650,"dreptunghi":16,"dumbr\u0103vioar":548,"duraci":4,"duralumin":44,"ebuliosco":53,"echiunitar":9,"ecospeci":5,"ecuador":45,"ecuator":5,"electrocaustic":1353,"electrocoagul":841,"electrod":9,"electromiograf":841,"electron":9,"eleuter":13,"elicostat":21,"emistih":5,"enarmoni":10,"endarter":4,"endemi":10,"endosmoz":4,"eneasilab":13,"enoftalm":2,"entamib":4,"enteralg":18,"enteralgi":18,"enterectomi":338,"enteroanastomoz\u0103":362,"entomostrace":42,"enurezis":23,"epidemi":21,"epidemiolog":85,"epigastralgi":37,"episceni":5,"epistat":9,"epistaxis":37,"epistil":5,"epistrof":5,"eponim":2,"ergosterol":74,"eriniil":21,"eritremi":37,"esaveraj":2,"e\u0219antion":41,"etilenoxi":37,"etiop":5,"etnopsiholog":330,"eupnee":3,"eurasia":13,"euroatlantic":283,"eusemi":11,"eustil":3,"eutanas":11,"exacerb":6,"exarh":2,"exc":0,"exf":0,"exhaust":10,"exhaustiun":170,"exiguitat":53,"exilarh":9,"ex\u00EEnscr":10,"exoftalm":10,"exoniroz":22,"exora\u021B":6,"exorbitan":42,"exosmoz":10,"exostoz":10,"exp":0,"expedien":42,"expiabil":26,"expiat":10,"expia\u021B":10,"expier":10,"ext":0,"extenua":42,"extenu\u0103":42,"extenu\u00EE":42,"extract":2,"extrac\u021B":2,"extraneit":82,"extraperitoneal":5458,"extrapleural":402,"exulcera\u021B":42,"exuvia":5,"farniente":68,"faun":6,"faustpatro":82,"feedback":8,"fenacetin":4,"fenilalanin":18,"fenilamin":18,"fiar":4,"fiasco":8,"fie\u0219car":10,"fie\u0219c\u0103r":10,"fiin":2,"fijian":10,"fijien":10,"filmostat":20,"firoscoas":10,"firoscos":10,"firosco\u0219":10,"fitogeosfer":106,"fitosterol":10,"fiul":2,"fizostigmin":10,"f\u00EEnt\u00EEnioar":276,"flancgard":16,"flancg\u0103rz":16,"flashback":16,"flau\u0219":4,"fleuron":12,"fluid":4,"fluiz":4,"foehnu":8,"foiletoan":6,"foileton":6,"folclor":8,"fonoizol":26,"formaldehi":168,"fotocopia":170,"fotocopie":170,"fotodezintegr":330,"fotografie":330,"fototeodol":106,"francmason":80,"frankfurt":16,"franklin":16,"fraud":4,"freetown":8,"f\u00FChrer":4,"fukushim":10,"gagliard":66,"galvanocaustic":1364,"gastralgi":4,"gastrectomi":324,"g\u0103in":2,"gentilom":36,"geoagiu":8,"geogel":4,"geomal":4,"georg":8,"georgic":10,"georocel":20,"georocu":20,"gestapo":2,"gesta\u021Bi":20,"ghiocei":12,"ghiocel":12,"ghionoa":12,"giard":8,"gigantostrac":82,"ginandri":4,"giravi":4,"girostat":10,"glicemi":20,"glicozuri":36,"glucozuri":36,"gnatostom":20,"golaveraj":44,"gostat":2,"grefier":20,"guinee":6,"guineoecuator":886,"gulfstream":8,"gusta":4,"habsburg":8,"haciend":34,"haendel":8,"hagial\u00EEc":18,"haploid":18,"haploiz":18,"hardpan":8,"hauteriv":20,"h\u0103r\u0219ne":8,"h\u0103r\u0219ni":8,"heliosco":26,"heliostat":26,"helmintospor":164,"hemangi":4,"hemaralopi":74,"hemartroz":20,"hematemez":18,"hematuri":18,"hemeostaz":26,"hemeralopi":74,"hemianestez":170,"hemianops":42,"hemodiagnostic":1130,"hemoglobinuri":586,"hemoptizi":10,"hemostaz":10,"heptatlon":8,"heptoda":8,"heptod\u0103":8,"heptode":8,"hermafrodi":24,"hesperornis":164,"heteronim":18,"hexametilentetramin":17578,"hexastih":10,"hexastil":10,"hexod":4,"hiad":2,"hidremi":18,"hidroamel":50,"hidroavi":18,"hidrobio":82,"hidroftalm":34,"hidrogeolog":210,"hidroizol":50,"hidroizopiez":690,"hidrometeor":338,"hidroscal":18,"hidroteh":18,"hidroxilamin":152,"higrostat":18,"hioid":6,"hiperboloid":338,"hiperboloiz":338,"hipericac":34,"hipericin":34,"hiperide":42,"hiperion":42,"hiperon":2,"hiperparatiroid":5458,"hipertiroid":338,"hipiatri":12,"hipocaustic":170,"hipocentaur":330,"hipocicloid":298,"hiporchem":18,"hipotiroid":170,"hipuric":12,"histerectom":164,"histerezis":84,"histerotom":340,"holdup":8,"iconostas":21,"iconostro":21,"ideal":5,"idiostil":13,"ignar":1,"ignor":1,"imbrogliou":274,"imprescrip":18,"inabil":6,"inabordabil":166,"inacceptabil":330,"inaccesibil":170,"inacomodabil":342,"inacordabil":166,"inact":2,"inac\u021B":2,"inadaptabil":166,"inadecv":6,"inaderen":22,"inadmisibil":170,"inadverten":74,"inalien":22,"inalterabil":170,"inamic":6,"inamovibil":86,"inanim":6,"inani\u021B":6,"inapeten":22,"inaplic":6,"inaprec":6,"inapt":2,"inap\u021B":2,"inatacabil":86,"inaugur":10,"inavuabil":54,"inc":0,"incendia":82,"incoativ":26,"incrusta":34,"ind":0,"indescrip":10,"indestruc":10,"indian":10,"indien":10,"indru\u0219aim":82,"industrios":146,"inechit":6,"inecua\u021B":22,"inedit":6,"inedi\u021B":6,"inefabil":22,"inefic":6,"inegal":6,"inelegan":22,"ineligibil":86,"ineluctabil":166,"inepuizabil":166,"inestetic":42,"inestimabil":170,"inevitabil":86,"inexac":6,"inexigibil":86,"inexisten":38,"inexperien\u021B":170,"inexperiment":170,"inexpiabil":106,"inexplicabil":330,"inexploatabil":650,"inexplor":10,"inexplozibil":330,"inexpresiv":74,"inexprimabil":330,"inexpugnabil":330,"inextensibil":330,"inextingibil":330,"inextirpabil":330,"inextricabil":330,"inf":0,"infailibil":90,"infatua":42,"infectocontagio":10834,"infesta":18,"inflexiun":82,"infract":0,"infrac\u021B":0,"ing":0,"ingenui":42,"ingredien":82,"inimaginabil":342,"inimici\u021B":22,"inimitabil":86,"inintelig":42,"injur":2,"innsburck":8,"inobservabil":330,"inocuit":20,"inodor":6,"inofensiv":38,"inoperan":22,"inopin":6,"inoportun":38,"inopozabil":86,"inorganic":42,"inospitalier":170,"inoxidabil":86,"ins":0,"insa\u021Biabil":106,"insa\u021Biet":42,"insidio":42,"insinua":42,"insista":18,"insocia":10,"insomniac":82,"instantaneit":674,"instaur":18,"instinctual":322,"institui":82,"instrui":34,"insubordon":82,"insuf":2,"int":0,"interactiv":82,"interac\u021B":18,"interalia":178,"interastral":82,"interatomic":178,"interconexiun":1362,"interesan":42,"interesar":42,"interglac":18,"interimar":42,"interimat":42,"interinstitu\u021Bional":27218,"interio":42,"interliniar":338,"intermediar":338,"intermin":18,"internau":82,"interoccidental":2386,"interoceanic":306,"interoceptor":298,"interocular":178,"interoga":10,"interoperabil":690,"interpre":18,"interpunctua\u021B":1298,"interregional":850,"intersexual":338,"interuman":50,"interurban":82,"interven":18,"interviev":82,"intradermoreac\u021B":2706,"intransigen":34,"intranzitiv":162,"intrarahidian":1362,"intrarahidien":1362,"intraspecific":658,"intra\u0219colar":146,"intraurban":82,"intrauterin":178,"introspec":18,"intui":10,"inuman":6,"inund":2,"inundene":9,"inundeni":9,"inutil":6,"inuzit":6,"inv":0,"invidia":42,"invidie":42,"invidio":42,"iodopsin":10,"ipostaz":5,"ireal":5,"irespirabil":5,"ischemi":18,"iudeospan":26,"iugoslav":10,"izanomal":22,"izoalcan":21,"izoamplitudin":661,"izoanabaz":45,"izoanaliz":45,"izogeoterm":21,"izohiet":21,"izold":1,"izospin":5,"izospor":5,"izostaz":5,"izoster":5,"\u00EEmpreun":18,"\u00EEnaint":5,"\u00EEnaltprea":16,"\u00EEnaltpreasfin":272,"\u00EEnaltpreasf\u00EEn":272,"\u00EEnamor":6,"\u00EEnapoi":6,"\u00EEnarip":6,"\u00EEnarm":2,"\u00EEnaur":6,"\u00EEnavu\u021B":6,"\u00EEn\u0103cr":2,"\u00EEn\u0103lb":2,"\u00EEn\u0103sp":2,"\u00EEncuviin\u021B":42,"\u00EEndoi":10,"\u00EEnf\u0103ptui":82,"\u00EEnfeu":10,"\u00EEnfieri":10,"\u00EEnfietoar":26,"\u00EEnfietor":26,"\u00EEnfiin\u021B":10,"\u00EEnfiol":10,"\u00EEnfior":10,"\u00EEng\u0103duim":42,"\u00EEng\u0103duis":42,"\u00EEng\u0103duit":42,"\u00EEng\u0103dui\u021B":42,"\u00EEngreun":18,"\u00EEniep":2,"\u00EEnier":2,"\u00EEnlocui":42,"\u00EEnnoi":10,"\u00EEnrour":10,"\u00EEns\u0103il":10,"\u00EEnstr\u0103in":34,"\u00EEn\u0219tiin\u021B":18,"\u00EEntraur":18,"\u00EEntrebuin\u021B":82,"\u00EEntrista":34,"\u00EEnv\u0103luim":42,"\u00EEnv\u0103luis":42,"\u00EEnv\u0103luit":42,"\u00EEnv\u0103lui\u021B":42,"\u00EEnvie":10,"jackpot":8,"jackson":8,"jainism":6,"jainist":6,"jaini\u0219t":6,"jian":2,"jianc":2,"jien":2,"jieneasc":6,"jiene\u0219t":6,"kenyan":10,"kenyen":10,"ketchup":2,"kieselgur":36,"kieserit":20,"kilojoul":74,"kilovoltamper":650,"knockdown":16,"knockout":16,"labirintodon":138,"lactalbumin":168,"lacticemi":84,"lagoftalmi":20,"lagostom":10,"laminectomi":338,"landgraf":8,"l\u00E4ndler":8,"landlor":8,"landsm\u00E5l":16,"land\u0219aft":8,"landtag":8,"laringectomi":658,"laud":2,"laudanum":20,"laur":2,"laurea":22,"layoutul":36,"layoutur":36,"lenevioar":138,"lenevior":74,"leptospir":20,"leptospiroz":148,"lesothian":74,"lesothien":74,"leucemi":22,"leucin":6,"leuco":2,"leul":2,"leurd":2,"leu\u0219or":2,"liechtenstein":144,"lied":4,"limfadeni":24,"limfangit":40,"lingual":4,"linoleic":42,"lipemi":12,"lipidemi":50,"lipiodol":12,"lista":4,"litarg":4,"lombalg":8,"lombalgi":8,"lombartroz":40,"lombosciatic":404,"lorniet":36,"lornioan":68,"lornion":36,"luminoschem":42,"lungmetraj":40,"luthul":2,"luthur":2,"mafiot":10,"mafio\u021B":10,"magazioner":74,"magnanim":24,"malacostracee":554,"maladres":12,"malaguen":74,"malague\u00F1":74,"mallorc":2,"malonest":12,"malone\u0219t":12,"malonilure":74,"manifesta":74,"manoper":12,"manuscri":10,"mariachi":18,"mar\u0219rut":8,"matostat":18,"m\u0103duvioar":138,"m\u0103rinim":12,"medulotransfuz":1066,"megohm":4,"melanemi":50,"melanuri":18,"meningeal":82,"metacril":12,"metalazbest":82,"metaldehid":84,"metaloi":42,"metateor":42,"metazoar":42,"metencef":20,"meteo":10,"metiloranj":50,"metonim":12,"metonomasi":44,"mezalian":44,"mezencef":20,"mezenchim":20,"mezenter":20,"mezoscaf":10,"miar\u021B":8,"miaun":4,"miaut":4,"miaz":4,"micosterol":74,"microcircuit":658,"microfaun":82,"micrometeo":338,"micronucleu":594,"micropsi":2,"microsioan":82,"microsociolog":850,"microzoar":82,"miedu":4,"miei":4,"miel\u0103r":4,"mielu":4,"miercur":8,"miere":4,"mieri":4,"mierla":8,"mierle":8,"mierli":8,"mierloi":8,"miero":4,"mier\u021B":8,"mieun":4,"miez":4,"mignon":2,"milieu":18,"minion":18,"miniscaf":10,"miop":2,"miorit":6,"miori\u021B":6,"misandri":4,"mithrais":34,"mixedem":12,"mizanscen":20,"mizantrop":20,"m\u00EEn\u0103\u0219terg":10,"moldagro":24,"moldaudit":56,"moldavia":24,"moldcell":8,"moldclas":8,"moldclima":8,"moldcoop":8,"moldcredit":72,"moldelectro":152,"moldgaz":8,"moldloto":40,"moldovagaz":84,"moldovalah":84,"moldovan":20,"moldovean":20,"moldoveneasc":84,"moldovenesc":84,"moldovene\u0219t":84,"moldoveni":20,"moldovenism":84,"moldoveniz":84,"moldplast":8,"moldpres":8,"moldrom":8,"moldsind":8,"moldtelecom":168,"molesta":18,"monoclu":12,"monocular":44,"monoideism":90,"mononuclear":298,"mononucleoz":298,"monoteis":42,"monoxid":12,"monoxil":12,"monoxiz":12,"monsenior":148,"montimorilloni":88,"montmorillonit":8,"mucalitl\u00EEc":74,"multianual":180,"multimil":20,"multiubit":40,"multiubi\u021B":40,"multstima":72,"naftilamin":36,"namiaz":18,"n\u0103miaz":18,"neab\u0103tu":22,"neacademic":86,"neadecva":38,"neademeni":86,"neaderen":22,"neadev\u0103r":22,"neadormi":38,"neafilia":86,"neagresiun":166,"neajunger":38,"neajuns":6,"neajutora":86,"nealinia":86,"nealinier":86,"neamestec":38,"neanalizabil":342,"neangaja":42,"neant":2,"neap\u0103ra":22,"nearanja":38,"nearticula":170,"neascult":10,"neasem\u0103na":86,"neasemui":86,"neasimila":86,"neast\u00EEmp\u0103r":74,"nea\u0219tept":10,"neaten":6,"neatest":6,"neatin":6,"neat\u00EErn":6,"neautoriz":46,"neauzi":14,"neaveni":22,"neaver":6,"neaviz":6,"neb\u0103nui":42,"nebirui":42,"neb\u00EEntui":82,"nechibzui":162,"necontestat":146,"necropsi":34,"nec\u0219":0,"nec\u0219e\u0219t":0,"nectar":4,"nectariil":84,"nectic":4,"necton":4,"necuviinc":42,"necuviin\u021B":42,"neeuclidian":334,"neeuclidien":334,"nefiin\u021B":10,"nefrectomi":162,"nefroid":18,"nefroscleroz":274,"negociin":42,"negoia\u0219":10,"negoie\u0219t":10,"negoi\u021B":10,"negr\u0103i":18,"negri":2,"negroid":18,"negroiz":18,"neidentific":166,"neimitabil":86,"neimplic":10,"neimportan":74,"neimpozabil":170,"neinflamabil":330,"neinstrui":138,"neinteligibil":682,"neinten\u021Bion":330,"neinterven\u021B":74,"neispr\u0103vi":74,"neistovi":42,"neitzsche":16,"neizb\u00EEn":10,"neizbuti":42,"ne\u00EEmprejmui":650,"ne\u00EEnchipui":330,"ne\u00EEng\u0103duit":170,"ne\u00EEnt\u00EErzia":330,"nejlovel":20,"nelegiui":74,"nemiluit":42,"nemilui\u021B":42,"nem\u00EEng\u00EEia":82,"nem\u0219":0,"nem\u021B":4,"nem\u021Bi\u0219or":20,"nenciu":0,"neo":2,"neoan":6,"neobi\u0219nuin":166,"neoimpresion":662,"neorealis":22,"neor\u00EEndui":166,"neostoi":42,"neozoic":22,"nepildui":82,"nepip\u0103i":42,"nepreten\u021Bio":658,"nepre\u021Bui":82,"nepriinc":18,"neptun":4,"nereid":10,"nereu\u0219i":10,"nermed":0,"nermi\u0219":0,"nervatur":20,"nerva\u021Bi":4,"nervism":4,"nervist":4,"nervi\u0219t":4,"nervos":4,"nervo\u0219":4,"nervozit":20,"nervur":4,"nes\u0103bui":42,"nescafe":20,"neschimb":2,"nescri":2,"nescriptic":66,"nesec\u0103tui":170,"nesf\u00EEr\u0219i":2,"nesminti":34,"nesp\u0103la":18,"nespera":18,"nesportiv":34,"nespus":2,"nespu\u0219":2,"nestabil":18,"nestatornic":146,"nest\u0103p\u00EEni":82,"nest\u0103vili":82,"nestemat":18,"nestima":18,"nestingheri":290,"nestingibil":162,"nestins":2,"nestin\u0219":2,"nestr\u0103b\u0103tu":162,"nestr\u0103muta":162,"nestrica":34,"ne\u0219ters":2,"ne\u0219ter\u0219":2,"ne\u0219tiin\u021B":2,"ne\u0219tir":2,"ne\u0219tirbi":34,"ne\u0219tiut":18,"ne\u0219tiu\u021B":18,"netc":0,"netransport":66,"netrebuinc":82,"ne\u021Bc":0,"neumbla":10,"neunir":6,"neural":6,"neurasten":42,"neurin":22,"neurit":6,"neuri\u021B":6,"neutr":2,"nev\u00EErstnic":66,"nevoit":10,"nevoi\u021B":10,"nevralgi":2,"nevrectomi":162,"newtonian":84,"newtonien":84,"newyorkez":4,"nezdruncina":322,"nicaraguan":170,"nicotinamid":202,"nietzsche":16,"nimbostrat":20,"noctambul":40,"nomarh":4,"nonagenar":42,"noneul":4,"nonexisten":76,"nonius":10,"nonval":4,"nonviol":4,"noradrenalin":332,"nostalgi":4,"nou\u0103sprezec":138,"nuclear":18,"nurnberg":8,"obielu\u021B":9,"oblong":2,"obova":2,"obstrua":34,"obtuzunghi":18,"odontalgi":17,"oenolog":2,"oiconim":4,"oiconimi":4,"oligantrop":41,"oligarh":9,"oligocitemi":405,"oliguri":9,"ombudsman":34,"omniscien":74,"omonim":2,"omorganic":10,"omuci":2,"opiace":5,"optzeci":4,"orica":4,"oric\u0103":4,"oric\u00EEt":4,"oric\u00EE\u021Bi":4,"or\u00EEnduit":41,"oronime":6,"oronimi":6,"ortodiasco":106,"ortodon\u021B":4,"ortoptic":4,"osmiridiu":4,"ostatic":10,"ostealgi":10,"ostreicultur":50,"otalgi":2,"otalgia":2,"otalgie":2,"otalgii":2,"ovalbumin":2,"oviscapt":5,"paisprezec":68,"paleo":10,"paleoantropolog":2650,"paleoarheolog":602,"paleogeofizic":730,"paleogeograf":218,"paleoslav":26,"paleozoic":90,"panaet":10,"panafrican":76,"panahid":10,"panail":10,"panain":10,"panaiot":10,"panait":10,"panai\u021B":10,"panamerican":172,"panamez":10,"panarab":12,"panatenaic":172,"panatenee":44,"pancreas":36,"pancreat":36,"pandemi":20,"panegir":10,"panelenic":44,"panelenism":44,"paneurop":28,"panicard":10,"panicarz":10,"panific":10,"panislam":20,"panoftalm":20,"panopli":2,"panoptic":20,"panoram":10,"panortodox":84,"pansexual":84,"panslav":4,"panteon":20,"pantoptoz":20,"panunional":108,"paraacetaldehid":2714,"paraaminobenzoic":10586,"parabol":10,"paraboloid":170,"paraboloiz":170,"paraclinic":74,"paracronism":74,"paradigm":10,"paradiziac":170,"paradox":10,"parafazi":44,"parafinar":170,"parafin\u0103r":170,"paraformaldehid":2698,"parafraz":10,"parafulger":74,"paralelipiped":682,"paralelipipedic":2730,"paralelism":42,"paraleliz":42,"paralelogram":170,"paralitic":42,"paraliz":42,"paramagnet":74,"paramedic":42,"parametr":10,"paramilitar":170,"paramnez":12,"paranghel":18,"paranoi":10,"paranormal":74,"parantez":18,"parapant":10,"parapleg":10,"parapsiholog":330,"parasc\u00EEnt":10,"parascoven":82,"parasolar":42,"parastas":18,"para\u0219ut":10,"paratiroidectom":2730,"paratr\u0103snet":138,"paravalan\u0219":44,"paravertebral":330,"parav\u00EEnt":10,"paraxial":44,"paraz\u0103pad":42,"paraz\u0103pez":42,"parazit":10,"parazi\u021B":10,"parb":0,"parc":0,"pard":0,"parental":18,"parenteral":84,"parestez":20,"parf":0,"parh":0,"parior":10,"paritat":10,"parit\u0103\u021B":10,"parizer":10,"parizian":42,"parizien":42,"par\u00EEm":2,"parkin":4,"parl":0,"parm":0,"parn":0,"parodia":42,"parodie":42,"parodii":42,"parodist":10,"parodi\u0219t":10,"parodontoz":76,"parodon\u021B":12,"parohial":42,"paronim":12,"paronomas":44,"paronomaz":44,"parorexi":44,"parosmi":20,"parotidectom":330,"paroxism":10,"paroxist":10,"paroxiton":44,"pars":0,"par\u0219":0,"part":0,"par\u021B":0,"parv":0,"pa\u0219opti":4,"patognom":10,"pauz":2,"pazvantogl":68,"p\u0103str\u0103vior":292,"pedigriu":74,"peisag":2,"peisaj":2,"penaltiu":82,"peninsul":20,"pentacord":20,"pentadactil":148,"pentaedr":52,"pentagoan":20,"pentagon":20,"pentagram":20,"pentametr":20,"pentaoxi":52,"pentasilabic":340,"pentatloan":24,"pentatlon":24,"pentatonic":84,"pentavalen":84,"pentazol":20,"pentod":8,"penultim":20,"penumbr":4,"peraci":4,"perestroi":10,"peristalti":10,"peristil":10,"perminvar":40,"perora\u021B":4,"peroxi":12,"persista":36,"petersburg":34,"petroas":2,"petrochimi":146,"petrodolar":82,"petrodurosco":338,"petroglif":18,"petrograf":18,"petrolatum":82,"petrolier":82,"petrolifer":82,"petrolist":18,"petroli\u0219t":18,"petrolog":18,"petroman":18,"petromax":18,"petrosin":18,"petro\u0219an":18,"petro\u0219en":18,"petro\u0219ic":18,"petrovc":2,"phoenic\u0219":8,"phoenix":8,"pianoforte":148,"pickhammer":8,"picnostil":20,"pio":2,"piroscaf":10,"pirostat":10,"pitecantrop":18,"pi\u021B\u00EEmp\u0103r\u0103tu\u0219":4,"piuri":2,"placodon":24,"plagiostom":20,"plagistom":20,"planorbis":8,"player":4,"pleuropneumon":812,"pleurosco":44,"pluviosco":52,"pneumolog":44,"pneumon":12,"polemarh":18,"policitemi":74,"polimetacril":202,"polinca\u0219":18,"polinuclear":298,"polinucleoz":298,"polipier":42,"poliploid":74,"poliploiz":74,"polipnee":0,"poliptic":0,"politeism":42,"politeist":42,"politei\u0219t":42,"poli\u021Bmaistr":18,"poli\u021Bmai\u0219tr":18,"pompierist":52,"portabil":20,"portaltoi":40,"portan\u021B":0,"portarm":8,"portativ":20,"portavi":24,"portavoce":84,"port\u0103":4,"portland":8,"portocal":20,"portochelar":152,"portofel":20,"portofol":20,"portorican":84,"portpagin":40,"portperi":40,"portretar":36,"portretist":36,"portreti\u0219t":36,"portretiz":36,"portschi":8,"portuar":20,"portughej":20,"portughez":20,"portulac":20,"portulan":20,"portunealt":24,"portunelt":24,"postament":20,"postaprinder":280,"post\u0103v":4,"post\u0103vioar":276,"post\u0103vior":148,"postdiluv":40,"postelectoral":664,"postelnic":36,"posteminesc":88,"posterio":84,"posteritat":84,"posterit\u0103\u021B":84,"posteroinferio":5460,"posteroling":84,"postglaciar":328,"postilion":84,"posti\u0219":4,"post\u00EEr":4,"post\u00EErnac":36,"postliceal":168,"postmeridian":680,"postmeridien":680,"postolach":20,"postolic":20,"postoperator":344,"postoronc":20,"postprandial":648,"postrevolu\u021Bionar":6824,"postscenium":328,"postscript":8,"posttraumatic":712,"postulant":20,"postulan\u021B":20,"postulat":20,"postula\u021B":20,"postumit":20,"postuniversitar":2648,"pravoslav":20,"preabataj":44,"preader":12,"preadolescen":300,"preajb":0,"prealabil":44,"preambal":20,"preambul":20,"preamplific":148,"preaprind":12,"preasfin\u021B":8,"preasf\u00EEnt":8,"preasl\u0103vi":8,"preasn":0,"preastima":8,"preastr\u0103luc":136,"predmet":8,"prefeudal":52,"prefixoid":84,"pregnant":8,"pregnan\u021B":8,"preinfarct":20,"preistor":20,"pre\u00EEnnoir":84,"prejb":0,"prejm":0,"prejmer":0,"prejmet":8,"prejn":0,"pren\u021B":0,"preschimb":4,"prescri":4,"prescurt":4,"presetup":8,"presgarnitur":328,"presnei":0,"presostat":20,"prespapier":40,"presp\u0103la":36,"pres\u0219pan":8,"prestan\u021B":8,"prestatal":36,"prestidigit":168,"prestigi":40,"prestigioas":168,"prestigios":168,"prestigio\u0219":168,"prestissimo":328,"prestoul":40,"pre\u0219colar":36,"pre\u0219tiin\u021B":36,"pretc":0,"pretcar":8,"preten\u021Biozit":420,"pre\u021Biozit":52,"pre\u021Buir":20,"pre\u021Buit":20,"pre\u021Bui\u021B":20,"preuniversitar":1324,"preute\u0219t":12,"prezbit":8,"prezbi\u021B":8,"primoinfec":84,"proamerican":172,"prodigioas":84,"prodigios":84,"prodigio\u0219":84,"prognat":4,"progna\u021B":4,"prognostic":68,"prognoz":4,"proistos":20,"proisto\u0219":20,"promiscuit":164,"prompt":0,"prompter":16,"prontozil":40,"propionic":56,"propov\u0103duir":340,"propov\u0103duit":340,"propov\u0103dui\u021B":340,"proptar":8,"proptir":8,"proptit":8,"proscenium":164,"proscomid":40,"proscri":4,"proscuren":40,"prosl\u0103v":0,"prosp\u0103tur":40,"prospectar":72,"prospect\u0103r":72,"prospectiv":72,"prospectoar":72,"prospector":72,"prospec\u021B":8,"prosperar":40,"prosper\u0103r":40,"prosperit":40,"prospe\u021B":8,"prostatic":40,"prostatit":40,"prost\u0103l":8,"prost\u0103n":8,"prosteasc":0,"prosterna":72,"prostern\u0103":72,"prosterne":72,"prostern\u00EE":72,"prostesc":0,"proste\u0219t":0,"prosticel":8,"prostil":4,"prostir":8,"prostitua":168,"prostitu\u021B":40,"prostolan":40,"prostovan":40,"prostovoal":40,"prostovol":40,"prostra\u021B":8,"prostule\u021B":40,"prostu\u021B":8,"pro\u0219tean":8,"protactin":8,"protamin":24,"protargol":40,"proteguir":84,"proteic":20,"proteid":20,"protein":20,"proterozoic":340,"protopopiat":340,"protoxid":24,"protoxiz":24,"protozoar":84,"proudhonis":72,"prozaic":20,"prozaism":20,"prozaur":20,"pruncucider":176,"pruncuciga\u0219":176,"pseudartroz":84,"pseudocrea\u021B":300,"pseudonim":20,"pseudo\u0219tiin\u021B":300,"psihanal":24,"psihasten":40,"psihedelic":88,"psihiatr":20,"psihism":4,"pteranodon":40,"punctaveraj":176,"punctbal":16,"quaestor":16,"quetzal":4,"radiogeolog":218,"rahialgi":10,"rahianestezi":682,"r\u0103s\u00EEn\u021Beleg":84,"reab":2,"reaboi":4,"reac":2,"read":2,"reaf":2,"reag":2,"reaj":2,"real":2,"ream":2,"rean":2,"reap":2,"rear":2,"reas":2,"rea\u0219":2,"reat":2,"reaud":2,"rebeliun":42,"reconstituan":658,"reconstituir":658,"reconstituit":658,"reconstitui\u021B":658,"reconstruir":274,"reconstruit":274,"reconstrui\u021B":274,"recopier":42,"recrea":18,"rectal":4,"rectan":4,"recti":4,"recto":4,"rectric":4,"rec\u021Biun":20,"recviem":20,"redhib":4,"region":10,"regiun":10,"reichstag":32,"reific":6,"reim":2,"rein":2,"reinstaur":74,"reiter":6,"re\u00EEm":2,"re\u00EEnfiin\u021B":42,"re\u00EEnnoi":42,"re\u00EEnvie":42,"religio":42,"remful":4,"renciu":4,"renciul":4,"rendzin":4,"renghet":0,"renghi":0,"renghiu":4,"renglot":4,"rent":0,"ren\u021B":0,"reob":2,"reoc":2,"reof":2,"reol":2,"reom":2,"reor":2,"reosp\u0103l":6,"reostat":6,"reostric\u021B":6,"repaus":10,"repauz":10,"reptil":4,"resciziun":82,"rescr":2,"respect":4,"respec\u021B":4,"resping":4,"respirabil":84,"respirare":20,"respiratoar":84,"respirator":84,"respira\u021B":20,"respir\u0103ri":20,"respiro":20,"responsabil":164,"restabil":18,"restant":4,"restan\u021B":4,"restatornic":146,"restaur":20,"restitui":20,"restituir":84,"restituit":84,"restitui\u021B":84,"restitut":20,"restitu\u021B":20,"restrictiv":68,"restric\u021B":4,"restringen":68,"restri\u0219t":4,"restr\u00EEng":2,"restructur":66,"re\u0219tean":0,"retr\u0103i":18,"reumat":6,"reump":2,"reun":2,"reu\u0219":2,"reutil":6,"revizui":42,"revuist":10,"revui\u0219t":10,"rezbelnic":36,"rezista":18,"rezmuve":4,"rezn":0,"richard":2,"rickettsioz":290,"riesling":8,"riksmal":8,"riksm\u00E5l":8,"rinalgi":4,"rinencefal":84,"riposta":18,"rodanhidric":84,"roentgen":16,"romaer":4,"romauto":4,"romelectr":4,"romenerg":4,"romeuro":4,"romexim":20,"romexpert":4,"romexpres":4,"rominter":4,"rominvest":4,"rontgen":8,"r\u00F6ntgen":8,"roosvelt":8,"ro\u0219iorean":10,"ro\u0219ioren":10,"roviniet":74,"rozalb":4,"rusaliil":42,"rutherfor":34,"salicilamid":74,"salifier":42,"salvconduct":8,"salvgard":8,"samizdat":4,"sangvin":8,"santiago":40,"sarcosporidioz":2708,"saun":2,"sauvignon":20,"schizoid":40,"schizoiz":40,"scintiscanograf":1320,"scleroftalm":80,"scopolamin":100,"scorpion":40,"scurtcircuit":656,"seguidill":82,"selenostat":42,"selfactoar":8,"selfactor":8,"selfinduc":40,"semiauxil":58,"semifeudal":106,"semifluid":74,"semifluiz":74,"seminc":2,"semin\u021B":2,"septicemi":84,"sequoi":18,"seraschier":274,"serodiagnostic":1130,"serumalbumin":338,"setaveraj":44,"sfincteralg":144,"sfincteralgi":144,"sfincterectomi":2704,"shakespear":16,"shetland":8,"siderostat":42,"siemen":4,"signor":2,"siloxi":4,"simpatectomi":676,"sinantrop":4,"sinarhi":4,"sinarmonism":84,"sinartroz":4,"sinestezi":84,"sinonim":4,"sinoptic":20,"sinuci":12,"sista":4,"situa\u021B":10,"slavoslov":20,"somnambul":40,"splanhnoptoz":144,"splenectomi":336,"spondaic":40,"sportsman":32,"sportsmen":32,"stanislav":20,"steeplechas":72,"stercoremi":168,"sticksu":16,"stockholm":16,"stomalgi":8,"stratostat":40,"subacvatic":84,"subaliment":44,"subalpin":20,"subaltern":20,"subansambl":20,"subaprec":12,"subarb":4,"subaren":12,"subarmon":20,"subatom":12,"subc":0,"subd":0,"subdialect":52,"subecuator":104,"subestim":20,"subetaj":4,"subeval":12,"subexp":4,"subfilial":84,"subiacen":10,"subicter":20,"subiec":0,"subinginer":84,"subintitul":84,"sub\u00EEm":4,"sub\u00EEn":4,"sublima\u021Bi":18,"subliminal":82,"sublin":4,"sublocatar":84,"sublocoten":84,"sublunar":20,"submedian":84,"submediocr":84,"subofi\u021Ber":44,"suborbit":20,"subord":4,"subr\u0103ci":4,"subredac":20,"subregn":4,"subrog":4,"subs":0,"subsidiar":84,"substitui":164,"sub\u021B":0,"subuman":12,"subunit":12,"suburb":4,"subv":0,"subzista":36,"suicid":2,"sulfamid":24,"sulfhidric":40,"supercampioan":658,"supercampion":658,"superfluit":146,"superiorit":106,"suplean":18,"suprareal":82,"sveatoslav":40,"\u0219aisprezec":68,"\u0219aptesprezec":276,"\u0219lefuitoar":20,"\u0219lefuitor":20,"\u0219tiin\u021B":4,"tabietli":42,"tabloid":18,"tahipnee":10,"talc\u0219ist":8,"tapioc":10,"tasta":4,"taur":2,"taylor":4,"t\u0103bluit":18,"telalgi":4,"telecineast":170,"telecinea\u0219t":170,"telefotografie":5290,"telegrafie":330,"telencefal":84,"telescaun":74,"teleschiul":138,"teleschiur":138,"tele\u0219t":2,"tenalgi":4,"teo":2,"tereftalic":74,"termionic":56,"termisto":20,"termocoagul":212,"termocopier":340,"termonuclear":596,"testa":4,"testosteron":148,"tiocarbamid\u0103":198,"tiocol":2,"tiroidectomi":682,"tiroxin":12,"toponim":12,"toponomastic":300,"toreutic":10,"toxemi":12,"transcrier":8,"transcrip\u021B":8,"transeurop":112,"transferabil":328,"transilv":8,"transperant":72,"transpira\u021B":72,"tranzac\u021B":16,"treisprezec":136,"trencicot":32,"trepied":20,"trichiaz":36,"tricloretilen":708,"trictrac":0,"trietanolamin":300,"trifoi\u0219t":20,"triftong":4,"trigger":0,"trinc":0,"tripc":0,"tripsin":8,"trip\u0219":0,"triptaz":8,"triptic":8,"triptofan":40,"trisfetit":40,"trisfeti\u021B":40,"trismus":8,"tristabil":36,"tristearin":100,"triste\u021B":8,"tri\u0219ca":8,"tri\u0219c\u0103":8,"tri\u0219cu":8,"tri\u0219te":8,"triunghi":4,"trivium":20,"tularemi":42,"\u021Biitoar":2,"\u021Biitor":2,"\u021Bincvais":8,"ultrareac\u021B":82,"umlaut":18,"unisexua":85,"unsprezec":34,"untdelemn":20,"uremi":4,"uricemi":21,"uruguayan":36,"uruguayen":36,"varor":4,"vasectomi":84,"v\u0103duvioar":138,"veaceslav":20,"velastrai":10,"veselioar":138,"veselior":74,"vicent":2,"vicen\u021B":2,"vicenz":2,"video":10,"viil":2,"vinars":4,"vindiac":8,"viniet":18,"viremi":12,"visceroptoz":84,"vitejie":42,"viul":2,"v\u00EErstat":4,"v\u00EErstnic":16,"vr\u0103biil":20,"vreun":4,"vr\u00EEstat":8,"washington":66,"wehrmacht":8,"welington":34,"western":0,"windsor":8,"witherit":18,"xantopsi":40,"xeroftalmi":20,"yuan":2,"zinnwaldi":8,"zoogeo":22,"zoopaleo":86,"zoopsie":42},"FS":{"aut":1,"bia":2,"biel":2,"bien":2,"bio":2,"cau\u021B":2,"cia":2,"cie":2,"dia":2,"die":2,"dio":2,"fia":2,"gia":2,"gie":2,"guit":2,"gui\u021B":2,"guiz":2,"hiat":2,"hia\u021B":2,"hie":2,"iind":1,"iitor":3,"kia":2,"kie":2,"lia":2,"lie":2,"lio":2,"lua":2,"lue":2,"lu\u00EE":2,"maur":2,"mia":2,"mie":2,"nau\u021B":2,"nia":2,"nie":2,"nio":2,"nua":2,"piad":2,"pial":2,"pian":2,"pien":2,"reo":2,"ria":2,"rie":2,"rio":2,"rium":2,"seis":2,"sia":2,"sie":2,"sion":2,"siun":2,"\u0219ia":2,"\u0219ie":2,"terapeut":42,"terapeu\u021B":42,"tia":2,"tie":2,"\u021Bia":2,"\u021Bie":2,"\u021Biil":2,"\u021Bioas":2,"\u021Bion":2,"\u021Bios":2,"\u021Bio\u0219":2,"\u021Biun":2,"ual":1,"via":2,"vien":2,"viet":2,"vio":2,"xia":2,"xie":2,"zia":2,"zie":2,"ziil":2,"zio":2,"ziu":2},"NE":["\u0063\u006F\u0069","\u0063\u006F\u0069\u0075\u006C","\u0063\u006F\u0061\u0069\u0065","\u0063\u006F\u0061\u0069\u0065\u006C\u0065","\u0063\u006F\u0069\u0075\u006C\u0075\u0069","\u0063\u006F\u0061\u0069\u0065\u006C\u006F\u0072","\u0063\u0075\u0072","\u0063\u0075\u0072\u0075\u006C","\u0063\u0075\u0072\u0075\u0072\u0069","\u0063\u0075\u0072\u0075\u0072\u0069\u006C\u0065","\u0063\u0075\u0072\u0075\u006C\u0075\u0069","\u0063\u0075\u0072\u0075\u0072\u0069\u006C\u006F\u0072","\u0066\u0075\u0074","\u0066\u0075\u0074\u0061","\u0066\u0075\u0074\u0065","\u0066\u0075\u021B\u0069","\u0066\u0075\u0074\u0061\u0072\u0065","\u0066\u0075\u0074\u0061\u0062\u0069\u006C","\u0066\u0075\u0074\u0061\u0074","\u0066\u0075\u0074\u0061\u0074\u0075","\u0066\u0075\u0074\u00E2\u006E\u0064","\u0066\u0075\u0074\u00E2\u006E\u0064\u0075","\u0066\u0075\u0074\u0065\u0061\u007A\u0103","\u0066\u0075\u0074\u0061\u021B\u0069","\u0066\u0075\u0074\u0061\u006D","\u0066\u0075\u0074\u0061\u0069","\u0066\u0075\u0074\u0061\u0073\u0065\u006D","\u0066\u0075\u0074\u0061\u0219\u0069","\u0066\u0075\u0074\u0061\u0073\u0065\u0219\u0069","\u0066\u0075\u0074\u0103","\u0066\u0075\u0074\u0061\u0073\u0065","\u0066\u0075\u0074\u0103\u006D","\u0066\u0075\u0074\u0061\u0072\u0103\u006D","\u0066\u0075\u0074\u0061\u0073\u0065\u0072\u0103\u006D","\u0066\u0075\u0074\u0061\u0072\u0103\u021B\u0069","\u0066\u0075\u0074\u0061\u0073\u0065\u0072\u0103\u021B\u0069","\u0066\u0075\u0074\u0061\u0073\u0065\u021B\u0069","\u0066\u0075\u0074\u0061\u0075","\u0066\u0075\u0074\u0061\u0072\u0103","\u0066\u0075\u0074\u0061\u0073\u0065\u0072\u0103","\u006D\u0075\u0069\u0065","\u006D\u0075\u0069\u0061","\u006D\u0075\u0069","\u006D\u0075\u0069\u006C\u0065","\u006D\u0075\u0069","\u006D\u0075\u0069\u0069","\u006D\u0075\u0069","\u006D\u0075\u0069\u006C\u006F\u0072","\u0070\u0075\u006C\u0061","\u0070\u0075\u006C\u0065","\u0070\u0075\u006C\u0065\u006C\u006F\u0072","\u0070\u0075\u006C\u0103","\u0070\u0075\u006C\u006F\u0073"]};

    //

    let prep = function ( d )
    {
        if( d === undefined ) return undefined;

        let lmin = Number.MAX_VALUE;
        let lmax = 0;
        for( let c in d )
        {
            if( lmin > c.length ) lmin = c.length;
            if( lmax < c.length ) lmax = c.length;
        }

        return { D: d, LMin: lmin, LMax: lmax };
    }


    Impl.Date =
    {
        PC: prep( Impl.Dictionar.PC ),
        PI: prep( Impl.Dictionar.PI ),
        SC: prep( Impl.Dictionar.SC ),
        SI: prep( Impl.Dictionar.SI ),
        CE: prep( Impl.Dictionar.CE )
    };


    const modul =
    {
        Desparte: function ( text )
        {
            let rezultat = "";

            Impl.RegexSpl.lastIndex = 0;

            for( ; ; )
            {
                let a = Impl.RegexSpl.exec( text );

                if( a === null ) break;

                if( a[1] !== undefined )
                {
                    let optiuni = { PrefixeMultiple: false, EvitaSilabeNeeconomice: true, EvitaSecventeNeelegante: true };
                    let impl = new Impl( a[1], optiuni );

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

    return modul;

} )();

