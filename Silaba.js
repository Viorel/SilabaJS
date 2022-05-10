'use strict';

const Silaba = ( function ()
{
    let Impl = function ( cuvint, optiuni )
    {
        // TODO: optimizări pentru modul secundar

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

        this.e_cuvint_fix = false;
        this.e_terminatie_certa = false;
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
        "ô": "o",
        "ú": "u",
        "ŭ": "u",
        //
        "ǻ": "å",
        "ǘ": "ü",
        //
        "â": "î",
        "ş": "ș",
        "ţ": "ț"

        // altele: ä å ç ü ö
        // ê - rar, în "tête-a-tête"
        // œ - rar, în "trompe-l'œil"
    };


    Impl.prototype.Desparte = function ()
    {
        if( this.lungime === 0 ) return;

        this.IncearcaCuvinteFixe() ||
            this.IncearcaExceptiiSiPrefixe() ||
            this.IncearcaSufixe() ||
            this.IncearcaAnalitic();

        this.Corecteaza();
    }


    Impl.prototype.IncearcaCuvinteFixe = function ()
    {
        if( Impl.Dictionar.CF === undefined ) return false;

        let cratime = Impl.Dictionar.CF[this.cuvint];

        if( cratime === undefined ) return false;

        this.cratime |= cratime;
        this.e_cuvint_fix = true;

        return true;
    }


    Impl.prototype.IncearcaExceptiiSiPrefixe = function ()
    {
        let exceptie = this.CautaPrefix( Impl.Date.CE, 0 );
        let l1 = exceptie === undefined ? 0 : exceptie[0].length + 1;

        let cauta_prefixe = !this.optiuni.Secundar || this.optiuni.PrefixeMultiple;

        let prefix_incert = cauta_prefixe ? this.CautaPrefix( Impl.Date.PI, l1 ) : undefined;
        let l2 = prefix_incert === undefined ? 0 : prefix_incert[0].length + 1;

        let prefix_cert = cauta_prefixe ? this.CautaPrefix( Impl.Date.PC, Math.max( l1, l2 ) ) : undefined;

        if( prefix_cert !== undefined ) // (e si cel mai lung)
        {
            let prefix = prefix_cert[0];

            if( this.optiuni.Secundar || ( this.optiuni.TrateazaFuziuni && this.EPrefixFuzionabil( prefix ) ) )
            {
                // trateaza prefixul cert ca pe unul incert

                this.TrateazaPrefixIncert( prefix_cert );
            }
            else
            {
                let cratime = prefix_cert[1];
                let lun_prefix = prefix.length;

                this.cratime |= cratime; // (include cratima de dupa prefix)

                // segmenteaza portiunea de dupa prefix

                let coada = this.cuvint.slice( lun_prefix );

                if( coada.length > 0 )
                {
                    let alt = new Impl( coada, Impl.OptiuniImpliciteSecundare );

                    alt.Desparte();

                    this.cratime |= alt.cratime << lun_prefix;
                    this.inhib |= alt.inhib << lun_prefix;
                    this.e_terminatie_certa = this.e_terminatie_certa || alt.e_terminatie_certa;
                }
            }

            return true;
        }
        else if( prefix_incert !== undefined )
        {
            this.TrateazaPrefixIncert( prefix_incert );

            return true;
        }
        else if( exceptie !== undefined )
        {
            let cratime = exceptie[1];

            this.cratime |= cratime;

            // segmenteaza portiunea de dupa ultima cratima

            let ultima_cratima = this.UltimaCratima( cratime ); // (eventual -1)
            let coada = this.cuvint.slice( ultima_cratima + 1 ); // (eventual tot cuvintul)
            let alt = new Impl( coada, Impl.OptiuniImpliciteSecundare );

            if( !alt.IncearcaSufixe() )
            {
                alt.IncearcaAnalitic();
            }

            this.cratime |= alt.cratime << ( ultima_cratima + 1 );
            this.inhib |= alt.inhib << ( ultima_cratima + 1 ); //?
            this.e_terminatie_certa = this.e_terminatie_certa || alt.e_terminatie_certa;

            return true;
        }

        return false;
    }


    Impl.prototype.TrateazaPrefixIncert = function ( prefix )
    {
        let text_prefix = prefix[0];
        //let cratime = prefix[1]; // neutilizat
        let lun_prefix = text_prefix.length;

        if( this.lungime > lun_prefix )
        {
            let ultima_litera_prefix = this.cuvint[lun_prefix - 1];
            let prima_litera_coada = this.cuvint[lun_prefix];

            // pune cratimă incertă după prefix; (silabele eronate formate din consoane vor fi corectate ulterior)

            if( !this.EDiftong( ultima_litera_prefix, prima_litera_coada ) )
            {
                this.cratime |= 1 << ( lun_prefix - 1 );
            }

            if( this.optiuni.TrateazaFuziuni )
            {
                // cratimă incertă înainte de ultima literă, dacă e vocală;
                // de ex. unele cuvinte de tip "hidro..." se segmentează "hidr-o..." în loc de "hidro-"
                // după fuziunea literelor 'o' ca în "hidro+oxid" ==> "hidr-oxid"
                if( this.EPrefixFuzionabil( text_prefix ) )
                {
                    this.cratime |= 1 << ( lun_prefix - 2 ); // (incert; silabele eronate formate din consoane vor fi corectate ulterior)
                }
            }

            // anulează segmentările incerte "V-iV" și "V-uV", de ex. în cuvinte ca "răuintenționat" (discutabile)

            if( lun_prefix >= 2 )
            {
                if( ultima_litera_prefix === 'i' || ultima_litera_prefix === 'u' )
                {
                    if( this.EVocala( text_prefix[lun_prefix - 2] ) && this.EVocala( prima_litera_coada ) )
                    {
                        this.inhib |= 1 << ( lun_prefix - 2 );
                    }
                }
            }
        }

        if( !this.IncearcaSufixe() )
        {
            this.IncearcaAnalitic();
        }
    }


    Impl.prototype.EPrefixFuzionabil = function ( prefix )
    {
        if( prefix.length < 3 ) return false;

        let ultima_litera_prefix = prefix.slice( -1 );
        let penultima_litera_prefix = prefix.slice( -2 );

        return ( ultima_litera_prefix === 'a' || ultima_litera_prefix === 'o' ) && this.EConsoana( penultima_litera_prefix );
    }



    Impl.prototype.IncearcaSufixe = function ()
    {
        let sufix_cert = this.CautaSufix( Impl.Date.SC, 0 );
        let l1 = sufix_cert === undefined ? 0 : sufix_cert[0].length + 1;

        let sufix_incert = this.CautaSufix( Impl.Date.SI, l1 );

        if( sufix_cert !== undefined ) // (e si cel mai lung)
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
            this.e_terminatie_certa = true;

            let radacina = this.cuvint.slice( 0, lun_radacina );
            let alt = new Impl( radacina, Impl.OptiuniImpliciteSecundare );

            if( alt.IncearcaAnalitic() )
            {
                this.cratime |= alt.cratime;
                this.inhib |= alt.inhib; //?
            }

            return true;
        }
        else if( sufix_incert !== undefined )
        {
            let sufix = sufix_incert[0];
            let lun_sufix = sufix.length;
            let lun_radacina = this.lungime - lun_sufix;
            //let cratime = sufix_incert[1]; // neutilizat

            let prima_din_sufix = this.cuvint[lun_radacina];
            let ultima_din_radacina = lun_radacina > 0 ? this.cuvint[lun_radacina - 1] : 0;

            // pune cratima incerta inainte de sufix; (silabele eronate formate din consoane vor fi corectate ulterior)

            if( !this.EDiftong( ultima_din_radacina, prima_din_sufix ) )
            {
                this.cratime |= 1 << ( lun_radacina - 1 );
            }

            this.IncearcaAnalitic();

            return true;
        }

        return false;
    }


    Impl.prototype.IncearcaAnalitic = function ()
    {
        let v = this.IncearcaSecventeVocalice();
        let c = this.IncearcaSecventeConsonantice();
        let f = this.IncearcaSecventeFonostatistice();
        let x = this.IncearcaFlexiuni();

        return v || c || f || x;
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
                    // REGULA: secvente trivocalice V-iV sau V-uV ("ca-iet", "vioa-ie"),
                    // exceptind 'ciu' si 'giu' ("aciua", "biciuieste")
                    // NOTA. Prefixele incerte ca "rău-" vor anula această segmentare.
                    // NOTA. Litera 'y' de obicei echivalează cu 'i': "spra-yuri"


                    let c2 = this.cuvint[i + 2];

                    if( ( c1 === 'i' || c1 === 'u' || c1 === 'y' ) && this.EVocala( c2 ) )
                    {
                        if( !( c0 === 'i' && c1 === 'u' && i > 0 && ( this.cuvint[i - 1] === 'c' || this.cuvint[i - 1] === 'g' ) ) )
                        {
                            this.cratime |= 1 << i; // inainte de 'i', 'u' sau 'y'

                            // Caz special "eue" și "iue": "înșeuează", "deșeuează", "piuez" ș. a.
                            // Se va despărți "e-ue", "i-ue", nu "e-u-e", "i-u-e"

                            if( ( c0 == 'e' || c0 == 'i' ) && c1 == 'u' && c2 == 'e' )
                            {
                                ++i;
                            }

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
        if( Impl.Date.FS === undefined ) return false;

        let aplicat = false;

        for( let i = 0; i < this.lungime; ++i )
        {
            let litera = this.cuvint[i];
            let elemente = Impl.Date.FS[litera];

            if( elemente !== undefined )
            {
                for( let j = 0; j < elemente.length; ++j )
                {
                    let element = elemente[j];
                    let secv = element[0];
                    let extras = this.cuvint.slice( i, i + secv.length );

                    if( extras === secv )
                    {
                        let cratime = element[1];
                        let exceptii = element[2];

                        let ignora = false;

                        for( let k = 0; k < exceptii.length; ++k )
                        {
                            let exceptie = exceptii[k];
                            let start = i - exceptie[0];
                            let cuv_exc = exceptie[1];

                            if( start >= 0 && this.cuvint.slice( start, start + cuv_exc.length ) === cuv_exc )
                            {
                                ignora = true;
                                break;
                            }
                        }

                        if( !ignora )
                        {
                            this.cratime |= cratime << i;
                            aplicat = true;

                            break;
                        }
                    }
                }
            }
        }

        return aplicat;
    }


    Impl.prototype.IncearcaFlexiuni = function ()
    {
        var flexiune = this.CautaSufix( Impl.Date.FX, 0 );

        if( flexiune !== undefined )
        {
            let secv = flexiune[0];
            let cratime = flexiune[1];

            this.cratime |= cratime << ( this.lungime - secv.length );
            this.e_terminatie_certa = true;

            return true;
        }

        return false;
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
        if( this.optiuni.Secundar ) return;

        if( !this.e_cuvint_fix )
        {
            if( !this.e_terminatie_certa ) this.Corecteaza_CI_Final();
            this.CorecteazaRomane();
            this.CorecteazaSilabeIncerte();
        }

        if( this.optiuni.EvitaSecventeNeelegante ) this.CorecteazaSecventeNeelegante();
        this.CorecteazaSilabeNeeconomice();
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


    Impl.prototype.CorecteazaRomane = function ()
    {
        // REGULA: daca se termina cu "III", si contine numai
        // 'V', 'X', 'L', 'C', 'D' sau 'M', atunci ar putea
        // fi numar roman; se interzice segmentarea lui;
        // (Nota: secventa 'II' nu apare in interiorul numerelor romane)

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


    Impl.prototype.CorecteazaSilabeNeeconomice = function ()
    {
        // REGULA: nu se lasă silabele inițiale și nu se trec silabele finale formate dintr-o singură literă (vocală); este neeconomic

        if( this.lungime > 1 )
        {
            this.inhib |= 1;
            this.inhib |= 1 << ( this.lungime - 2 );
        }
    }


    Impl.prototype.CorecteazaSilabeIncerte = function ()
    {
        // Anulează silabele constituite numai din consoane

        let b = 1;
        let u = 1 << this.lungime - 1;
        let c = this.cratime | u;
        let v = false;
        let s = -1;

        for( let i = 0; i < this.lungime; ++i, b <<= 1 )
        {
            v = v || this.EVocala( this.cuvint[i] );

            if( ( c & b ) !== 0 )
            {
                if( !v )
                {
                    let m = ~( ~0 << ( i - s + 1 ) );
                    if( s === -1 ) m >>= 1; else m <<= s;
                    this.inhib |= m & ~u;
                }

                v = false;
                s = i;
            }
        }
    }


    Impl.prototype.CorecteazaSecventeNeelegante = function ()
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


    Impl.prototype.CautaPrefix = function ( date, lungime_minima )
    {
        if( date === undefined ) return undefined;

        let lult = Math.max( date.LMin, lungime_minima );

        for( let l = date.LMax; l >= lult; --l )
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


    Impl.prototype.CautaSufix = function ( date, lungime_minima )
    {
        if( date === undefined ) return undefined;

        let lult = Math.max( date.LMin, lungime_minima );

        for( let l = date.LMax; l >= lult; --l )
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
        // TODO: ordonează conform frecvențelor

        return (
            litera === 'a' ||
            litera === 'ă' ||
            litera === 'â' || // (de fapt, 'â' a fost convertit în 'î')
            litera === 'e' ||
            litera === 'i' ||
            litera === 'î' ||
            litera === 'o' ||
            litera === 'u' ||
            litera === 'y' ||

            litera === 'à' ||
            litera === 'ä' ||
            litera === 'å' ||
            litera === 'è' ||
            litera === 'ö' ||
            litera === 'ü'
        );
    }


    Impl.prototype.EConsoana = function ( litera )
    {
        return !this.EVocala( litera ); // (varianta rapida)
    }


    Impl.prototype.EDiftong = function ( c1, c2, sfirsit )
    {
        // TODO: ordonează conform frecvențelor

        return (
            ( c1 === 'a' && c2 === 'i' ) ||
            ( c1 === 'a' && c2 === 'u' ) ||
            ( c1 === 'ă' && c2 === 'i' ) ||
            ( c1 === 'ă' && c2 === 'u' && sfirsit ) || // (caz special la prefixele incerte ca "rău-")
            ( c1 === 'e' && c2 === 'a' ) ||
            ( c1 === 'e' && c2 === 'i' ) ||
            ( c1 === 'e' && c2 === 'o' ) ||
            ( c1 === 'e' && c2 === 'u' ) ||
            ( c1 === 'i' && c2 === 'a' ) ||
            ( c1 === 'i' && c2 === 'e' ) ||
            ( c1 === 'i' && c2 === 'i' ) ||
            ( c1 === 'i' && c2 === 'o' ) ||
            ( c1 === 'i' && c2 === 'u' ) ||
            ( c1 === 'î' && c2 === 'i' ) ||
            ( c1 === 'î' && c2 === 'u' && sfirsit ) ||
            ( c1 === 'o' && c2 === 'a' ) ||
            ( c1 === 'o' && c2 === 'i' ) ||
            ( c1 === 'o' && c2 === 'u' && sfirsit ) || // (exc. "+voucher", DOOM3)
            ( c1 === 'u' && c2 === 'a' ) ||
            ( c1 === 'u' && c2 === 'ă' ) ||
            ( c1 === 'u' && c2 === 'i' ) ||
            ( c1 === 'u' && c2 === 'î' ) || // (rar; vezi "Secvențe fonostatistice" în Dicționarul de segmentare, elementul "*u-î*" )

            ( c1 === 'a' && c2 === 'y' ) ||
            ( c1 === 'e' && c2 === 'y' ) ||
            ( c1 === 'o' && c2 === 'y' ) ||
            ( c1 === 'y' && c2 === 'a' ) ||
            ( c1 === 'y' && c2 === 'e' ) ||
            //( c1 === 'y' && c2 === 'y' ) || // (rar)
            ( c1 === 'y' && c2 === 'o' ) ||
            ( c1 === 'y' && c2 === 'u' )
            // 'uu' este exclus, deoarece se desparte ca un hiat
        );
    }


    Impl.prototype.EGrup2Cons = function ( c0, c1 )
    {
        // TODO: ordonează conform frecvențelor

        return (
            ( ( c0 === 'b' || c0 === 'c' || c0 === 'd' ||
                c0 === 'f' || c0 === 'g' || c0 === 'h' ||
                c0 === 'p' || c0 === 't' || c0 === 'v' || c0 === 'k' ) && ( c1 === 'l' || c1 === 'r' ) ) ||
            ( c0 === 'c' && c1 === 'k' ) ||
            ( ( c0 === 'c' || c0 === 'g' || c0 === 'w' ) && c1 === 'h' )
        );
    }


    Impl.prototype.EGrup3Cons = function ( c0, c1, c2 )
    {
        // TODO: ordonează conform frecvențelor

        return (
            ( c0 === 'l' && c1 === 'd' && c2 === 'm' ) ||
            ( c0 === 'l' && c1 === 'p' && c2 === 'n' ) ||
            ( c0 === 'l' && c1 === 'p' && c2 === 't' ) ||
            ( c0 === 'l' && c1 === 't' && c2 === 'c' ) || // (DOOM2 indică doar "ltč")
            ( c0 === 'm' && c1 === 'p' && c2 === 't' ) ||
            ( c0 === 'm' && c1 === 'p' && c2 === 'ț' ) ||
            ( c0 === 'n' && c1 === 'c' && c2 === 'ș' ) || // ("linx -- lincșii")
            ( c0 === 'n' && c1 === 'c' && c2 === 't' ) || // (una din excepții: "punctaveraj")
            ( c0 === 'n' && c1 === 'c' && c2 === 'ț' ) ||
            ( c0 === 'n' && c1 === 'd' && c2 === 'b' ) ||
            ( c0 === 'n' && c1 === 'd' && c2 === 'c' ) ||
            ( c0 === 'n' && c1 === 'd' && c2 === 'v' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'b' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'd' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'h' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'l' ) || // ("trans-lata", dar: "pan-slav")
            ( c0 === 'n' && c1 === 's' && c2 === 'm' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'n' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'r' ) || // (nu e în DOOM2, care nici nu include astfel de cuvinte)
            ( c0 === 'n' && c1 === 's' && c2 === 's' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'v' ) ||
            ( c0 === 'n' && c1 === 't' && c2 === 'l' ) ||
            ( c0 === 'r' && c1 === 'b' && c2 === 'ț' ) || // (nu e în DOOM2)
            ( c0 === 'r' && c1 === 'c' && c2 === 't' ) ||
            ( c0 === 'r' && c1 === 'g' && c2 === 'ș' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'b' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'c' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'f' ) ||
            //( c0 === 'r' && c1 === 't' && c2 === 'h' ) || // ("apart-heid", dar: "hor-thist" din DOOM3)
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
        // TODO: ordonează conform frecvențelor

        // Anulat de DOOM2: c0 === 'b' && c1 === 's' && c2 === 't' && c3 === 'r'
        // Ex.: "abstract", "obstrucție"

        return (
            ( c0 === 'n' && c1 === 's' && c2 === 'g' && c3 === 'r' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'd' && c3 === 'r' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 's' && c3 === 'c' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'p' && c3 === 'r' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 's' && c3 === 'c' ) ||
            ( c0 === 's' && c1 === 't' && c2 === 'ș' && c3 === 'c' ) ||
            // noi, din DOOM2:
            ( c0 === 'l' && c1 === 'd' && c2 === 's' && c3 === 'p' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'f' && c3 === 'r' ) ||
            ( c0 === 'n' && c1 === 's' && c2 === 'p' && c3 === 'l' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 'c' && c3 === 'h' ) ||
            ( c0 === 'r' && c1 === 't' && c2 === 's' && c3 === 't' )
            //( c0 === 'n' && c1 === 'g' && c2 === 's' && c3 === 't' ) // (vezi 'EGrup3ConsDin4')
        );
    }


    Impl.prototype.EGrup5Cons = function ( c0, c1, c2, c3, c4 )
    {
        return (
            ( c0 === 'n' && c1 === 'g' && c2 === 's' && c3 === 't' && c4 === 'r' ) ||
            ( c0 === 'p' && c1 === 't' && c2 === 's' && c3 === 'p' && c4 === 'r' )
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
{"PC":{"abio":5,"aerogeo":43,"agrobio":41,"agrogeo":41,"agrometeo":169,"ante":2,"anti":2,"arhi":2,"audio":11,"audiovideo":347,"balneo":20,"biblio":18,"bio":2,"biogeo":22,"business":10,"cardio":20,"circum":4,"c\u00EEte\u0219i":2,"cvadri":4,"cvasi":4,"dez":0,"fizio":10,"ftizio":20,"fungi":4,"geo":2,"helio":10,"hemi":2,"hiper":2,"homeo":10,"ideo":5,"mili":2,"nemai":2,"neuro":6,"nici":0,"ohmamper":20,"ori\u0219i":4,"peri":2,"pluri":4,"poli":2,"semi":2,"super":2,"tele":2,"trans":0,"vice":2,"video":10,"voltamper":40,"voltohm":8,"watt":0,"west":0,"zoo":2},"PI":{"acet":0,"aceti":0,"aceto":0,"aceton":0,"aden":0,"adeno":0,"aero":0,"agro":0,"antropo":0,"astro":0,"auto":0,"bi":0,"bine":0,"bronho":0,"carpo":0,"chimio":0,"contra":0,"cromo":0,"cron":0,"crono":0,"de":0,"deca":0,"des":0,"dis":0,"diz":0,"echi":0,"electro":0,"emi":0,"en":0,"end":0,"endo":0,"ent":0,"enter":0,"entero":0,"ento":0,"entomo":0,"epi":0,"etero":0,"euro":0,"ex":0,"exo":0,"extra":0,"extro":0,"filo":0,"fito":0,"fono":0,"foto":0,"galvano":0,"geronto":0,"hem":0,"hemo":0,"hetero":0,"hexa":0,"hidro":0,"higro":0,"hip":0,"hipo":0,"hister":0,"histero":0,"histo":0,"holo":0,"homo":0,"in":0,"infanti":0,"infra":0,"inter":0,"intra":0,"intro":0,"izo":0,"kilo":0,"lact":0,"lacti":0,"lacto":0,"loco":0,"logo":0,"macro":0,"magneto":0,"mecano":0,"mega":0,"mel":0,"melo":0,"meta":0,"mico":0,"micro":0,"mini":0,"mold":0,"moldo":0,"mono":0,"moto":0,"mult":0,"multi":0,"nan":0,"nano":0,"ne":0,"non":0,"olig":0,"oligo":0,"om":0,"omo":0,"orto":0,"paleo":0,"pan":0,"panto":0,"par":0,"para":0,"penta":0,"petro":0,"pico":0,"port":0,"post":0,"pre":0,"prea":0,"pro":0,"proto":0,"pseudo":0,"psicro":0,"psih":0,"psiho":0,"psihro":0,"radio":0,"r\u0103u":0,"re":0,"reo":0,"retro":0,"servo":0,"silvo":0,"simili":0,"sincro":0,"spectro":0,"stereo":0,"steto":0,"sub":0,"supra":0,"tehno":0,"tera":0,"termo":0,"tetra":0,"topo":0,"tri":0,"ultra":0,"uni":0},"SC":{"ectazia":42,"ectazie":42,"ectaziei":42,"ectazii":10,"ectaziile":106,"ectaziilor":106,"metri":2,"metrii":2,"metrilor":18,"metru":2,"metrul":2,"metrului":18,"pter":0,"ptera":4,"pter\u0103":4,"ptere":4,"pterei":4,"pterele":20,"pterelor":20,"pteri":0,"pterii":4,"pterilor":20,"pterul":4,"pterului":20,"scoape":8,"scoapele":40,"scoapelor":40,"scop":0,"scopia":20,"scopic":4,"scopica":20,"scopic\u0103":20,"scopice":20,"scopicei":20,"scopicele":84,"scopicelor":84,"scopici":4,"scopicii":20,"scopicilor":84,"scopicul":20,"scopicului":84,"scopie":20,"scopiei":20,"scopii":4,"scopiile":52,"scopiilor":52,"scopul":4,"scopului":20,"service":4,"sfera":4,"sfer\u0103":4,"sfere":4,"sferei":4,"sferele":20,"sferelor":20,"sferic":4,"sferica":20,"sferic\u0103":20,"sferice":20,"sfericei":20,"sfericele":84,"sfericelor":84,"sferici":4,"sfericii":20,"sfericilor":84,"sfericul":20,"sfericului":84,"spasm":0,"spasme":8,"spasmele":40,"spasmelor":40,"spasmul":8,"spasmului":40,"sperm":0,"sperma":8,"sperm\u0103":8,"sperme":8,"spermei":8,"spermele":40,"spermelor":40,"spermi":0,"spermia":40,"spermie":40,"spermiei":40,"spermii":8,"spermiile":104,"spermiilor":104,"spermilor":40,"spermul":8,"spermului":40,"spor":0,"spora":4,"spor\u0103":4,"spore":4,"sporei":4,"sporele":20,"sporelor":20,"spori":0,"sporii":4,"sporilor":20,"sporul":4,"sporului":20,"static":4,"statica":20,"static\u0103":20,"statice":20,"staticei":20,"staticele":84,"staticelor":84,"statici":4,"staticii":20,"staticilor":84,"staticul":20,"staticului":84,"sta\u021Bia":20,"sta\u021Bie":20,"sta\u021Biei":20,"sta\u021Bii":4,"sta\u021Biile":52,"sta\u021Biilor":52},"SI":{"aldina":0,"aldin\u0103":0,"aldine":0,"aldinei":0,"aldinele":0,"aldinelor":0,"algia":0,"algie":0,"algii":0,"algiile":0,"algiilor":0,"ectomia":0,"ectomie":0,"ectomiei":0,"ectomii":0,"ectomiile":0,"ectomiilor":0,"emia":0,"emie":0,"emiei":0,"emii":0,"emiile":0,"emiilor":0,"estezia":0,"estezic":0,"estezica":0,"estezic\u0103":0,"estezice":0,"estezicei":0,"estezicele":0,"estezicelor":0,"estezici":0,"estezicii":0,"estezicilor":0,"estezicul":0,"estezicului":0,"estezie":0,"esteziei":0,"estezii":0,"esteziile":0,"esteziilor":0,"gnostic":0,"gnostica":0,"gnostic\u0103":0,"gnostice":0,"gnosticei":0,"gnosticele":0,"gnosticelor":0,"gnostici":0,"gnosticii":0,"gnosticilor":0,"gnosticul":0,"gnosticule":0,"gnosticului":0,"opsia":0,"opsie":0,"opsiei":0,"opsii":0,"opsiile":0,"opsiilor":0,"stat":0,"state":0,"statele":0,"statelor":0,"statul":0,"statului":0},"CF":{"abielu\u021Ba":9,"aboli":5,"acetat":5,"acetatu":21,"acetatul":21,"acetatului":85,"aceta\u021Bi":5,"aceta\u021Bii":21,"aceta\u021Bilor":85,"acetona":21,"aceton\u0103":21,"acetone":21,"acetonei":21,"acetonele":85,"acetonelor":85,"acquis":2,"adas":0,"adenauer":21,"adenita":16,"adenit\u0103":16,"adenite":16,"adenitei":16,"adenitele":80,"adenitelor":80,"adeseori":21,"adolphe":1,"adumbri":10,"aequo":2,"aeroaei":19,"aeroaie":19,"affettuoso":146,"affetuoso":74,"afterschool":18,"agerpres":8,"agerpress":8,"agroindbank":72,"alb\u0103stri":18,"alio\u0219":0,"altfel":4,"alt\u00EEncotro":84,"altminterea":164,"altminterelea":676,"altminteri":36,"altundeva":84,"am\u0103gi":5,"ambienttalk":74,"ame\u021Bi":5,"aminti":9,"amor\u021Bi":9,"amurgi":9,"amu\u021Bi":5,"anaida":12,"andreici":18,"andrei\u021Ba":50,"andrei\u021B\u0103":50,"anghelachi":82,"anticva":18,"anticv\u0103":18,"anticvei":18,"antistene":82,"antochi":10,"antofi":10,"antohi":10,"antoni":10,"apache":0,"applescript":16,"aquino":9,"arhiri":10,"asean":0,"asirom":0,"asito":0,"aslo":0,"atem":0,"auriga":10,"auschwitz":2,"autoservi":75,"background":8,"backup":8,"badge":0,"badiul":2,"badiule":18,"badiului":18,"balduin":4,"barb\u0103scump\u0103":276,"basa":0,"baudelair":16,"bazooka":18,"b\u0103ietr\u0103u":18,"b\u0103rbuic\u0103":36,"b\u0103rbui\u021B\u0103":36,"beanshell":8,"beatrice":6,"bengali":20,"biata":4,"biat\u0103":4,"bicsanda":36,"bic\u0219oc":4,"bidi":2,"bidonville":18,"biel":0,"biela":4,"biel\u0103":4,"biele":4,"bielei":4,"bielele":20,"bielelor":20,"bielski":8,"bielz":0,"bien":0,"bijboac\u0103":36,"bike":0,"bilba":4,"bilboc":4,"bimbea":4,"bimbirel":20,"bimbiric\u0103":84,"binchiciu":36,"bindea":4,"bindeanu":36,"bindja":4,"binga":4,"bingheac":4,"bintea":4,"bin\u021Bin\u021Ban":36,"biobere":20,"bioc":0,"biolan":4,"biorou":4,"bio\u0219an":4,"birde\u0219":4,"birdici":4,"birgean":4,"bischin":4,"bissau":4,"biste":4,"bistea":4,"bistrae":36,"bistran":4,"bistranu":36,"bistreanu":68,"bistrian":36,"bistricean":36,"bistriceanu":292,"bistricianu":292,"bi\u0219boac\u0103":36,"bizdadea":20,"bizdideanu":148,"bizdigheanu":276,"bizdrighean":36,"bizdrigheanu":548,"bizdrighenu":292,"b\u00EElb\u00EEil\u0103":20,"blasquinte":136,"blockly":0,"bloop":0,"bodoni":10,"boeuf":0,"boghead":4,"boogie":4,"book":0,"booking":4,"boom":0,"bouquin":4,"bourree":8,"braille":0,"braunit":8,"br\u0103tianu":36,"brigitte":4,"broccoli":40,"brother":0,"buisson":4,"byte":0,"cache":0,"cadmiaz\u0103":52,"caer":0,"caesar":4,"caetera":20,"cailor":6,"calalb":4,"calevri":10,"cannelloni":164,"cartney":8,"cashflow":8,"cathedra":18,"causa":4,"cayenne":0,"c\u0103s\u0103tori":42,"ceemac":0,"charles":0,"cheesecake":32,"chevalier":20,"chiai":0,"chianti":16,"chiar\u0103":8,"chippendale":72,"ciao":0,"cilindri":18,"cimpi":4,"cincilei":16,"ciom\u0103gi":20,"ciompi":8,"ciopli":4,"c\u00EEteodat\u0103":90,"c\u00EE\u021Biva":8,"claire":0,"clarion":0,"clausus":8,"clojure":4,"cloud":0,"coffeescript":32,"coldfusion":8,"comati":10,"compasinter":164,"compound":4,"contactless":68,"contra":4,"contrasta":68,"contrastai":68,"contrastam":68,"contrastar\u0103":324,"contrastar\u0103m":324,"contrastar\u0103\u021Bi":324,"contrastase":324,"contrastasem":324,"contrastaser\u0103":1348,"contrastaser\u0103m":1348,"contrastaser\u0103\u021Bi":1348,"contrastase\u0219i":324,"contrastase\u021Bi":324,"contrasta\u0219i":68,"contrasta\u021Bi":68,"contrastau":68,"contrast\u0103":68,"contrast\u0103m":68,"contraste":68,"contrasteaz\u0103":580,"contrastelor":324,"contrastez":68,"contrasteze":324,"contrastezi":68,"contrastiv":68,"contrastivi":68,"contrastivii":324,"contrastivilor":1348,"contrastivu":324,"contrastivul":324,"contrastivului":1348,"contrast\u00EEnd":68,"contrast\u00EEndu":580,"contrastu":68,"contrastul":68,"contrastului":324,"contra\u0219":4,"contraveni":164,"conveni":20,"cookie":4,"cool":0,"cople\u0219i":18,"cor\u0103bia":10,"cor\u0103biaua":74,"corcimaru":80,"corcoli":20,"cornflakes":8,"cornwall":8,"cotropi":18,"cottage":4,"country":8,"couture":4,"craun":0,"creditinvest":164,"creek":0,"culcu\u0219i":20,"cuveni":10,"cyclone":2,"cypher":0,"cython":0,"daimio":20,"dance":0,"datatrieve":8,"d\u0103ng\u0103ni":20,"dbase":0,"deadweight":8,"dec\u0103li":10,"defta":4,"deftu":4,"delca":4,"delc\u0103":4,"delc\u0103rean":20,"delcea":4,"delcescu":36,"delcioiu":36,"delcu":4,"dembinschi":36,"demca":4,"demcu":4,"demian":2,"dem\u0219a":4,"dem\u0219oreanu":148,"denciu":4,"denciu\u021B":4,"dencu":4,"dendiu":4,"denghel":4,"dengjel":4,"densu\u0219ean":20,"densu\u0219ianu":148,"deoarece":42,"deodat\u0103":22,"deoparte":38,"deopotriv\u0103":150,"derbac":4,"derban":4,"derda":4,"derdena":20,"derderian":84,"derdeu":4,"derjac":4,"derlean":4,"dermangiu":36,"dermengi":36,"dermengiu":36,"derpe\u0219":4,"der\u0219eanu":36,"der\u0219idan":20,"der\u021Biu":4,"dervi\u0219":4,"des\u0103gi":10,"des\u0103v\u00EEr\u0219i":74,"descria":34,"descriai":34,"descriam":34,"descria\u021Bi":34,"descriau":34,"descrie":34,"descriem":34,"descriere":98,"descrie\u021Bi":34,"descrii":2,"descriind":34,"descriindu":34,"descris":2,"descrise":34,"descrisei":34,"descriser\u0103":162,"descriser\u0103m":162,"descriser\u0103\u021Bi":162,"descrisese":162,"descrisesem":162,"descriseser\u0103":674,"descriseser\u0103m":674,"descriseser\u0103\u021Bi":674,"descrisese\u0219i":162,"descrisese\u021Bi":162,"descrise\u0219i":34,"descrisu":34,"descriu":2,"descump\u0103ni":164,"deseori":10,"deservi":18,"deslu\u0219i":20,"desp\u0103duri":84,"desp\u0103gubi":84,"desp\u0103ienjeni":660,"desp\u0103r\u021Bi":36,"desp\u0103turi":84,"despleti":36,"despodobi":84,"despotcovi":164,"despotmoli":164,"despre":2,"desrobitu":84,"des\u021Beleni":84,"desuci":10,"desz\u0103pezi":84,"de\u0219liu":4,"de\u0219ter":4,"detc\u0103u":4,"device":2,"dezaburi":44,"dezaerisi":92,"dezam\u0103gi":44,"dezastre":18,"dezastrele":146,"dezastrelor":146,"dezastru":18,"dezastrul":18,"dezastrului":146,"dezbrobodi":164,"dezerta":18,"dezertai":18,"dezertam":18,"dezertar\u0103":82,"dezertar\u0103m":82,"dezertar\u0103\u021Bi":82,"dezertare":82,"dezertarea":82,"dezertase":82,"dezertasem":82,"dezertaser\u0103":338,"dezertaser\u0103m":338,"dezertaser\u0103\u021Bi":338,"dezertase\u0219i":82,"dezertase\u021Bi":82,"dezerta\u0219i":18,"dezertat":18,"dezertatu":82,"dezerta\u021Bi":18,"dezertau":18,"dezert\u0103":18,"dezert\u0103m":18,"dezert\u0103ri":18,"dezert\u0103rii":82,"dezert\u0103rile":338,"dezert\u0103rilor":338,"dezerteaz\u0103":146,"dezertez":18,"dezerteze":82,"dezertezi":18,"dezert\u00EEnd":18,"dezert\u00EEndu":146,"dezertoare":146,"dezertoarea":146,"dezertoarei":146,"dezertoarele":658,"dezertoarelor":658,"dezertoareo":146,"dezertor":18,"dezertori":18,"dezertorii":82,"dezertorilor":338,"dezertoru":82,"dezertorul":82,"dezertorule":338,"dezertorului":338,"dezgoli":20,"dezi":2,"dezic":2,"dezic\u0103":10,"dezice":10,"dezicea":10,"deziceai":10,"deziceam":10,"dezicea\u021Bi":10,"deziceau":10,"dezicem":10,"dezicere":42,"dezicerea":42,"deziceri":10,"dezicerii":42,"dezicerile":170,"dezicerilor":170,"dezice\u021Bi":10,"dezici":2,"dezic\u00EEnd":10,"dezic\u00EEndu":10,"deziderat":42,"deziderata":170,"deziderat\u0103":170,"deziderate":170,"dezideratei":170,"dezideratele":682,"dezideratelor":682,"dezideratu":170,"dezideratul":170,"dezideratului":682,"dezidera\u021Bi":42,"dezidera\u021Bii":170,"dezidera\u021Bilor":682,"dezinvolt":18,"dezinvolta":146,"dezinvolt\u0103":146,"dezinvolte":146,"dezinvoltei":146,"dezinvoltele":658,"dezinvoltelor":658,"dezinvoltu":146,"dezinvoltul":146,"dezinvoltului":658,"dezinvol\u021Bi":18,"dezinvol\u021Bii":146,"dezinvol\u021Bilor":658,"dezirabil":42,"dezirabila":170,"dezirabil\u0103":170,"dezirabile":170,"dezirabilei":170,"dezirabilele":682,"dezirabilelor":682,"dezirabili":42,"dezirabilii":170,"dezirabililor":682,"dezirabilu":170,"dezirabilul":170,"dezirabilului":682,"dezis":2,"dezise":10,"dezisei":10,"deziser\u0103":42,"deziser\u0103m":42,"deziser\u0103\u021Bi":42,"dezisese":42,"dezisesem":42,"deziseser\u0103":42,"deziseser\u0103m":170,"deziseser\u0103\u021Bi":170,"dezisese\u0219i":42,"dezisese\u021Bi":42,"dezise\u0219i":10,"dezisu":10,"dezlipi":20,"dezmo\u0219teni":164,"dezn\u0103moli":84,"dezola":10,"dezolai":10,"dezolam":10,"dezolant":10,"dezolanta":74,"dezolant\u0103":74,"dezolante":74,"dezolantei":74,"dezolantele":330,"dezolantelor":330,"dezolantu":74,"dezolantul":74,"dezolantului":330,"dezolan\u021Bi":10,"dezolan\u021Bii":74,"dezolan\u021Bilor":330,"dezolar\u0103":42,"dezolar\u0103m":42,"dezolar\u0103\u021Bi":42,"dezolare":42,"dezolarea":42,"dezolase":42,"dezolasem":42,"dezolaser\u0103":170,"dezolaser\u0103m":170,"dezolaser\u0103\u021Bi":170,"dezolase\u0219i":42,"dezolase\u021Bi":42,"dezola\u0219i":10,"dezolat":10,"dezolatu":42,"dezola\u021Bi":10,"dezolau":10,"dezol\u0103":10,"dezol\u0103m":10,"dezol\u0103ri":10,"dezol\u0103rii":42,"dezol\u0103rile":170,"dezol\u0103rilor":170,"dezoleaz\u0103":74,"dezolez":10,"dezoleze":42,"dezolezi":10,"dezol\u00EEnd":10,"dezol\u00EEndu":74,"dezrobi":20,"dezuni":12,"dezveli":20,"dezvinov\u0103\u021Bi":340,"dicendi":18,"diligence":8,"dinadins":12,"dinadinsul":76,"dinapoi":12,"dinapoia":44,"directoire":146,"discount":4,"disear\u0103":18,"disident":10,"disidenta":74,"disident\u0103":74,"disidente":74,"disidento":74,"disilab":10,"disilabi":10,"disilabii":42,"disilabilor":170,"disilabul":42,"disilabului":170,"disper":2,"dispera":18,"disperai":18,"disperam":18,"disperar\u0103":82,"disperar\u0103m":82,"disperar\u0103\u021Bi":82,"disperare":82,"disperarea":82,"disperase":82,"disperasem":82,"disperaser\u0103":338,"disperaser\u0103m":338,"disperaser\u0103\u021Bi":338,"disperase\u0219i":82,"disperase\u021Bi":82,"dispera\u0219i":18,"disperat":18,"disperatu":82,"disperau":18,"disper\u0103":18,"disper\u0103m":18,"disper\u0103ri":18,"disper\u0103rii":82,"disper\u0103rile":338,"disper\u0103rilor":338,"dispere":18,"disperi":2,"disper\u00EEnd":18,"disper\u00EEndu":146,"distom":2,"distomi":2,"distomii":18,"distomilor":82,"distomu":18,"distomul":18,"distomului":82,"disuria":44,"disurie":44,"disuriei":44,"disurii":12,"disuriile":108,"disuriilor":108,"dopion":2,"dreadnought":16,"drive":0,"drugstore":8,"dubli":2,"duelgi":10,"dumeri":10,"dumiri":10,"dyke":0,"ease":0,"easy":0,"easytrieve":8,"ecmascript":8,"electrecord":81,"elenchi":8,"emoji":4,"enduro":10,"episcoape":69,"episcoapele":325,"episcoapelor":325,"episcop":1,"episcope":41,"episcopi":9,"episcopii":41,"episcopiilor":425,"episcopilor":169,"episcopul":33,"episcopule":169,"episcopului":161,"epistola":41,"epistol\u0103":41,"epistole":41,"epistolei":41,"epistolele":169,"epistolelor":169,"equus":1,"escape":2,"escher":0,"espol":0,"estate":2,"eswatini":42,"ethno":4,"euphoria":18,"exempli":9,"ezhil":0,"facebook":8,"fake":0,"fakenews":8,"fashion":0,"feri":2,"fiarb\u0103":8,"fiarta":8,"fiart\u0103":8,"filostache":82,"five":0,"floop":0,"foehn":0,"food":0,"fortiori":52,"foxbase":4,"frame":0,"france":0,"free":0,"fuoco":4,"galimatias":170,"game":0,"gamemonkey":72,"gargarisi":84,"gates":0,"gcode":0,"geoab\u0103":8,"geoad\u0103":8,"geoan\u0103":8,"geoars\u0103":16,"geobegescu":148,"geogea":4,"geogean":4,"geogeanu":36,"geogescu":36,"geogia":4,"geoglovan":36,"geolde\u0219":8,"geolea":4,"geolg\u0103u":8,"geomea":4,"geomolean":20,"geonea":4,"georges":0,"georgiadi":104,"geornea":8,"geornoiu":40,"geor\u0219oiu":40,"geosanu":20,"geovanovici":84,"ghiar\u0103":8,"ghilosi":20,"glissandi":72,"goethit":4,"goldsmith":8,"google":0,"gothit":2,"g\u00F6thit":2,"graffiti":40,"graphtalk":16,"grazioso":36,"grecque":8,"grisaille":4,"grizzly":16,"groovy":0,"gui\u021B":0,"habeas":10,"hain":2,"haini":2,"halide":0,"handout":8,"harbour":4,"hardware":8,"hartmann":8,"hascript":2,"haskell":0,"haute":4,"haxe":0,"hiar\u0103":4,"hiawatha":20,"highsmith":8,"hiol\u0103":6,"hipocaust":10,"hipocauste":138,"hipocaustele":650,"hipocaustelor":650,"hipocaustul":138,"hipocaustului":650,"hodorogi":42,"home":0,"homordean":18,"homo\u0219dean":18,"homo\u0219tean":18,"hope":0,"horeca":0,"hotline":4,"house":0,"hume":0,"iap\u0103scurt\u0103":138,"ibid":0,"ibidem":2,"icral":0,"ilu\u0219tri":9,"imbroglio":18,"indcon":4,"indmontaj":4,"indoor":2,"inrie\u0219":10,"interes":10,"interesa":42,"interesai":42,"interesam":42,"interesar\u0103":170,"interesar\u0103m":170,"interesar\u0103\u021Bi":170,"interesare":170,"interesase":170,"interesasem":170,"interesaser\u0103":682,"interesaser\u0103m":682,"interesaser\u0103\u021Bi":682,"interesase\u0219i":170,"interesase\u021Bi":682,"interesa\u0219i":42,"interesat":42,"interesatu":170,"interesa\u021Bi":42,"interesau":42,"interes\u0103":42,"interes\u0103m":42,"interese":42,"intereseaz\u0103":298,"interesele":170,"intereselor":170,"interesez":42,"intereseze":170,"interesezi":42,"interes\u00EEnd":42,"interes\u00EEndu":298,"interesul":42,"interesului":170,"interii":10,"interilor":42,"interul":10,"interului":42,"interverti":146,"intestat":18,"investi":18,"iphone":0,"irta":0,"ivoire":0,"\u00EEmp\u0103m\u00EEnteni":330,"\u00EEmpestri":18,"\u00EEmp\u00EEcli":10,"\u00EEmpletici":82,"\u00EEmpotrivi":74,"\u00EEnadins":6,"\u00EEn\u0103lb\u0103stri":74,"\u00EEncol\u021Bi":18,"\u00EEndeajuns":26,"\u00EEndeaproape":282,"\u00EEndeob\u0219te":42,"\u00EEndeosebi":26,"\u00EEndeplini":74,"\u00EEnfiere":26,"\u00EEnfierea":26,"\u00EEnflori":18,"\u00EEnmiaz\u0103":26,"\u00EEnnegri":10,"\u00EEnr\u0103ut\u0103\u021Bi":90,"\u00EEnr\u00EEuri":26,"\u00EEnsufle\u021Bi":74,"\u00EEntov\u0103r\u0103\u0219i":170,"\u00EEntruni":18,"\u00EEnverzi":18,"\u00EEnvesti":18,"\u00EEnvoinici":82,"\u00EEnvrednici":162,"jacques":0,"jane":0,"janequin":10,"javascript":10,"jeun":0,"jian":2,"jiana":6,"jianul":6,"jitsu":2,"jiujitsu":20,"joaquin":4,"joile":6,"josquin":4,"joule":4,"jour":0,"juice":0,"jython":0,"kaleidoscope":594,"kathmandu":8,"kathy":2,"kilocicli":42,"kiwi":2,"kixtart":0,"knockout":16,"koala":6,"kornshell":8,"labium":10,"lactee":20,"ladysmith":8,"language":4,"laudatio":20,"layout":4,"l\u0103comi":10,"leghorn":0,"legoscript":8,"lesotho":10,"leutze":4,"life":0,"like":0,"lipsi":4,"litec":0,"lithe":0,"live":0,"livescript":8,"logodi":10,"longue":4,"lorraine":4,"louis":0,"lounge":0,"lukoil":4,"machine":2,"macri":2,"macrone":2,"made":0,"maghiar\u0103":34,"make":0,"maple":0,"marciale":36,"mariachi":18,"marquina":36,"matlab":0,"mauritius":86,"m\u0103iestri":18,"medjidia":82,"megacicli":42,"melanom":10,"melasa":10,"melas\u0103":10,"melase":10,"melasei":10,"melasele":10,"melaselor":10,"mele":2,"memoire":18,"m\u00E9moire":18,"mersi":4,"meszaro\u0219":18,"metacomimpex":72,"metahirisi":170,"miau":0,"miaua":4,"michael":2,"mied":0,"miei":0,"miel":0,"miele":4,"mielei":4,"mielele":20,"mielelor":20,"mierl\u0103":8,"mierte":8,"milian":2,"milieu":2,"milii":2,"milincovici":82,"milkshake":8,"millefeuille":16,"millefiori":148,"minister":18,"ministere":82,"ministerele":338,"ministerelor":338,"ministeru":82,"ministerul":82,"ministerului":338,"ministra":18,"ministr\u0103":18,"ministre":18,"ministrei":18,"ministrele":146,"ministrelor":146,"ministro":18,"ministru":18,"ministrul":18,"ministrule":146,"ministrului":146,"mini\u0219tri":18,"mini\u0219trii":18,"mini\u0219trilor":146,"miziumschi":34,"m\u00EEn\u0103scurt\u0103":138,"m\u00EEndri":4,"molda":4,"moldav":4,"moldava":20,"moldav\u0103":20,"moldave":20,"moldavei":20,"moldavele":84,"moldavelor":84,"moldavi":4,"moldavii":20,"moldavilor":84,"moldavit":20,"moldavite":84,"moldavitele":340,"moldavitelor":340,"moldavitul":84,"moldavitului":340,"moldavu":20,"moldavul":20,"moldavule":84,"moldavului":84,"mold\u0103":4,"molde":4,"moldei":4,"moldele":20,"moldelor":20,"moli\u00E8re":2,"monodia":44,"monodie":44,"monodiei":44,"monodii":12,"monodiile":108,"monodiilor":108,"monotremii":74,"mon\u0219tri":4,"montagnes":4,"montreal":40,"mototoli":42,"mountain":8,"mouse":0,"muguet":2,"mult\u0103":4,"multe":4,"multor":4,"multora":20,"multul":4,"mul\u021Bi":0,"mundi":4,"musli":4,"m\u00FCsli":4,"naismith":4,"nato":0,"n\u0103p\u0103di":10,"neaga":4,"neag\u0103":4,"neag\u0103i":4,"neagoie":20,"neagra":4,"neagr\u0103":4,"neam":0,"neamu":4,"neamul":4,"neamului":20,"neamuri":4,"neamurile":84,"neamurilor":84,"neaua":4,"necinsti":18,"necoi\u021B\u0103":26,"nedumeri":42,"neferici":42,"negoiescu":74,"nehnici":4,"nehtu":4,"nejderu":20,"nejloveanu":148,"nejnec":4,"nejneru":20,"nemeice":26,"nem\u00EEndri":18,"nemuri":10,"nencu":4,"nenoroci":42,"nerciu":4,"nereu\u0219i":26,"nerge\u0219":4,"nerghe":4,"nerghe\u0219":4,"nerglea":4,"nescovici":20,"nescui":4,"nescu\u021B\u0103":20,"nesocoti":42,"neste":4,"nesteian":20,"nesteriuc":20,"nestor":4,"nestorescu":148,"ne\u0219tian":4,"ne\u0219tine":20,"ne\u0219tiut":18,"netlogo":4,"netrexx":4,"neuma":4,"neum\u0103":4,"neume":4,"neumei":4,"neumele":20,"neumelor":20,"nickle":0,"niue":0,"nona":2,"non\u0103":2,"none":2,"nonea":2,"nonei":2,"nonele":10,"nonelor":10,"nonet":2,"nonete":10,"nonetele":42,"nonetelor":42,"nonetul":10,"nonetului":42,"nonica":10,"nonoac\u0103":18,"nonu":2,"nonu\u0219":2,"nonu\u021B":2,"nouveau":4,"oare\u0219icare":162,"oare\u0219ice":34,"oare\u0219icine":162,"oare\u0219ic\u00EEnd":34,"oare\u0219icui":34,"oare\u0219icum":34,"oare\u0219iunde":162,"obidi":5,"ob\u00EEr\u0219i":9,"objectlogo":162,"objectscript":34,"obosi":5,"obr\u0103znici":81,"obrinti":17,"obroci":9,"office":2,"offline":4,"offshore":4,"ofili":5,"oleografiei":333,"oleoleo":9,"oligant":5,"oliganta":37,"oligant\u0103":37,"oligante":37,"oligantei":37,"oligantele":165,"oligantelor":165,"oligantu":37,"oligantul":37,"oligantului":165,"oligan\u021Bi":5,"oligan\u021Bii":37,"oligan\u021Bilor":165,"omeni":5,"online":2,"openedge":8,"opinti":9,"orice":4,"oricine":20,"oricum":4,"ori\u00EEncotro":84,"oriunde":20,"oronim":6,"or\u0219iunde":42,"ort\u0103ci":10,"osce":0,"outdoor":4,"paciuli":18,"panac":2,"panacee":42,"panaceele":106,"panaceelor":106,"panaceu":10,"panaceul":42,"panaceului":106,"panache":10,"panaci":2,"panagachie":42,"panaghia":10,"panaghie":10,"panaghioiu":138,"panaidor":18,"panait":10,"panama":10,"panamale":42,"panamalei":42,"panamalele":170,"panamalelor":170,"panamaua":42,"pan\u0103":2,"pandi":4,"pandichi":20,"pane":2,"panea":2,"panel":2,"panelul":10,"panelului":42,"paneluri":10,"panelurile":42,"panelurilor":170,"pane\u0219":2,"panete":10,"paneul":10,"paneului":26,"paneuri":10,"paneurile":90,"paneurilor":90,"pangrati":36,"panica":10,"panicai":10,"panicam":10,"panicar\u0103":42,"panicar\u0103m":42,"panicar\u0103\u021Bi":42,"panicare":42,"panicase":42,"panicasem":42,"panicaser\u0103":170,"panicaser\u0103m":170,"panicaser\u0103\u021Bi":170,"panicase\u0219i":42,"panica\u0219i":10,"panicat":10,"panica\u021Bi":10,"panicau":10,"panic\u0103":10,"panic\u0103m":10,"panicheaz\u0103":138,"panichez":10,"panicheze":74,"panichezi":10,"panici":2,"panicii":10,"panic\u00EEnd":10,"panii":2,"panilor":10,"paniova":18,"paniti":10,"panou":2,"panoul":10,"panoului":26,"panouri":10,"panourile":90,"panourilor":90,"panteleon":84,"panu":2,"panul":2,"panule":10,"panului":10,"parai":2,"parailor":26,"paraleilor":106,"param":2,"para\u0219i":2,"parat":2,"para\u021Bi":2,"parau":2,"par\u0103":2,"par\u0103m":2,"pareaz\u0103":18,"parez":2,"pareze":10,"parezi":2,"pariu":2,"pariul":10,"pariului":26,"pariuri":10,"pariurile":90,"pariurilor":90,"par\u00EEnd":2,"par\u00EEndu":18,"paroh":2,"parohi":2,"parohia":42,"parohie":42,"parohiei":42,"parohii":10,"parohiile":106,"parohiilor":106,"parohilor":42,"parohu":10,"parohul":10,"parohule":42,"parohului":42,"parol":2,"parola":10,"parol\u0103":10,"parole":10,"parolei":10,"parolele":42,"parolelor":42,"p\u0103ienjeni":82,"pedestri":18,"pedigri":10,"penalti":18,"pence":0,"pentateuh":84,"penthouse":8,"pepsi":4,"performance":36,"perpeli":20,"petroaia":34,"petroaica":66,"petroaie":34,"petroaiei":34,"petrof":2,"petroi":2,"petroianu":82,"petroiu":18,"petrom\u0103nean\u021B":82,"petrom\u0103nian\u021B":82,"petrone":18,"petronela":82,"petroniu":18,"petros":2,"petroschi":34,"petro\u0219":2,"petro\u0219el":18,"petro\u0219ni\u021Ba":162,"petrou":2,"petrova":18,"petrovai":18,"petrovan":18,"petrovanu":82,"petrovaselo":338,"petrovici":18,"petroviciu":82,"petrovi\u021Ba":82,"petrovschi":34,"pianissimo":164,"piano":4,"piar\u0103":4,"piasecki":20,"piaz\u0103":4,"picoti":10,"pieces":4,"pi\u00E8ces":4,"pieile":12,"pipeline":8,"pipelines":8,"pitchpine":16,"pluviose":20,"podidi":10,"pole":0,"poli\u0219ciuc":18,"ponce":0,"porni":4,"porridge":4,"porta":4,"portable":0,"portai":4,"portaj":4,"portaje":20,"portajele":84,"portajelor":84,"portajul":20,"portajului":84,"portal":4,"portalul":20,"portalului":84,"portaluri":20,"portalurile":340,"portalurilor":340,"portam":4,"portan":4,"portant":4,"portanta":36,"portant\u0103":36,"portante":36,"portantei":36,"portantele":164,"portantelor":164,"portantul":36,"portantului":164,"portan\u021Bi":4,"portan\u021Bii":36,"portan\u021Bilor":164,"portar":4,"portar\u0103":20,"portar\u0103m":20,"portar\u0103\u021Bi":20,"portare":20,"portari":4,"portarii":20,"portarilor":84,"portaru":20,"portarul":20,"portarule":84,"portarului":84,"portase":20,"portasem":20,"portaser\u0103":84,"portaser\u0103m":84,"portaser\u0103\u021Bi":84,"portase\u0219i":20,"porta\u0219i":4,"portat":4,"porta\u021Bi":4,"portau":4,"port\u0103rescu":148,"porteaz\u0103":36,"portez":4,"porteze":20,"portezi":4,"portic":4,"porticul":20,"porticului":84,"porticuri":20,"porticurile":340,"porticurilor":340,"portiera":52,"portier\u0103":52,"portiere":52,"portierei":52,"portierele":180,"portierelor":180,"porti\u021Ba":20,"porti\u021B\u0103":20,"porti\u021Be":20,"porti\u021Bei":20,"porti\u021Bele":84,"porti\u021Belor":84,"port\u00EEnd":4,"porto":4,"portoare":36,"portoarele":164,"portoarelor":164,"portor":4,"portorul":20,"portorului":84,"portoul":20,"portoului":52,"portouri":20,"portourile":180,"portourilor":180,"portret":4,"portreta":36,"portretai":36,"portretam":36,"portretar\u0103":164,"portretar\u0103m":164,"portretar\u0103\u021Bi":164,"portretare":164,"portretase":164,"portretasem":164,"portretaser\u0103":676,"portretaser\u0103m":676,"portretaser\u0103\u021Bi":676,"portretase\u0219i":164,"portretase\u021Bi":676,"portreta\u0219i":36,"portretat":36,"portretatu":164,"portreta\u021Bi":36,"portretau":36,"portret\u0103":36,"portret\u0103m":36,"portrete":36,"portreteaz\u0103":292,"portretele":164,"portretelor":164,"portretez":36,"portreteze":164,"portretezi":36,"portret\u00EEnd":36,"portret\u00EEndu":292,"portretul":36,"portretului":164,"portul":4,"portului":20,"porturi":4,"porturile":84,"porturilor":84,"posta":4,"postai":4,"postam":4,"postar\u0103":20,"postar\u0103m":20,"postar\u0103\u021Bi":20,"postare":20,"postase":20,"postasem":20,"postaser\u0103":84,"postaser\u0103m":84,"postaser\u0103\u021Bi":84,"postase\u0219i":20,"postase\u021Bi":20,"posta\u0219i":4,"postat":4,"postata":20,"postat\u0103":20,"postate":20,"postatei":20,"postatele":84,"postatelor":84,"postatu":20,"posta\u021Ba":20,"posta\u021B\u0103":20,"posta\u021Bi":4,"postau":4,"postav":4,"postava":20,"postav\u0103":20,"postavul":20,"postavului":84,"postavuri":20,"postavurile":340,"postavurilor":340,"post\u0103":4,"post\u0103m":4,"post\u0103vi":4,"post\u0103vii":20,"post\u0103vile":84,"post\u0103vilor":84,"postea":4,"posteai":4,"posteam":4,"posteanu":36,"posteasc\u0103":68,"postea\u021Bi":4,"posteau":4,"posteaz\u0103":36,"postei":4,"posteiu":20,"postelnecu":164,"poster":4,"postere":20,"posterele":84,"posterelor":84,"posterul":20,"posterului":84,"postesc":4,"postescu":36,"poste\u0219te":36,"poste\u0219ti":4,"posteuca":36,"posteuc\u0103":36,"posteuci":4,"posteucii":36,"posteucile":164,"posteucilor":164,"postez":4,"posteze":20,"postezi":4,"posti":4,"postic\u0103":20,"postii":4,"postim":4,"postind":4,"postindu":36,"postir\u0103":20,"postir\u0103m":20,"postir\u0103\u021Bi":20,"postire":20,"postise":20,"postisem":20,"postiser\u0103":84,"postiser\u0103m":84,"postiser\u0103\u021Bi":84,"postise\u0219i":20,"postise\u021Bi":20,"posti\u0219i":4,"postit":4,"postitu":20,"posti\u021Bi":4,"post\u00EEc\u0103":20,"post\u00EEnd":4,"post\u00EEndu":36,"postole":20,"postolea":20,"postovaru":84,"postovei":20,"postu":4,"postul":4,"postula":20,"postulache":84,"postulai":20,"postulam":20,"postular\u0103":84,"postular\u0103m":84,"postular\u0103\u021Bi":84,"postulare":84,"postulase":84,"postulasem":84,"postulaser\u0103":340,"postulaser\u0103m":340,"postulaser\u0103\u021Bi":340,"postulase\u0219i":84,"postulase\u021Bi":84,"postula\u0219i":20,"postulat":20,"postulatu":84,"postula\u021Bi":20,"postulau":20,"postul\u0103":20,"postul\u0103m":20,"postuleaz\u0103":148,"postulez":20,"postuleze":84,"postulezi":20,"postul\u00EEnd":20,"postul\u00EEndu":148,"postului":20,"postum":4,"postuma":20,"postum\u0103":20,"postume":20,"postumei":20,"postumele":84,"postumelor":84,"postumi":4,"postumii":20,"postumilor":84,"postumul":20,"postumului":84,"postura":20,"postur\u0103":20,"posturi":4,"posturii":20,"posturile":84,"posturilor":84,"praxiu":4,"preajma":16,"preajm\u0103":16,"pream\u0103ri":40,"pream\u00EEndri":72,"preaviz":12,"preaviza":44,"preavizai":44,"preavizam":44,"preavizar\u0103":172,"preavizar\u0103m":172,"preavizar\u0103\u021Bi":172,"preavizare":172,"preavizase":172,"preavizasem":172,"preavizaser\u0103":684,"preavizaser\u0103m":684,"preavizaser\u0103\u021Bi":684,"preavizase\u0219i":172,"preavizase\u021Bi":172,"preaviza\u0219i":44,"preavizat":44,"preavizatu":172,"preaviza\u021Bi":44,"preavizau":44,"preaviz\u0103":44,"preaviz\u0103m":44,"preavize":44,"preavizeaz\u0103":300,"preavizele":172,"preavizelor":172,"preavizez":44,"preavizeze":172,"preavizezi":44,"preaviz\u00EEnd":44,"preaviz\u00EEndu":300,"preavizul":44,"preavizului":172,"precump\u0103ni":164,"preg\u0103ti":20,"premiaz\u0103":52,"preorocu":40,"prepl\u0103ti":36,"prepr\u0103ji":36,"prescan":8,"prescean":8,"prescorni\u021Boiu":1352,"prescura":40,"prescur\u0103":40,"prescure":40,"prescurea":40,"prescuri":8,"prescurii":40,"prescurile":168,"prescurilor":168,"prescurniac":72,"presta":8,"prestabil":40,"prestabila":168,"prestabil\u0103":168,"prestabile":168,"prestabilea":164,"prestabileai":164,"prestabileam":164,"prestabileasc\u0103":2212,"prestabilea\u021Bi":164,"prestabileau":164,"prestabilei":168,"prestabilele":680,"prestabilelor":680,"prestabilesc":164,"prestabile\u0219te":1188,"prestabile\u0219ti":164,"prestabililor":680,"prestabilim":164,"prestabilind":164,"prestabilindu":1188,"prestabilir\u0103":676,"prestabilir\u0103m":676,"prestabilir\u0103\u021Bi":676,"prestabilire":676,"prestabilise":676,"prestabilisem":676,"prestabiliser\u0103":2724,"prestabiliser\u0103m":2724,"prestabiliser\u0103\u021Bi":2724,"prestabilise\u0219i":676,"prestabilise\u021Bi":676,"prestabili\u0219i":164,"prestabilit":164,"prestabilitu":676,"prestabili\u021Bi":164,"prestabilul":168,"prestabilului":680,"prestai":8,"prestam":8,"prestar\u0103":40,"prestar\u0103m":40,"prestar\u0103\u021Bi":40,"prestare":40,"prestase":40,"prestasem":40,"prestaser\u0103":168,"prestaser\u0103m":168,"prestaser\u0103\u021Bi":168,"prestase\u0219i":40,"prestase\u021Bi":40,"presta\u0219i":8,"prestat":8,"prestatu":40,"presta\u021Bi":8,"prestau":8,"prest\u0103":8,"prest\u0103m":8,"presteaz\u0103":72,"prestez":8,"presteze":40,"prestezi":8,"prest\u00EEnd":8,"prest\u00EEndu":72,"presto":8,"pre\u0219mereanu":296,"pre\u0219neanu":72,"preveni":20,"prevesti":36,"pricopsi":36,"primaquina":148,"prip\u0103\u0219i":20,"proasta":16,"proast\u0103":16,"proaste":16,"proastei":16,"proastele":80,"proastelor":80,"probozi":20,"procopsi":36,"prohibi":20,"prohodi":20,"prohorisi":84,"prop\u0103\u0219i":20,"propta":8,"propt\u0103":8,"propte":8,"proptea":8,"propteai":8,"propteala":72,"propteal\u0103":72,"propteam":8,"propteasc\u0103":136,"proptea\u021Bi":8,"propteau":8,"propteaua":72,"proptei":8,"proptele":40,"proptelei":40,"proptelele":168,"proptelelor":168,"proptelor":40,"proptesc":8,"propte\u0219te":72,"propte\u0219ti":8,"propti":8,"proptii":8,"proptim":8,"proptind":8,"proptindu":72,"proptir\u0103":40,"proptir\u0103m":40,"proptir\u0103\u021Bi":40,"proptire":40,"proptise":40,"proptisem":40,"proptiser\u0103":168,"proptiser\u0103m":168,"proptiser\u0103\u021Bi":168,"proptise\u0219i":40,"proptise\u021Bi":40,"propti\u0219i":8,"proptit":8,"proptitu":40,"propti\u021Bi":8,"proscanu":40,"proscomidi":168,"prospect":8,"prospecta":72,"prospectai":72,"prospectam":72,"prospectar\u0103":328,"prospectar\u0103m":328,"prospectar\u0103\u021Bi":328,"prospectare":328,"prospectase":328,"prospectasem":328,"prospectaser\u0103":1352,"prospectaser\u0103m":1352,"prospectaser\u0103\u021Bi":1352,"prospectase\u0219i":328,"prospectase\u021Bi":328,"prospecta\u0219i":72,"prospectat":72,"prospectatu":328,"prospecta\u021Bi":72,"prospectau":72,"prospect\u0103":72,"prospect\u0103m":72,"prospecte":72,"prospecteaz\u0103":584,"prospectele":328,"prospectelor":328,"prospectez":72,"prospecteze":328,"prospectezi":72,"prospect\u00EEnd":72,"prospect\u00EEndu":584,"prospectul":72,"prospectului":328,"prosper":8,"prospera":40,"prosperai":40,"prosperam":40,"prosperar\u0103":168,"prosperar\u0103m":168,"prosperar\u0103\u021Bi":168,"prosperare":168,"prosperase":168,"prosperasem":168,"prosperaser\u0103":680,"prosperaser\u0103m":680,"prosperaser\u0103\u021Bi":680,"prosperase\u0219i":168,"prosperase\u021Bi":168,"prospera\u0219i":40,"prosperat":40,"prosperatu":168,"prospera\u021Bi":40,"prosperau":40,"prosper\u0103":40,"prosper\u0103m":40,"prospere":40,"prosperei":40,"prosperele":168,"prosperelor":168,"prosperi":8,"prosperii":40,"prosperilor":168,"prosper\u00EEnd":40,"prosper\u00EEndu":296,"prosperul":40,"prosperului":168,"prost":0,"prostan":8,"prostana":40,"prostan\u0103":40,"prostane":40,"prostanei":40,"prostanele":168,"prostanelor":168,"prostani":8,"prostanii":40,"prostanilor":168,"prostanul":40,"prostanului":168,"prostata":40,"prostat\u0103":40,"prostate":40,"prostatei":40,"prostatele":168,"prostatelor":168,"prostea":8,"prosteai":8,"prosteala":72,"prosteal\u0103":72,"prosteam":8,"prosteasc\u0103":136,"prostea\u021Bi":8,"prosteau":8,"prosteli":8,"prostelii":40,"prostelile":168,"prostelilor":168,"prostesc":8,"proste\u0219te":72,"proste\u0219ti":8,"prosti":8,"prostia":40,"prostic":8,"prostica":40,"prostic\u0103":40,"prostice":40,"prosticei":40,"prosticele":168,"prosticelor":168,"prostici":8,"prosticii":40,"prosticilor":168,"prosticul":40,"prosticului":168,"prostie":40,"prostiei":40,"prostii":8,"prostiile":104,"prostiilor":104,"prostim":8,"prostime":40,"prostimea":40,"prostimi":8,"prostimii":40,"prostind":8,"prostindu":72,"prostir\u0103":40,"prostir\u0103m":40,"prostir\u0103\u021Bi":40,"prostire":40,"prostise":40,"prostisem":40,"prostiser\u0103":168,"prostiser\u0103m":168,"prostiser\u0103\u021Bi":168,"prostise\u0219i":40,"prostise\u021Bi":40,"prosti\u0219i":8,"prostit":8,"prostitu":40,"prosti\u021Bi":8,"prostrat":8,"prostrata":72,"prostrat\u0103":72,"prostrate":72,"prostratei":72,"prostratele":328,"prostratelor":328,"prostratul":72,"prostratului":328,"prostra\u021Bi":8,"prostra\u021Bii":72,"prostra\u021Bilor":328,"prostu":8,"prostul":8,"prostului":40,"pro\u0219ca":8,"pro\u0219can":8,"pro\u0219ti":0,"pro\u0219tii":8,"pro\u0219tilor":40,"protchi":8,"proveni":20,"pseudocilindri":1196,"psihic":4,"psihica":20,"psihic\u0103":20,"psihice":20,"psihicei":20,"psihicele":84,"psihicelor":84,"psihici":4,"psihicii":20,"psihicilor":84,"psihicul":20,"psihicului":84,"puerto":8,"purescript":8,"python":0,"quakec":0,"quechua":36,"quiche":0,"quin":0,"quincke":8,"quinn":0,"quint\u0103":8,"rablagi":18,"ralanti":18,"rapakivi":42,"rapakiwi":42,"ravioli":18,"r\u0103salalt\u0103ieri":332,"r\u0103salalt\u0103sear\u0103":2380,"reason":4,"rec\u0103s\u0103tori":170,"reciti":10,"rec\u00EEnt\u0103ri":82,"recl\u0103di":18,"reconverti":146,"recte":4,"rectul":4,"rectului":20,"recturi":4,"recturile":84,"recturilor":84,"recuceri":42,"redcode":4,"redeveni":42,"rednic":4,"redob\u00EEndi":74,"refgian":4,"refolosi":42,"reg\u0103si":10,"reggae":4,"reg\u00EEndi":18,"regneal\u0103":36,"regnul":4,"regnului":20,"regnuri":4,"regnurile":84,"regnurilor":84,"reinvesti":74,"re\u00EEnc\u0103lzi":74,"re\u00EEncol\u021Bi":74,"re\u00EEnflori":74,"re\u00EEns\u0103n\u0103to\u0219i":682,"re\u00EEnsufle\u021Bi":298,"re\u00EEntineri":170,"re\u00EEnt\u00EElni":74,"re\u00EEntregi":74,"re\u00EEnverzi":74,"re\u00EEnvesti":74,"remake":2,"remba\u0219":4,"remghea":4,"renchez":4,"rende\u0219":4,"rendez":4,"renghea":4,"rep\u0103r\u021Bi":18,"repciuc":4,"reporni":18,"repovesti":74,"repta":4,"resca\u0219iu":20,"rescu":4,"reslescu":36,"resmeli\u021B\u0103":84,"resmeri\u021B\u0103":84,"respir":4,"respira":20,"respirai":20,"respiram":20,"respirar\u0103":84,"respirar\u0103m":84,"respirar\u0103\u021Bi":84,"respirare":84,"respirase":84,"respirasem":84,"respiraser\u0103":340,"respiraser\u0103m":340,"respiraser\u0103\u021Bi":340,"respirase\u0219i":340,"respirase\u021Bi":84,"respira\u0219i":20,"respirat":20,"respiratu":84,"respira\u021Bi":20,"respirau":20,"respir\u0103":20,"respir\u0103m":20,"respire":20,"respiri":4,"respir\u00EEnd":20,"respir\u00EEndu":148,"respirul":20,"respirului":84,"ressu":4,"restabili":82,"resta\u0219":4,"restei":4,"resteie":20,"resteiele":84,"resteielor":84,"resteman":20,"reste\u0219an":20,"resteu":4,"resteul":20,"resteului":52,"restie":4,"restitutio":340,"restivan":20,"restul":4,"restului":20,"resturi":4,"resturile":84,"resturilor":84,"res\u021Bea":4,"resvedeanu":148,"re\u0219ca":4,"re\u0219can":4,"re\u0219c\u0103":4,"re\u0219ce":4,"re\u0219ceanu":36,"re\u0219cei":4,"re\u0219cele":20,"re\u0219celor":20,"re\u0219cu\u021Ba":20,"re\u0219te":4,"re\u0219tea":4,"retopi":10,"reuma":4,"reum\u0103":4,"reume":4,"reumei":4,"reumele":20,"reumelor":20,"reunion":4,"reu\u0219i":6,"reuter":0,"reveni":10,"revnic":4,"revopsi":18,"revu\u021Bchi":18,"rezban":4,"rezidi":10,"rezluc":4,"rezmeri\u021B\u0103":84,"rezme\u0219":4,"rezmeuve\u0219":36,"rezmive\u0219":20,"rocaille":2,"rodi":2,"romarta":0,"romexpo":0,"romsteel":4,"room":0,"roop":0,"rubruquis":18,"rugbi":4,"russe":0,"russes":0,"safe":0,"saligny":8,"sather":0,"scheme":0,"schience":8,"segno":2,"selfie":4,"semicilindri":298,"sensetalk":16,"sequencel":2,"sfecli":4,"shake":0,"showroom":8,"sida":0,"sierra":8,"sierrei":8,"sih\u0103stri":18,"sinchisi":36,"siun":0,"s\u00EEntilie":8,"skateboard":16,"slide":0,"smalltalk":16,"smartphone":16,"smithiantha":36,"smithson":16,"smoothie":8,"soffioni":20,"software":8,"somali":10,"source":0,"sovrom":4,"space":0,"spaniel":4,"speakeasy":16,"speedcode":16,"squeak":0,"squirrel":16,"standart":16,"steeplechase":72,"street":0,"striptease":16,"strongtalk":32,"style":0,"subarba":18,"subarb\u0103":18,"subarbe":18,"subarbei":18,"subarbele":82,"subarbelor":82,"suba\u0219a":10,"suber":2,"suberina":42,"suberin\u0103":42,"suberine":42,"suberinei":42,"suberul":10,"suberului":42,"subit":2,"subita":10,"subit\u0103":10,"subite":10,"subitei":10,"subitele":42,"subitelor":42,"subitul":10,"subitului":42,"subi\u021Bi":2,"subi\u021Bii":10,"subi\u021Bilor":42,"sublim":2,"sublima":18,"sublimai":18,"sublimam":18,"sublimar\u0103":82,"sublimar\u0103m":82,"sublimar\u0103\u021Bi":82,"sublimare":82,"sublimase":82,"sublimasem":82,"sublimaser\u0103":338,"sublimaser\u0103m":338,"sublimaser\u0103\u021Bi":338,"sublimase\u0219i":82,"sublimase\u021Bi":82,"sublima\u0219i":18,"sublimat":18,"sublimatu":82,"sublima\u021Bi":18,"sublimau":18,"sublim\u0103":18,"sublim\u0103m":18,"sublime":18,"sublimeaz\u0103":146,"sublimei":18,"sublimele":82,"sublimelor":82,"sublimez":18,"sublimeze":82,"sublimezi":18,"sublimi":2,"sublimii":18,"sublimilor":82,"sublimitate":338,"sublimitatea":338,"sublimit\u0103\u021Bi":82,"sublimit\u0103\u021Bii":338,"sublimit\u0103\u021Bile":1362,"sublimit\u0103\u021Bilor":1362,"sublim\u00EEnd":18,"sublim\u00EEndu":146,"sublimul":18,"sublimului":82,"subodie":10,"subota":10,"subra":2,"subra\u021B":2,"subra\u021Be":18,"subra\u021Bele":82,"subra\u021Belor":82,"subra\u021Bul":18,"subra\u021Bului":82,"subraul":18,"subraului":50,"subrauri":18,"subraurile":178,"subraurilor":178,"subreta":18,"subret\u0103":18,"subrete":18,"subretei":18,"subretele":82,"subretelor":82,"subreto":18,"subzidi":20,"superioara":170,"superioar\u0103":170,"superioare":170,"superioarei":170,"superioarele":682,"superioarelor":682,"superior":42,"superiori":42,"superiorii":106,"superiorilor":362,"superiorul":106,"superiorului":362,"supra\u00EEnc\u0103lzi":594,"supranumi":82,"swahili":20,"swazi":4,"\u0219uti":2,"take":0,"takeaway":8,"talkie":0,"tanti":4,"tarom":0,"tartuffe":4,"technology":168,"tehoptimed":68,"teleac":2,"teleaga":18,"teleag\u0103":18,"teleap":2,"telearc\u0103":34,"telea\u0219\u0103":18,"telecom":8,"telegi":2,"telegii":10,"telejman":18,"telejna":18,"telembici":18,"telenche":18,"telescu":18,"tele\u0219man":18,"tele\u0219pan":18,"teleuc\u0103":18,"t\u00E8ne":0,"termocom":16,"time":0,"tiramis\u00F9":42,"topless":4,"topspeed":4,"totuna":12,"trade":0,"trance":0,"transa":8,"trans\u0103":8,"transcria":136,"transcriai":136,"transcriam":136,"transcria\u021Bi":136,"transcriau":136,"transcrie":136,"transcriem":136,"transcriere":392,"transcrie\u021Bi":136,"transcrii":8,"transcriind":136,"transcriindu":648,"transcript":8,"transcris":8,"transcrise":136,"transcrisei":136,"transcriser\u0103":648,"transcriser\u0103m":648,"transcriser\u0103\u021Bi":648,"transcrisese":648,"transcrisesem":648,"transcriseser\u0103":2696,"transcriseser\u0103m":2696,"transcriseser\u0103\u021Bi":2696,"transcrisese\u0219i":648,"transcrisese\u021Bi":648,"transcrise\u0219i":136,"transcrisu":136,"transcriu":8,"transe":8,"transei":8,"transele":40,"transelor":40,"transept":8,"transeptul":72,"transeptului":328,"transepturi":72,"transepturile":1352,"transepturilor":1352,"transfer":8,"transfera":72,"transferai":72,"transferam":72,"transferar\u0103":328,"transferar\u0103m":328,"transferar\u0103\u021Bi":328,"transferare":328,"transferarea":328,"transferase":328,"transferasem":328,"transferaser\u0103":1352,"transferaser\u0103m":1352,"transferaser\u0103\u021Bi":1352,"transferase\u0219i":328,"transferase\u021Bi":328,"transfera\u0219i":72,"transferat":72,"transferatu":328,"transfera\u021Bi":72,"transferau":72,"transfer\u0103":72,"transfer\u0103m":72,"transfer\u0103ri":72,"transfer\u0103rii":328,"transfer\u0103rile":1352,"transfer\u0103rilor":1352,"transfere":72,"transferi":8,"transfer\u00EEnd":72,"transfer\u00EEndu":584,"transferul":72,"transferului":328,"transferuri":72,"transferurile":1352,"transferurilor":1352,"transpir":8,"transpira":72,"transpirai":72,"transpiram":72,"transpirar\u0103":328,"transpirar\u0103m":328,"transpirar\u0103\u021Bi":328,"transpirare":72,"transpirase":328,"transpirasem":328,"transpiraser\u0103":1352,"transpiraser\u0103m":1352,"transpiraser\u0103\u021Bi":1352,"transpirase\u0219i":1352,"transpirase\u021Bi":328,"transpira\u0219i":72,"transpirat":72,"transpiratu":328,"transpira\u021Bi":72,"transpirau":72,"transpir\u0103":72,"transpir\u0103m":72,"transpire":72,"transpiri":8,"transpir\u00EEnd":72,"transpir\u00EEndu":584,"treilea":12,"trist":0,"trista":8,"trist\u0103":8,"triste":8,"tristei":8,"tristele":40,"tristelor":40,"tristu":8,"tristul":8,"tristului":40,"tri\u0219nevschi":72,"tri\u0219te":8,"tri\u0219tea":8,"tri\u0219ti":0,"tri\u0219tii":8,"tri\u0219tile":40,"tri\u0219tilor":40,"tsunami":20,"typescript":8,"\u021Binghilinghi":292,"\u021B\u00EE\u0219ni":4,"ubercode":8,"uita":2,"uitai":2,"uitam":2,"uitar\u0103":10,"uitar\u0103m":10,"uitar\u0103\u021Bi":10,"uitare":10,"uitase":10,"uitasem":10,"uitaser\u0103":42,"uitaser\u0103m":42,"uitaser\u0103\u021Bi":42,"uitase\u0219i":42,"uitase\u021Bi":10,"uita\u0219i":2,"uitat":2,"uitatu":10,"uita\u021Bi":2,"uitau":2,"uit\u0103":2,"uit\u0103m":2,"uite":2,"uit\u00EEnd":2,"uit\u00EEndu":18,"ui\u021Bi":0,"unchia\u0219":2,"unchia\u0219e":34,"unchia\u0219i":2,"unchia\u0219ii":34,"unchia\u0219ilor":162,"unchia\u0219u":34,"unchia\u0219ul":34,"unchia\u0219ule":162,"unchia\u0219ului":162,"uneori":5,"unesco":0,"unghiar\u0103":34,"unicef":0,"uniface":4,"uracil":2,"usla":0,"veni":2,"venture":4,"via\u021Ba":4,"via\u021B\u0103":4,"vicea":2,"viceaua":18,"vicleim":18,"vintage":4,"vivendi":18,"vizavi":10,"voodoo":4,"voxtel":0,"walkie":0,"watergate":18,"webassembly":148,"website":4,"wide":0,"woogie":4,"xquery":0,"xuequin":4,"yucca":4,"zadnipru":18,"zaharisi":42,"zbiar\u0103":8,"zburli":8,"zg\u00EEnd\u0103ri":40,"zg\u00EErcibab\u0103":32,"zoina":4,"zoi\u021Ba":4,"zombi":4,"zoom":0,"zoomul":4,"zoomului":20,"zoomuri":4,"zoomurile":84,"zoomurilor":84,"zoopsia":42,"zoopsii":10,"zvoni":4},"CE":{"abdominalgi":74,"abidjan":5,"abiet":5,"ablact":2,"ablaut":18,"ableg":2,"abrevier":41,"academi":21,"acetaldehi":9,"acetami":9,"acetazolamid":345,"acetoarsen":84,"acetonemi":101,"acetonuri":37,"acheule":17,"acianopsi":85,"acidamin":25,"aciua":9,"acromatopsi":329,"acroparestezi":1353,"acrostih":9,"acrostol":9,"actinopterigi":298,"adagietto":69,"adamstown":17,"adenalgi":41,"adenectom":41,"adenectop":41,"adenodin":25,"adenoftalm":41,"adenoncoz":41,"admonesta":74,"adumbr":2,"aerenchim":21,"aeroambulan\u021B":171,"aerodontalg":141,"aeroreacto":171,"aerospa\u021Bial":331,"aerostat":11,"aerotransport":267,"afrikaand":137,"afrikaans":137,"afuma\u021Biul":149,"ageuz":5,"aghia\u0219":17,"aghiesm":33,"aghiu\u021B":9,"agnos":1,"agnoz":1,"agreement":17,"agroaliment":88,"agroindustr":40,"airbusul":36,"airbusur":36,"ajusta":9,"albaspin":10,"albgard":4,"albinioar":138,"albuminuri":74,"alcoolemi":106,"aldosteron":74,"altdorf":4,"althorn":4,"altostratu":138,"alzheimer":36,"amaltheus":73,"amblistom":18,"amerindi":41,"amfiartroz":42,"amfineur":42,"amfioc\u0219":10,"amfiox":10,"amiaz":9,"amiez":9,"amigdalectomi":1353,"aminoaci":21,"amnez":1,"amoniuri":21,"amperormetr":82,"anaerob":14,"anafrodiz":38,"anagnos":6,"anagno\u0219":6,"analfab":10,"analgez":10,"analgosed":42,"anamnez":5,"anarhoindiv":169,"anartri":10,"anastaltic":69,"anastatic":37,"anastigma":70,"anastomotic":165,"anastomoz":37,"anchilostom":82,"anchilostomiaz":2642,"andrioa":18,"androster":18,"aneantiz":21,"anecoi":6,"anemiaz":21,"anemiez":21,"anemostat":21,"anencefal":42,"anergi":10,"anestez":9,"aneur":13,"anevoin\u021B":21,"angio":10,"aniconic":22,"anion":2,"anionactiv":82,"anistor":10,"anizocitoz":86,"anizogam":22,"anizometro":86,"anizotrop":22,"anoftalm":10,"anonim":6,"anonym":6,"anorex":6,"anorgan":10,"anorhid":10,"anosm":2,"anovar":6,"anoxem":6,"anoxi":6,"antalgic":20,"antanaclaz":44,"antanagog":44,"antapex":4,"antarctic":36,"antarctid":36,"antepenultim":74,"antepre\u0219colar":586,"antieurop":58,"antiperistal":170,"antonim":4,"antozoar":42,"antrectom":40,"antropogeograf":850,"antroponim":98,"antroponomastic":2402,"anuri":6,"apartheid":17,"apendicectomi":1321,"apnee":1,"apogiatur":37,"apostat":9,"apostilb":5,"appassionat":146,"apropiat":41,"apter":2,"aquitan":9,"aramaic":21,"arameic":21,"areal":5,"aresta":9,"arheograf":26,"arheopter":26,"arioso":9,"armstrong":4,"arterioscleroz":106,"artralgi":34,"arzmahzar":36,"ascorbic":17,"asista":9,"aspermat":17,"aspirit":9,"astatiz":9,"astereogno":105,"astigmat":17,"astup":1,"ateroscler":21,"atesta":9,"atestat":9,"athos":1,"atoate\u0219tiut":297,"atot\u0219tiut":73,"atribuibil":105,"audiobook":155,"augsburg":8,"auramin":13,"autarhi":5,"autoa":11,"autoar":3,"autocopia":171,"autohton":19,"autoignor":43,"autoimpune":171,"autoinduc\u021B":43,"autoinfec\u021B":43,"autointitul":171,"autointoxic":171,"autopsi":21,"autosport":10,"autostop":10,"autostrad":10,"autostr\u0103z":10,"autotransform":267,"autotransport":267,"avantbec":17,"azeotrop":13,"azerbaidjan":73,"azotemi":25,"azoturi":9,"babyschi":10,"babyschilift":10,"bacilemi":50,"background":8,"backhand":8,"backupu":40,"bacteriostaz":212,"bacteriuri":84,"badgeu":16,"badland":4,"baedeker":20,"bancnot":8,"bancru":8,"bangkok":8,"bangladeshian":1188,"bangladeshien":1188,"bankcoop":8,"barquisimeto":676,"batho":2,"bathor":2,"batiscaf":10,"b\u0103diuli\u021B":18,"b\u0103i\u021Bui":20,"b\u0103lc\u0103u\u021Biul":308,"beachbar":16,"beethoven":36,"benchmark":16,"bergman":8,"bernstein":8,"bern\u0219tain":8,"berthelot":32,"bethleem":8,"beu\u021B":4,"bicf\u0103l\u0103u":20,"bielefeld":20,"bielet":4,"bielorus":20,"biel\u0219ug":8,"bie\u0219t":2,"biftec":0,"bijghir":4,"bilbor":4,"bilc":0,"bildungsroman":132,"bimba\u0219":0,"bimzui":0,"binder":0,"bindis":0,"binocl":4,"binocular":4,"birj":0,"birlic":0,"birman":0,"birnic":0,"birt":0,"bisanual":44,"biscui":0,"bismut":0,"bistabil":18,"bistri\u021B":0,"bistrou":0,"bisturi":0,"bi\u0219ni\u021B":0,"bi\u0219tar":4,"bitcoin":4,"bitter":0,"biunivoc":22,"bivuac":10,"blagoslov":20,"blanquism":136,"blanquist":136,"blasfemi":40,"blasfemiaz":168,"blasfemiez":168,"blefaroptoz":84,"bleumarin":8,"blochaus":8,"blockbuster":16,"bluejean":8,"blues":8,"bogheadu":68,"boksburg":8,"boln\u0103vioar":276,"boln\u0103vior":148,"bookingu":68,"booku":4,"boomu":4,"booster":8,"botswan":8,"bradipsih":20,"brahistocron":20,"braunitu":40,"bridgetown":32,"briefing":8,"broccoliu":168,"bronhoanveolar":1704,"bronhopneumon":808,"buchenwald":34,"buciard":34,"buenos":4,"buib":4,"buic":4,"buicani":4,"buice\u0219ti":4,"buig":4,"building":8,"buimac":4,"buimat":4,"buim\u0103c":4,"bujie":10,"bullfinch":8,"bun\u0103star":10,"bun\u0103st\u0103r":10,"bushel":2,"cadmiez":20,"cafein":10,"calcemi":20,"calcutti":20,"canioan":34,"canion":18,"caniot":18,"caraib":10,"caraliu":42,"carboxi":8,"carlsburg":16,"carmaniol":148,"carpoptoz":20,"cartnic":8,"castaniet":148,"catamnez":20,"catharsi":34,"cation":4,"cauc":2,"caudill":20,"cauzalgi":10,"cazuar":10,"c\u0103in":2,"c\u0103t\u0103nioar":138,"cefalalgi":18,"cehoslovac":74,"celostat":10,"cenestezi":84,"centramerica":688,"cerargi":20,"cerargirit":4,"cercospor":20,"cerebrospin":74,"cerithium":74,"cernoziom":148,"cetonuri":18,"cetosteroi":10,"champleve":80,"charleston":64,"checklist":16,"cheeseburger":288,"cheflii":8,"chefliu":8,"chei\u021B":4,"cheoto":12,"chiant":16,"chimiosint":52,"chinaldin":8,"chinestezi":168,"chintesen":48,"chiomb":16,"chiomp":16,"ciabatt":4,"ciacal":4,"ciachi":4,"ciac\u00EEi":4,"ciacl":4,"ciacon":4,"ciacov":4,"ciad":4,"cianamid":26,"ciancobalamin":298,"cicloalcan":82,"ciclostom":18,"ciftl\u00EEc":8,"cilindruri":146,"cincisprezec":272,"cincisut":16,"cincizeci":16,"cinorex":12,"cinquecent":36,"cioma":4,"ciom\u0103":4,"ciome":4,"ciomp":8,"cirenaic":42,"cirostrat":10,"cirostratu":138,"cirrostratu":276,"cisalpin":20,"cisiordan":44,"cisiord\u0103n":44,"citodiagnostic":1130,"c\u00EErcserdar":8,"clarobscur":40,"claus":4,"cleistogam":84,"climostat":20,"cli\u0219eiz":20,"cloramin":24,"cloretan":24,"cloreton":24,"cloroanemi":180,"cloroleucit":212,"cnocaut":8,"coabit":6,"coachiz":6,"coacuz":6,"coalescen":38,"coali\u021B":6,"coaliz":6,"coapta":2,"coarticul":42,"coasocia":22,"coaut":6,"coaxi":6,"cobalamin":18,"cockpit":8,"cocktail":8,"cocost\u00EErc":10,"codalb":4,"cod\u0103lb":4,"cod\u0103lbial":148,"cod\u0103lbiel":148,"codro\u0219":4,"coexista":38,"cofein":10,"colalgol":20,"colargol":4,"colemi":12,"colenchim":20,"coleopter":26,"coleoptil":26,"colerez":12,"colester":10,"colinerg":10,"colinergic":18,"colinesteraz":18,"colivioar":138,"comintern":4,"companioan":276,"companion":148,"compostat":36,"condolean":84,"confetti":36,"coniac":18,"conquist":68,"consommeu":164,"contagiozit":212,"contesta":36,"conteu":20,"contracc":4,"contract":4,"contrac\u021B":4,"contraindic":164,"contrainform":36,"contralto":68,"contrascot":36,"contraspion":292,"contrastant":68,"contrastan\u021B":68,"conurba\u021B":20,"copiativ":26,"copiatoar":10,"copiator":10,"copioas":10,"copios":10,"copio\u0219":10,"copiu\u021B":10,"coproscleroz":274,"coprostaz":18,"coprosterol":146,"copywriter":10,"copywriting":74,"cor\u0103biel":74,"corectopi":20,"coreic":10,"coronasceptic":554,"corticoster":84,"coslujit":18,"costalgi":8,"co\u0219averaj":44,"coulomb":4,"countryu":72,"coxalgi":4,"coxartroz":20,"crear":4,"crea\u021Bi":4,"creekul":8,"creekuri":8,"crestat":8,"creuzet":12,"criosco":12,"criostat":12,"criptonim":16,"criptorhidi":80,"criselefan":88,"croat":4,"croa\u021B":4,"cromafin":24,"cromatopsi":164,"cromoalgraf":84,"cromoprotei":660,"cromopsi":40,"cronaxi":24,"cronic":4,"crossbar":16,"crossing":16,"cruiser":8,"cuest":8,"cui\u0219ori\u021B":6,"cumulostratu":554,"cuneiform":26,"cuproxi":8,"curiepunct":18,"curieterap":18,"curtui\u0219eni":32,"deaferent":22,"deambula":42,"decafein":42,"decalc":2,"decalcifier":338,"decalv":2,"decant":2,"decapsul":2,"decarbon":18,"decarboxil":98,"decarbur":18,"decart":2,"decaster":10,"decastil":18,"deceuri":10,"decister":10,"decofein":42,"dediul":16,"deflui":18,"degusta":18,"deific":6,"dejurstv":66,"delcou":20,"deleatur":26,"delfin":4,"delineavit":106,"delni\u021B":20,"delt":0,"deltaic":20,"demachia":74,"demiurg":10,"dend":0,"dens":0,"densu\u0219":0,"dent":0,"denuclear":74,"deodor":6,"deonce\u0219ti":8,"deontolog":42,"deoseb":6,"depeiz":10,"depista":18,"deproteiniz":210,"derby":4,"derbyu":20,"derm":0,"dermatalgi":36,"dern":0,"dersc":0,"der\u0219id":0,"desa":2,"des\u0103":2,"desc\u0103z":2,"descrier":34,"descrip":2,"descuia":20,"descuie":20,"dese":2,"desi":0,"desktop":8,"desmierd":68,"desmierz":68,"desn\u0103\u021Bu":0,"deso":0,"despecetlui":596,"despera\u021B":18,"despintec":34,"despr\u0103fui":164,"destabiliz":82,"destaliniz":82,"destructur":66,"destrun":2,"desu":0,"de\u0219eu\u00EEnd":74,"detesta":18,"deuteriu":20,"deutero":20,"deutschland":64,"devasta":18,"devier":10,"dextr":0,"dezagreabil":204,"dezastruo":146,"dezavua":44,"dezavu\u0103":44,"dezavu\u00EE":44,"dezer\u021Biun":82,"dezesperan":82,"deze\u0219t":0,"dezinvoltur":146,"dezmierd":68,"dezmierz":68,"dezolatoar":42,"dezolator":42,"dezoxicorticoster":5420,"diabolo":4,"diacone\u0219ti":20,"diaftorez":38,"diagno":6,"diareic":22,"diaspore":6,"diastaltic":6,"diastaz":6,"diastem":6,"diastol":6,"diastrat":6,"diastrof":6,"diaul":6,"diavol":4,"dibrometan":34,"dicromatopsi":658,"dictiocaul":180,"diesel":4,"dietanolamin":150,"difeniloxi":74,"diftong":2,"dimetilformami":1098,"diplopi":8,"diplur":8,"dipnoi":2,"diptic":2,"disagio":12,"disartri":20,"discountu":132,"discromatops":292,"disec\u021Bi":2,"disensiun":210,"disenteri":20,"diserta\u021Bi":82,"disestez":20,"disidente":74,"disidentu":74,"disiden\u021B":10,"disilabic":42,"disimetri":42,"disimil":10,"disimul":10,"disoci":10,"disodia":12,"disodie":12,"disodii":12,"disodilic":42,"disolut":10,"disolu\u021B":10,"disonan":10,"disosmi":4,"dispera\u021Bi":18,"distih":2,"distomatoz":82,"distomiaz":84,"disuasiv":26,"dittersdorf":68,"diulben":8,"dixieland":18,"dizabilit":42,"dizenter":20,"dizeur":2,"dizeuz":2,"dizmierd":68,"dizolv":2,"djibouti":36,"doisprezec":68,"donjuanism":20,"dopioni":18,"dopionu":18,"dou\u0103sprezecim":650,"download":8,"dreptcredin":144,"dreptunghi":16,"drivelob":16,"duan":2,"duarh":2,"dudgeon":18,"dumbr\u0103vioar":548,"dumnezeir":84,"duraci":4,"duralumin":44,"ebuliosco":53,"echidn":0,"eching":0,"echipier":41,"echiunitar":89,"ecospeci":5,"ecuador":45,"ecuator":5,"ecua\u021B":5,"electroacustic":1225,"electroanaliz":713,"electrodiagno":841,"electromiogra":841,"electronvol":137,"electrostric\u021Biun":10312,"elicostat":21,"emistih":5,"emojiu":20,"enarmon":10,"endarter":20,"endecasilab":170,"endemi":10,"endemoepidem":362,"endoreic":42,"endorfin":18,"endosmoz":4,"eneacord":13,"eneasilab":13,"engineering":74,"enoftal":10,"entamib":12,"enteralg":18,"enterectaz":82,"enterectom":82,"enteroanastomoz":2666,"entitat":10,"entit\u0103\u021B":10,"entomostrace":554,"entors":2,"entozoar":42,"entropi":18,"entuzias":42,"enuclea":36,"eoantrop":11,"epicureic":85,"epidemi":21,"epigastralgi":549,"episcen":5,"episcopal":41,"episcopat":41,"episcopi":41,"epistaxis":41,"epistemic":41,"epistemolog":169,"epistil":9,"epistolar":41,"epistrof":9,"epizoar":20,"eponim":2,"epopeic":21,"equinap\u021B":9,"equinop\u021B":9,"equiset":9,"equita\u021B":9,"ergosterol":74,"eritremi":37,"esaveraj":2,"establishmen":266,"e\u0219ua":5,"etilenoxi":37,"etiop":5,"etnopsiholog":330,"eupnee":3,"eurasi":13,"euroatlantic":283,"eurosceptic":139,"eusemi":11,"evreim":9,"exacerb":6,"exarh":2,"exc":0,"exf":0,"exhaust":10,"exilarh":9,"ex\u00EEnscr":10,"exoftalm":10,"exoniroz":22,"exora\u021B":6,"exorbitan":42,"exorci":0,"exosmoz":10,"exostoz":10,"exp":0,"expiabil":26,"expiat":10,"expier":10,"ext":0,"extenua":42,"extenu\u0103":42,"extenu\u00EE":42,"extracte":34,"extractiv":34,"extractoar":34,"extractor":34,"extractu":34,"extrac\u021B":2,"extraperitoneal":5458,"extrapleural":402,"extrastatut":146,"extra\u0219colar":146,"exulcera\u021B":42,"exuvia":5,"facebooku":136,"facelift":8,"farniente":68,"fault":2,"faustpatro":82,"f\u0103in":2,"feedback":8,"feeling":4,"feldwebel":40,"fenacetin":4,"fenilalanin":18,"fenilamin":18,"fiar":4,"fiasco":8,"fiction":36,"fie\u0219car":10,"fie\u0219c\u0103r":10,"fijian":10,"fijien":10,"filmostat":20,"filmpac":8,"filoft":2,"filoslav":10,"firoscoas":10,"firoscos":10,"firosco\u0219":10,"fitogeo":42,"fitosocio":170,"fitosterol":74,"fiul":2,"fizostigmin":10,"f\u00EEnt\u00EEnioar":276,"flancgard":16,"flancg\u0103rz":16,"flashback":16,"flashmob":16,"foehnu":8,"foodu":4,"formaldehi":168,"fotoaparat":90,"fotocopia":170,"fotocopie":170,"fotodezintegr":330,"fotomozaic":170,"fotosculptur":266,"fractostratu":552,"francmason":80,"frankfurt":16,"fr\u0103\u021Bio":20,"freelancer":72,"freetown":8,"freudian":40,"freudien":40,"freudism":8,"fuhrer":4,"f\u00FChrer":4,"fuitui":4,"fukushim":10,"furioso":18,"gadget":2,"gagliard":66,"galvanosteg":84,"galvanostereotip":6740,"gastralgi":4,"gastrectomi":324,"gaudeamus":52,"g\u0103in":2,"gentilom":36,"gentlem":4,"geoagiu":8,"geogel":4,"geomal":4,"georg":8,"georgic":10,"georocel":20,"georocu":20,"gestaltism":34,"gestapo":2,"gesta\u021Bi":20,"ghiocei":12,"ghiocel":12,"ghiomot":40,"ghionoa":12,"giac\u0103\u0219":4,"gialacu":20,"giard":8,"giarma":8,"gielsdorfian":656,"gigantostrac":82,"ginandri":4,"ginzburg":8,"gionat":4,"giravi":4,"girostat":10,"g\u00EEtleg":4,"glaciol":20,"glicemi":20,"glicozuri":36,"glucksburg":32,"glucozuri":36,"gnatostom":20,"goalkeeper":72,"godiul":18,"golaveraj":44,"gonartroz":20,"gostat":2,"graffitiu":168,"grafie":20,"grefier":20,"grizzlyu":80,"groom":8,"guineobissauan":1334,"guineoecuator":886,"gulfstream":8,"gusta":4,"gu\u021Biul":18,"habsburg":8,"haciend":34,"haendel":8,"hagial\u00EEc":18,"handoutu":40,"hardpan":8,"hashtag":8,"hauteriv":20,"h\u0103r\u0219ne":8,"h\u0103r\u0219ni":8,"helmintospor":164,"hemangio":20,"hemaralop":74,"hemartroz":20,"hematemez":50,"hematoam":10,"hematofob":42,"hematogen":42,"hematoloag":42,"hematolog":42,"hematom":10,"hematuri":50,"hemeostaz":26,"hemeralop":74,"hemianestez":170,"hemianops":42,"hemodiagnostic":1130,"hemoglobinuri":586,"hemoptiz":10,"hemostaz":10,"heptatlon":8,"heptoda":8,"heptod\u0103":8,"heptode":8,"hermafrodi":24,"hesperornis":164,"heteronim":18,"hexastic":18,"hexastih":10,"hexastil":18,"hexod":4,"hiacint":6,"hiad":2,"hial":2,"hidremi":18,"hidroalcool":338,"hidroamel":50,"hidroavi":18,"hidroftalm":34,"hidroizopiez":690,"hidroscal":18,"hidroxilamin":152,"higrostat":18,"hioid":6,"hipericac":34,"hipericin":34,"hiperide":42,"hiperion":42,"hiperon":2,"hipoacid":26,"hipoacuz":26,"hipoazot":26,"hipoglicemi":330,"hiporchem":18,"hiposceni":10,"hipostaz":10,"hipostil":18,"histamin":24,"histerectom":164,"histerezis":84,"histoauto":116,"hobbyu":20,"hocheist":18,"hochei\u0219t":18,"holdup":8,"hollywood":144,"holocaust":138,"homeless":8,"homeschool":264,"homework":8,"homojdi":18,"iconostas":21,"iconostro":21,"ideal":5,"idiostil":13,"ignar":1,"ignor":1,"imbrogliou":274,"impiet":10,"imposta\u021Bi":18,"imprescrip":18,"inabil":6,"inabordabil":166,"inacceptabil":330,"inaccesibil":170,"inacomodabil":342,"inacordabil":166,"inact":2,"inac\u021B":2,"inadaptabil":166,"inadecv":6,"inaderen":22,"inadmisibil":170,"inadverten":74,"inalien":22,"inalterabil":170,"inamic":6,"inamovibil":86,"inanim":6,"inani\u021B":6,"inaparen":22,"inapeten":22,"inaplic":6,"inaprec":6,"inapt":2,"inap\u021B":2,"inatacabil":86,"inaugur":10,"inavuabil":54,"incoativ":26,"incrusta":34,"indescrip":10,"indestruc":10,"indru\u0219aim":82,"inechit":6,"inecua\u021B":22,"inedit":6,"inedi\u021B":6,"inefabil":22,"inefic":6,"inegal":6,"inelegan":22,"ineligibil":86,"ineluctabil":166,"inestetic":42,"inestimabil":170,"inevitabil":86,"inexac":6,"inexigibil":86,"inexisten":38,"inexperien\u021B":170,"inexperiment":170,"inexpiabil":106,"inexplicabil":330,"inexploatabil":650,"inexplor":10,"inexplozibil":330,"inexpresiv":74,"inexprimabil":330,"inexpugnabil":330,"inextensibil":330,"inextingibil":330,"inextirpabil":330,"inextricabil":330,"infailibil":90,"infectocontagio":10834,"infesta":18,"infodemi":42,"infract":2,"infrac\u021B":2,"infrastructur":530,"inimaginabil":342,"inimici\u021B":22,"inimitabil":86,"inintelig":42,"innsburck":8,"inobservabil":330,"inodor":6,"inofensiv":38,"inoperab":22,"inoperan":22,"inopin":6,"inoportun":38,"inopozabil":86,"inorganic":42,"inospitalier":170,"inoxidabil":86,"insista":18,"instrui":34,"insubordon":82,"interactiv":82,"interac\u021B":18,"interalia":178,"interastral":82,"interatomic":178,"interesan":42,"interesar":42,"interetnic":82,"interimar":42,"interimat":42,"interinstitu\u021Bional":27218,"interio":42,"internship":34,"interoccidental":2386,"interoceanic":306,"interoceptor":298,"interocular":178,"interoga":10,"interoperabil":690,"interuman":50,"interurban":82,"interviev":82,"intradermoreac\u021B":2706,"intransigen":34,"intranzitiv":162,"intraspecific":658,"intraspital":146,"intra\u0219colar":146,"introspec":18,"inuman":6,"inund":2,"inundene":9,"inundeni":9,"inutil":6,"inuzit":6,"iodopsin":10,"ipostaz":5,"iquitos":9,"ireal":5,"irespirabil":5,"ischemi":18,"ischemiaz":82,"ischemiez":82,"iudeospan":26,"iugoslav":10,"izanomal":22,"izoalcan":21,"izoamplitudin":661,"izoanabaz":45,"izoanaliz":45,"izogeoterm":21,"izold":1,"izospin":5,"izospor":5,"izostaz":5,"izoster":5,"\u00EEmbiel\u0219ug":34,"\u00EEmbuib":18,"\u00EEmbuig":18,"\u00EEmbuim":18,"\u00EEnaltprea":16,"\u00EEnaltpreasfin":272,"\u00EEnaltpreasf\u00EEn":272,"\u00EEnamor":6,"\u00EEnapoi":6,"\u00EEnarip":6,"\u00EEnarm":2,"\u00EEnaur":6,"\u00EEnavu\u021B":6,"\u00EEn\u0103cr":2,"\u00EEn\u0103lb":2,"\u00EEn\u0103sp":2,"\u00EEnbiel\u0219ug":34,"\u00EEndoi":10,"\u00EEndumnezeir":338,"\u00EEnfeu":10,"\u00EEnfieri":10,"\u00EEnfietoar":26,"\u00EEnfietor":26,"\u00EEnfiol":10,"\u00EEnfior":10,"\u00EEng\u0103duim":42,"\u00EEnh\u0103it":18,"\u00EEniep":2,"\u00EEnier":2,"\u00EEnlocui":42,"\u00EEnmiez":10,"\u00EEnmiir":10,"\u00EEnnoi":10,"\u00EEnrour":10,"\u00EEnsp\u0103im":34,"\u00EEnstr\u0103in":34,"\u00EEn\u0219eu\u00EEnd":74,"\u00EEntrista":34,"\u00EEnv\u0103luim":42,"\u00EEnvie":10,"jackpot":8,"jackson":8,"jacquerie":34,"jacquini":36,"jacuzzi":18,"jainism":6,"jainist":6,"jaini\u0219t":6,"jazzband":8,"jazzman":8,"jazzmen":8,"jeep":4,"jian":2,"jianc":2,"jien":2,"jieneasc":6,"jiene\u0219t":6,"joystick":4,"jugendstil":34,"kampuchian":276,"kampuchien":276,"karlsburg":16,"kenyan":10,"kenyen":10,"ketchup":2,"kickbox":8,"kieselgur":36,"kieserit":20,"kilojoul":74,"kilovoltamper":650,"kilowattor":138,"kimeridgian":298,"kimeridgien":298,"kimmeridgian":596,"kimmeridgien":596,"kingston":16,"kingstown":16,"kitscho":2,"knobelsdorff":68,"knockdown":16,"knockout":16,"kuweit":18,"labirintodon":138,"lactalbumin":168,"lactaz":4,"lacticemi":84,"lagoftalmi":20,"lagostom":10,"laminectomi":338,"landgraf":8,"landler":8,"l\u00E4ndler":8,"landlor":8,"landsknecht":528,"landsmal":16,"landsm\u00E5l":16,"land\u0219aft":8,"landtag":8,"lapiez":10,"laringectomi":658,"lasagn":10,"laud":2,"laudanum":20,"laurea":22,"layoutu":36,"lehliu":20,"leishman":16,"lenevioar":138,"lenevior":74,"leopar":6,"leordeni":10,"leptospir":20,"lesothian":74,"lesothien":74,"leucemi":22,"leucin":6,"leucit":6,"leuci\u021B":6,"leuco":2,"leurd":2,"lezmaiest":148,"lezmajest":148,"licua\u021B":10,"liechtenstein":144,"lied":4,"limfadeni":24,"limfangit":40,"lingual":36,"linoleic":42,"lipemi":12,"lipidemi":50,"lipiodol":12,"lista":4,"litarg":4,"lobbyu":20,"lockdown":8,"lockout":40,"loghiot":18,"logodn":2,"lombalg":8,"lombalgi":8,"lombartroz":40,"lombosciatic":404,"look":4,"looping":4,"lorniet":36,"lornioan":68,"lornion":36,"ludwigsburg":68,"luminoschem":42,"lungmetraj":40,"luthul":2,"luthur":2,"maastricht":264,"macairod":90,"macarthur":20,"macrostructur":530,"mafiot":10,"mafio\u021B":10,"magnanim":24,"magnetostric\u021B":84,"maiest":18,"maillechort":32,"majest":18,"malacostracee":554,"maladaptiv":76,"maladres":12,"malaguen":74,"malague\u00F1":74,"malaysi":26,"maleabil":26,"mallorc":2,"mallorquin":290,"malonest":12,"malone\u0219t":12,"malonilure":74,"manifesta":74,"manoper":12,"manuscri":10,"maquis":18,"mariachi":18,"marquis":36,"marseillez":276,"mar\u0219rut":8,"matostat":18,"mausol":6,"m\u0103duvioar":138,"m\u0103ghier":34,"m\u0103n\u0103stioar":82,"m\u0103nuchia\u0219":138,"m\u0103nunchia\u0219":274,"m\u0103rinim":12,"megastar":10,"megohm":4,"melamin":10,"melancol":18,"melanemi":50,"melanez":10,"melanhidroz":82,"melanin":10,"melanj":2,"melanoame":74,"melanoderm":42,"melanomu":42,"melanuri":18,"meleag":2,"melean":2,"meleste":18,"melestui":16,"melifer":10,"melioris":26,"meli\u021B":2,"meningeal":82,"meningiom":146,"metacril":12,"metalazbest":82,"metaldehid":84,"metaloi":42,"metapsih":10,"metastabil":74,"metastatic":74,"metastaz":10,"metazoar":42,"metencef":20,"metiloranj":50,"metonim":12,"metonomasi":44,"metonomaz":44,"mezalian":44,"mezencef":20,"mezenchim":20,"mezenter":20,"mezoscaf":10,"miar\u021B":8,"miaun":4,"miaut":4,"miaz":4,"miazm":2,"micosterol":74,"microamper":82,"microanaliz":178,"microanchet":82,"microantolog":338,"microcoulomb":146,"microimprim":82,"micropsi":34,"microsioan":82,"microsociolog":850,"microspor":18,"microstructur":530,"microzoar":82,"miedu":4,"miei":4,"miej":4,"miel\u0103r":4,"mielu":4,"mierag":4,"miercani":8,"miercur":8,"miere":4,"mieri":4,"mierla":8,"mierl\u0103u":8,"mierle":8,"mierli":8,"mierloi":8,"miero":4,"miersig":8,"mier\u021B":8,"mieru\u021B":4,"mieun":4,"miez":4,"mignon":2,"miime":2,"milieu":18,"minion":18,"miniscaf":10,"ministeria":338,"ministrant":18,"ministran\u021Bi":18,"ministreas":18,"miop":2,"miorit":6,"miori\u021B":6,"mioz":2,"misandri":4,"mithrais":34,"miu\u021B":2,"mixedem":12,"mizanscen":20,"mizantrop":20,"m\u00EEn\u0103\u0219terg":10,"moldagro":24,"moldaudit":56,"moldavia":24,"moldcell":8,"moldclas":8,"moldclima":8,"moldcoop":8,"moldcredit":72,"moldelectro":152,"moldgaz":8,"moldloto":40,"moldplast":8,"moldpres":8,"moldrom":8,"moldsind":8,"moldtelecom":168,"molesta":18,"monoachen":26,"monoacid":26,"monoacizi":26,"monoandr":10,"monoatom":26,"monoclu":12,"monocular":44,"monoftong":10,"monoic":10,"monoid":10,"monoideism":90,"monosemi":42,"monostih":10,"monostrat":10,"monostrof":10,"monoxid":12,"monoxil":12,"monoxizi":12,"montimorilloni":88,"montmorillonit":8,"mosquito":36,"motoreac":42,"mucalitl\u00EEc":74,"multianual":180,"multimil":20,"multiubit":40,"multiubi\u021B":40,"multstima":72,"muzeist":10,"muzeograf":26,"naftilamin":36,"namiaz":18,"naufrag":6,"n\u0103miaz":18,"nea":2,"neam\u021B":0,"neao\u0219":0,"neatestat":38,"necontestat":146,"necropsi":34,"nec\u0219":0,"nec\u0219e\u0219t":0,"nectar":4,"nectariil":84,"nectic":4,"necton":4,"nediagnostic":282,"neeuclid":14,"nefrectomi":162,"nefroscleroz":274,"negoia\u0219":10,"negoie\u0219t":10,"negoi\u021B":10,"negr\u0103i":18,"neid":2,"neim":2,"nein":2,"neis":2,"neisan":0,"neitzsche":16,"neiz":2,"nejlovel":20,"neml":2,"nemn":2,"nem\u0219":0,"nem\u021B":4,"nem\u021Bi\u0219or":20,"nenciu":0,"neo":2,"neoan":6,"neoimpresion":662,"neorealis":22,"neor\u00EEndui":166,"neostoi":42,"nepn":2,"neps":2,"nept":2,"neptun":4,"nereid":10,"nermed":0,"nermi\u0219":0,"nervatur":20,"nerva\u021Bi":4,"nervism":4,"nervist":4,"nervi\u0219t":4,"nervos":4,"nervo\u0219":4,"nervozit":20,"nervur":4,"nes":2,"nescafe":20,"ne\u0219":2,"ne\u0219tiu\u021B":18,"net":2,"netc":0,"netransport":66,"network":4,"ne\u021Bc":0,"neuita":10,"neural":6,"neurasten":42,"neurin":22,"neurit":6,"neuri\u021B":6,"nev\u0103stuic":146,"nev\u00EErstnic":66,"nevralgi":2,"nevrectomi":162,"newsletter":72,"newton":4,"newyorkez":36,"nezdruncina":322,"nicaraguan":170,"nicotinamid":202,"nietzsche":16,"nimbostratu":276,"noctambul":40,"nomarh":4,"nonagenar":42,"nonaser":12,"nonesen\u021B":12,"nonexist":12,"noninvaziv":84,"nonius":10,"noradrenalin":332,"nostalgi":4,"nou\u0103sprezec":138,"nuclear":18,"nucleic":18,"nucleo":18,"nucleoproteid":1330,"nurnberg":8,"n\u00FCrnberg":8,"obial":9,"obiel":9,"oblong":2,"oboist":5,"obovat":6,"obova\u021B":6,"obtuzunghi":18,"odontalgi":17,"oenolog":2,"oiconim":4,"oiconimi":4,"oleo":5,"oligantrop":41,"oligarh":9,"oligocitemi":405,"oliguri":9,"oliuesc":9,"olocaust":69,"ombudsman":34,"omniscien":74,"omonim":2,"omorganic":10,"omuci":2,"onomatopeic":341,"opiace":5,"opioid":13,"opioiz":13,"optzec":4,"orhiotom":26,"orica":4,"oric\u0103":4,"oric\u00EE":4,"oronime":6,"oronimi":6,"ortodont":12,"ortodon\u021B":12,"ortoptic":4,"osmiridiu":4,"ostatic":10,"ostealgi":10,"ostreicultur":50,"otalgi":2,"otalgia":2,"otalgie":2,"otalgii":2,"ouabain":4,"ou\u00EEnd":9,"outlet":4,"ovalbumin":2,"oviscapt":5,"paintball":16,"paisprezec":68,"paleoantropolo":2650,"paleoarheolo":346,"paleobotanic":346,"paleoetno":90,"paleofito":90,"paleogen":26,"paleogeo":90,"paleograf":26,"paleontolo":170,"paleoslav":26,"panaet":10,"panafrican":76,"panahid":10,"panail":10,"panain":10,"panaiot":10,"panait":10,"panai\u021B":10,"panamerican":172,"panamez":10,"panarab":12,"panatenaic":172,"panatenee":44,"pancreas":36,"pandemi":20,"panegir":10,"panelenic":44,"panelenism":44,"paneurop":28,"panicard":10,"panicarz":10,"panific":10,"panislam":20,"panoftalm":20,"panopli":2,"panoptic":20,"panoram":10,"panortodox":84,"panslav":4,"pantoptoz":20,"panunional":108,"papua\u0219":10,"paraacetaldehid":2714,"parafazi":44,"paraformaldehid":2698,"paramnez":12,"paranghel":18,"parantez":18,"parapsiholog":330,"parasc\u00EEnt":10,"parascoven":82,"parastas":18,"paratiroidectom":2730,"paravalan\u0219":44,"paraxial":44,"parb":0,"parc":0,"pard":0,"parental":18,"parenteral":84,"parenting":18,"parestez":20,"parf":0,"parh":0,"parior":10,"paritat":10,"parit\u0103\u021B":10,"parizer":10,"parizian":42,"parizien":42,"par\u00EEm":2,"park":0,"parl":0,"parm":0,"parn":0,"parodii":42,"parodist":10,"parodi\u0219t":10,"parodontoz":76,"parodon\u021B":12,"parohial":42,"paronim":12,"paronomas":44,"paronomaz":44,"parorexi":44,"parosmi":20,"parotidectom":330,"paroxism":10,"paroxist":10,"paroxiton":44,"pars":0,"par\u0219":0,"part":0,"par\u021B":0,"parv":0,"password":8,"pa\u0219opti":4,"patognom":10,"paul":2,"paypoint":20,"pazvantogl":68,"p\u0103str\u0103vior":292,"p\u0103tr\u0103u\u021Biul":306,"pedigriu":74,"peeling":4,"peisag":2,"peisaj":2,"penaltiu":82,"penicillium":330,"peninsul":20,"pensioar":20,"pentatloan":24,"pentatlon":24,"pentod":8,"penultim":20,"penumbr":4,"pepsiul":20,"pepsiur":20,"peraci":4,"perind":2,"perint":2,"perispom":2,"perminvar":40,"perora\u021B":4,"peroxi":12,"persista":36,"petersburg":34,"petroas":2,"petroman":18,"petro\u0219an":18,"petro\u0219ic":18,"petrovc":2,"philippsburg":132,"phishing":4,"phoenic\u0219":8,"phoenix":8,"pianoforte":148,"pickhammer":8,"pietermaritzburg":2212,"pieton":6,"pineal":10,"pio":2,"pionez":4,"piroscaf":10,"pirostat":10,"pitagoreic":170,"pitecantrop":18,"pittsburg":16,"pi\u021B\u00EEmp\u0103r\u0103tu\u0219":4,"piu\u00EEnd":18,"piuri":2,"piuuu":4,"pizz":2,"placodon":24,"plagistom":20,"planorbis":8,"playstation":584,"pleistocen":84,"pleuropneumon":812,"pleurosco":44,"plou\u00EEnd":36,"pluviosco":52,"poc\u0103i":10,"polemarh":18,"policitemi":74,"polimetacril":202,"polinca\u0219":18,"polipier":42,"polipnee":0,"poliptic":0,"polistil":18,"poli\u021Bmaistr":18,"poli\u021Bmai\u0219tr":18,"pompierist":52,"portabil":20,"portaltoi":40,"portan\u021B":4,"portarm":8,"portativ":20,"portavi":24,"portavoce":84,"port\u0103":4,"porthart":8,"porth\u0103r\u021Bi":8,"port\u00EEnc\u0103r":40,"portland":8,"portocal":20,"portochelar":152,"portofel":20,"portofol":20,"portorican":84,"portpagin":40,"portperi":40,"portretar":36,"portretist":36,"portreti\u0219t":36,"portretiz":36,"portschi":8,"portuar":20,"portughej":20,"portughez":20,"portulac":20,"portulan":20,"portunealt":24,"portunelt":24,"porumbiel":146,"position":74,"postacut":24,"postacu\u021B":24,"postadop\u021B":24,"postament":20,"postaprinder":280,"post\u0103ri":4,"post\u0103\u021Bi":4,"post\u0103v":4,"post\u0103vioar":276,"post\u0103vior":148,"postcriz":8,"postdiluv":40,"postelectoral":664,"postelnic":36,"posteminesc":88,"posterio":84,"posteritat":84,"posterit\u0103\u021B":84,"posteroinferio":5460,"posteroling":84,"postextern":40,"postglaciar":328,"postilion":84,"postinfec\u021B":40,"postinterven\u021B":296,"posti\u0219":4,"post\u00EEr":4,"post\u00EErnac":36,"postliceal":168,"postolach":20,"postolic":20,"postoperato":344,"postoronc":20,"postpandem":328,"postrevolu\u021Bionar":6824,"postscenium":328,"postscript":8,"posttranzac\u021B":136,"posttraumatic":712,"postulant":20,"postulan\u021B":20,"postulat":20,"postula\u021B":20,"postumit":20,"postuniversitar":2648,"pravoslav":20,"praxiul":36,"praxiur":36,"pr\u0103zdnui":16,"preabataj":44,"preader":12,"preadolescen":300,"preajb":0,"prealabil":44,"preambal":20,"preambul":20,"preamplific":148,"preaprind":12,"preasfin\u021B":8,"preasf\u00EEnt":8,"preasl\u0103vi":8,"preasn":0,"preastima":8,"preastr\u0103luc":136,"predmet":8,"pregnant":8,"pregnan\u021B":8,"preinfarct":20,"preistor":20,"prejb":0,"prejm":0,"prejmer":0,"prejmet":8,"prejn":0,"premiez":20,"pren\u021B":0,"presburg":8,"preschimb":4,"prescri":4,"prescurt":4,"presetup":8,"presgarnitur":328,"presnei":0,"presostat":20,"prespapier":40,"presp\u0103la":36,"prespital":36,"pressburg":16,"pres\u0219pan":8,"prestan\u021B":8,"prestatal":36,"prestatoar":40,"prestator":40,"prestidigit":168,"prestigi":40,"prestissimo":328,"prestoul":40,"pre\u0219colar":36,"pre\u0219tiin\u021B":36,"pretc":0,"prezbit":8,"prezbi\u021B":8,"primoinfec":84,"proamerican":172,"proeurop":28,"prognat":4,"progna\u021B":4,"prognostic":68,"prognoz":4,"proistos":20,"proisto\u0219":20,"prompt":0,"prompter":16,"pronosport":20,"prontozil":40,"proparoxiton":356,"propedeutic":148,"propionic":56,"proptar":8,"proptir":8,"proptit":8,"proscenium":164,"proscomid":40,"proscri":4,"proscuren":40,"prosl\u0103v":0,"prosp\u0103tur":40,"prospectar":72,"prospect\u0103r":72,"prospectiv":72,"prospectoar":72,"prospector":72,"prospec\u021B":8,"prosperar":40,"prosper\u0103r":40,"prosperit":40,"prospe\u021B":8,"prostatic":40,"prostatit":40,"prost\u0103l":8,"prost\u0103n":8,"prostdispu":144,"prosteasc":0,"prosterna":72,"prostern\u0103":72,"prosterne":72,"prostern\u00EE":72,"prostesc":0,"proste\u0219t":0,"prosticel":8,"prostil":4,"prostir":8,"prostitu":40,"prostolan":40,"prostovan":40,"prostovoal":40,"prostovol":40,"prostra\u021B":8,"prostule\u021B":40,"prostu\u021B":8,"pro\u0219tean":8,"protactiniu":168,"protamin":24,"protargol":40,"proteaz":20,"proteic":20,"protein":20,"protoamib":52,"protoistor":84,"protopopiat":340,"protopsalt":20,"protopsal\u021B":20,"protostea":20,"protostele":148,"protoxid":24,"protoxizi":24,"protozoar":84,"proudhonis":72,"prozaic":20,"prozaism":20,"pruncucider":176,"pruncuciga\u0219":176,"pseudartroz":84,"pseudoa":44,"pseudocrea\u021Bi":300,"pseudomnezi":300,"pseudonim":52,"pseudostereofon":3372,"pseudo\u0219tiin\u021B":300,"psihanal":24,"psihasten":40,"psihedelic":88,"psihiatr":20,"psihism":4,"psihosociolog":852,"pteranodon":40,"puiz":4,"punctaveraj":176,"punctbal":16,"pustiir":20,"quaestor":16,"quetzal":4,"quina":4,"quine":4,"quino":4,"quinqua":8,"quinque":8,"quinta":8,"quinte":8,"quinti":8,"quinto":8,"quintu":8,"quisling":8,"quito":4,"radioactiv":90,"radioaltimetr":346,"radioamator":186,"radioamplific":602,"radioascult":90,"radioastronom":602,"radioateriz":186,"radiodiagnostic":2394,"radiosta\u021Biun":666,"radiostea":26,"radiostele":154,"radius":10,"rahialgi":10,"rahianestezi":682,"ralantiul":82,"rapakiwiul":170,"r\u0103d\u0103u\u021Biul":154,"r\u0103scoag":36,"r\u0103s\u00EEn\u021Beleg":84,"r\u0103uf\u0103c\u0103t":20,"r\u0103uvoit":20,"r\u0103zb\u0103buic":148,"reab":2,"reaboi":4,"reac":2,"read":2,"reaf":2,"reag":2,"reaj":2,"real":2,"ream":2,"rean":2,"reap":2,"rear":2,"reas":2,"rea\u0219":2,"reaud":6,"reconquist":274,"recopier":42,"recrea":18,"rectal":4,"rectan":4,"recti":4,"recto":4,"rectric":4,"rec\u021Biun":20,"recviem":20,"redhib":4,"refreshu":18,"regiun":10,"reichersdorf":132,"reichstag":32,"reific":6,"reim":2,"rein":2,"re\u00EEm":2,"re\u00EEnnoi":42,"re\u00EEnvie":42,"religio":42,"remful":4,"remoulade":18,"renciu":4,"renciul":4,"rendzin":4,"renghet":0,"renghi":0,"renghiu":4,"renglot":4,"rent":0,"ren\u021B":0,"reorchestr":10,"reordon":10,"reorgan":10,"reosp\u0103l":6,"reostat":6,"reostric\u021B":6,"repaus":10,"reptil":4,"resciziun":82,"rescr":2,"respect":4,"respec\u021B":4,"resping":4,"respirabil":84,"respirare":20,"respiratoar":84,"respirator":84,"respira\u021B":20,"respir\u0103ri":20,"respiro":20,"responden":36,"responsabil":164,"restabil":18,"restant":4,"restan\u021B":4,"restart":2,"restatornic":146,"restaur":20,"restitui":20,"restitut":20,"restitu\u021B":20,"restrictiv":68,"restric\u021B":4,"restringen":68,"restri\u0219t":4,"restr\u00EEng":2,"restructur":66,"re\u0219tean":0,"retr\u0103i":18,"retriever":34,"retroactiv":82,"retrognatism":146,"retrospectiv":274,"retrospec\u021Bi":18,"retrosternal":274,"revui\u0219t":10,"rezbel":4,"rezista":18,"rezmuve":4,"rezn":0,"richard":2,"richiabiel":290,"rickettsioz":290,"ridger":2,"riesling":8,"riksmal":8,"riksm\u00E5l":8,"rinalgi":4,"rinencefal":84,"riposta":18,"rodanhidric":84,"roentgen":16,"romaer":4,"romauto":4,"romelectr":4,"romenerg":4,"romeuro":4,"romexim":20,"romexpert":4,"romexpres":4,"rominter":4,"rominvest":4,"rontgen":8,"r\u00F6ntgen":8,"roosvelt":8,"roquefort":16,"ro\u0219iorean":10,"ro\u0219ioren":10,"roule":4,"router":4,"roviniet":74,"rozalb":4,"rugbiu":20,"rugbyu":20,"rutherfor":34,"salicilamid":74,"salifier":42,"salvconduct":8,"salvgard":8,"salzburg":8,"samoan":10,"santiago":40,"sarcosporidioz":2708,"sauvignon":20,"s\u0103nii\u0219":10,"schassburg":32,"schiabil":24,"schistosomiaz":1360,"schwarzburg":64,"scintiscanograf":1320,"sciograf":12,"scleroftalm":80,"scopolamin":100,"screen":16,"secondhand":34,"seguidill":82,"selenostat":42,"selfinduc":40,"semiauxil":58,"seminc":2,"semin\u021B":2,"septicemi":84,"sequoi":18,"seraschier":274,"serodiagnostic":1130,"serumalbumin":338,"session":36,"setaveraj":44,"sfiic":4,"sfiir":4,"sfincteralg":144,"sfincteralgi":144,"sfincterectomi":2704,"shakespear":16,"shetland":8,"showroomu":136,"siderostat":42,"siemen":4,"sighiel":34,"signor":2,"siloxi":4,"silvostep":20,"simpatectomi":676,"sinantrop":4,"sinarhi":4,"sinarmonism":84,"sinartroz":4,"sinestezi":84,"singspiel":8,"sinonim":4,"sinoptic":20,"sinuci":12,"sinuij":18,"sista":4,"s\u00EErbocroat":148,"s\u00EErbocroa\u021B":148,"skateboardu":528,"slavoslov":20,"sl\u0103tinioar":276,"sluis":8,"smartphoane":272,"smartphonu":144,"smithsonit":80,"sm\u00EErdioas":136,"snooker":8,"socio":10,"softwareu":168,"solear":10,"somnambul":40,"sparringpartner":2184,"sp\u0103im":8,"splanhnectom":64,"splanhnicectom":288,"splanhnolog":160,"splanhnoptoz":288,"spleen":16,"splenectomi":336,"spondaic":40,"sportsman":32,"sportsmen":32,"stanislav":20,"statement":16,"steeplechas":72,"stercoremi":168,"stereoacustic":628,"sternocleidomastoid":215848,"sticksu":16,"stockholm":16,"stomalgi":8,"storyu":20,"stradivarius":680,"stratostat":40,"str\u0103in":8,"subacut":12,"subacu\u021B":12,"subacvatic":84,"subaliment":44,"subalpin":20,"subaltern":20,"subansambl":20,"subaprec":12,"subarb":4,"subaren":12,"subarmon":20,"subatom":12,"subecuator":108,"subestim":20,"subetaj":4,"subeval":12,"subexp":4,"subfilial":84,"subiacen":10,"subicter":20,"subiec":0,"subinginer":84,"subinspec":20,"subintitul":84,"sub\u00EEm":4,"sub\u00EEn":4,"sublima\u021Bi":18,"subliminal":84,"sublin":4,"sublocatar":84,"sublocoten":84,"sublunar":20,"subofi\u021Ber":44,"suborbit":20,"subord":4,"subr\u0103ci":4,"subredac":20,"subregn":4,"subrog":2,"subrogator":84,"subuman":12,"subunit":12,"suburb":4,"subzista":36,"suicid":2,"sulfamid":24,"sulfhidric":40,"sulkyu":20,"supereroin":178,"superiorit":106,"suplean":18,"supradiagnostic":2258,"supraimpres":82,"supraimpun":82,"suprainfec":82,"suprainfec\u021Bi":82,"suprareal":82,"supraspecial":658,"suprastatal":146,"suprastrat":18,"suprastructur":530,"suprauman":50,"sushiu":18,"sveatoslav":40,"\u0219aisprezec":68,"\u0219aptesprezec":276,"\u0219eitan":4,"\u0219f\u0103i\u021Bui":40,"\u0219iis":2,"\u0219ii\u021B":2,"\u0219ireat":18,"\u0219nuiftabac":16,"tabietli":42,"taekwando":72,"tahipnee":10,"talc\u0219ist":8,"taoism":6,"tapioc":10,"tarquini":36,"tasta":4,"taylor":4,"t\u0103buic":18,"telalgi":4,"telangiectaz":340,"telecineast":170,"telecinea\u0219t":170,"telefotografie":5290,"telencefal":84,"teleschiul":138,"teleschiur":138,"tele\u0219t":2,"tenalgi":4,"tereftalic":74,"termionic":56,"termisto":20,"termoacustic":308,"termocopier":340,"termonuclear":596,"termoscan":20,"termostabil":148,"termostat":20,"termosteril":148,"testa":4,"testosteron":148,"tetrarh":2,"tiocarbamid\u0103":198,"tiocol":2,"tioure":14,"tiroidectomi":682,"tiroxin":12,"titiun":18,"tiutiun":36,"t\u00EErgujian":84,"t\u00EErgujien":84,"tonifie":42,"toponim":12,"toponomastic":300,"torefie":42,"toryu":10,"torzburg":8,"toxemi":12,"traheobacterioz":5428,"traheobron\u0219":52,"traheoscop":52,"traheotom":52,"transcaucaz":208,"transcrier":8,"transcrip\u021B":8,"transeurop":112,"transferabil":328,"transilv":8,"transparent":72,"transparen\u021B":72,"transperant":72,"transpira\u021B":72,"treisprezec":136,"trencicot":32,"trepied":20,"trichiaz":36,"tricloretilen":708,"trictrac":0,"trietanolamin":300,"triftong":4,"trigger":0,"trinc":0,"tripanozomiaz":1364,"tripc":0,"tripsin":8,"trip\u0219":0,"triptaz":8,"triptic":8,"triptofan":40,"trisfetit":40,"trisfeti\u021B":40,"trismus":8,"tristabil":36,"tristearin":100,"triste\u021B":8,"tri\u0219ca":8,"tri\u0219c\u0103":8,"tri\u0219cu":8,"tri\u0219te":8,"triunghi":4,"trotuar":36,"tularemi":42,"tupeis":10,"tupei\u0219":10,"tureatc":34,"turkmen":8,"tweed":8,"tzatziki":36,"ucrain":9,"ultrareact":82,"ultrareac\u021Bi":338,"ultrascurt":18,"ultrascur\u021Bi":18,"ultraslim":18,"umlaut":18,"uniun":4,"unsprezec":34,"untdelemn":20,"uremi":4,"uricemi":21,"varor":4,"vasectomi":84,"v\u0103duvioar":138,"v\u0103ita":4,"v\u0103it\u0103":4,"v\u0103it\u00EE":4,"veaceslav":20,"velastrai":10,"veselioar":138,"veselior":74,"vicent":2,"vicen\u021B":2,"vicenz":2,"video":10,"vii\u0219oar":6,"vinars":4,"vindiac":36,"viniet":18,"vioiciun":14,"viremi":12,"visceroptoz":84,"vitejie":42,"v\u00EErstat":4,"v\u00EErstnic":16,"vorobchievic":274,"voucher":4,"voyeurism":20,"vrai\u0219t":4,"vr\u00EEstat":8,"washington":66,"weekend":8,"wehrmacht":8,"welington":34,"wellness":8,"weltanschauung":40,"western":0,"whiskeyu":72,"whiskyu":40,"wildcard":8,"windsor":8,"wireless":0,"witherit":18,"workshop":8,"wronskian":16,"wurzburg":8,"w\u00FCrzburg":8,"xantopsi":40,"xeroftalmi":20,"xerografie":330,"xiuquan":4,"yuan":2,"zair":2,"z\u0103itin":4,"z\u0103uit":10,"zein":2,"zei\u021B":2,"zinnwaldi":8,"zmeu":4,"zoi\u021Bani":4,"zoogeograf":54,"zoopsie":42,"zuav":2},"FS":{"aun":1,"aur":1,"au\u0219":1,"aut":1,"au\u021B":1,"auz":1,"\u0103il":1,"\u0103ind":1,"\u0103ir":1,"\u0103i\u0219":1,"\u0103it":1,"\u0103i\u021B":1,"bia":2,"biel":2,"bien":2,"bio":2,"bui":2,"caus":2,"cia":2,"cie":2,"coag":2,"dia":2,"die":2,"dio":2,"diul":2,"dium":2,"diur":2,"eit":1,"eoc":1,"eol":1,"eon":1,"eoz":1,"eud":1,"eul":1,"eum":1,"eun":1,"eu\u0219":1,"eut":1,"eu\u021B":1,"fia":2,"gia":2,"gie":2,"gioas":2,"gion":2,"gios":2,"gio\u0219":2,"hian":2,"hiar\u0103":2,"hiase":6,"hia\u0219":2,"hiat":2,"hia\u021B":2,"hie":2,"iil":1,"iin":1,"iit":1,"iom":1,"\u00EEir":1,"\u00EEit":1,"\u00EEi\u021B":1,"kia":2,"kie":2,"lia":2,"lie":2,"lio":2,"lua":2,"lu\u0103r":2,"lue":2,"luid":2,"meab":2,"mia":2,"mie":2,"mioan":2,"miol":2,"mion":2,"miot":2,"miul":2,"nain":2,"nia":2,"nie":2,"nio":2,"niul":2,"nua":2,"nu\u0103r":2,"nui":2,"oid":1,"oir":1,"oi\u0219":1,"oiz":1,"p\u0103i":2,"piad":2,"pial":2,"piam":2,"pian":2,"piar\u0103":2,"pias":2,"pia\u0219":2,"pia\u021Bi":2,"pien":2,"pioan":2,"pion":2,"piul":2,"poit":2,"poi\u021B":2,"raud":2,"reat":2,"reo":2,"ria":2,"rie":2,"rio":2,"riul":2,"rium":2,"roit":2,"roi\u021B":2,"rua":2,"seis":2,"sia":2,"sie":2,"sion":2,"siul":2,"siun":2,"sua":2,"\u0219ia":2,"\u0219ie":2,"\u0219io":2,"teis":2,"tei\u0219":2,"teo":2,"tia":2,"tie":2,"tion":2,"tiun":2,"tua":2,"tu\u0103r":2,"tui":2,"\u021Bia":2,"\u021Bie":2,"\u021Bioas":2,"\u021Bion":2,"\u021Bios":2,"\u021Bio\u0219":2,"\u021Bioz":2,"\u021Biul":2,"\u021Biun":2,"uab":1,"ual":1,"uin":1,"uir":1,"uis":1,"uit":1,"ui\u021B":1,"uiz":1,"u\u00EE":1,"via":2,"vien":2,"viet":2,"vio":2,"viu":2,"voit":2,"voi\u021B":2,"xia":2,"xie":2,"xio":2,"xiu":2,"xua":2,"zia":2,"zie":2,"zio":2,"ziu":2,"zoi":2},"FX":{"andri":2,"a\u0219tri":2,"e\u0219tri":2,"hiai":2,"hiam":2,"hiau":2,"hiaz\u0103":2,"i\u0219tri":2,"\u00EErli":2,"o\u0219tri":2,"piai":2,"piat":2,"piau":2,"piaz\u0103":2},"NE":["\u0061\u006E\u0075\u0073","\u0061\u006E\u0075\u0073\u0075\u006C","\u0061\u006E\u0075\u0073\u0075\u0072\u0069","\u0061\u006E\u0075\u0073\u0075\u0072\u0069\u006C\u0065","\u0061\u006E\u0075\u0073\u0075\u006C\u0075\u0069","\u0061\u006E\u0075\u0073\u0075\u0072\u0069\u006C\u006F\u0072","\u0063\u006F\u0069","\u0063\u006F\u0069\u0075\u006C","\u0063\u006F\u0061\u0069\u0065","\u0063\u006F\u0061\u0069\u0065\u006C\u0065","\u0063\u006F\u0069\u0075\u006C\u0075\u0069","\u0063\u006F\u0061\u0069\u0065\u006C\u006F\u0072","\u0063\u0075\u0072","\u0063\u0075\u0072\u0075\u006C","\u0063\u0075\u0072\u0075\u0072\u0069","\u0063\u0075\u0072\u0075\u0072\u0069\u006C\u0065","\u0063\u0075\u0072\u0075\u006C\u0075\u0069","\u0063\u0075\u0072\u0075\u0072\u0069\u006C\u006F\u0072","\u0066\u0075\u0074","\u0066\u0075\u0074\u0061","\u0066\u0075\u0074\u0065","\u0066\u0075\u021B\u0069","\u0066\u0075\u0074\u0061\u0072\u0065","\u0066\u0075\u0074\u0061\u0062\u0069\u006C","\u0066\u0075\u0074\u0061\u0074","\u0066\u0075\u0074\u0061\u0074\u0075","\u0066\u0075\u0074\u00EE\u006E\u0064","\u0066\u0075\u0074\u00EE\u006E\u0064\u0075","\u0066\u0075\u0074\u0065\u0061\u007A\u0103","\u0066\u0075\u0074\u0061\u021B\u0069","\u0066\u0075\u0074\u0061\u006D","\u0066\u0075\u0074\u0061\u0069","\u0066\u0075\u0074\u0061\u0073\u0065\u006D","\u0066\u0075\u0074\u0061\u0219\u0069","\u0066\u0075\u0074\u0061\u0073\u0065\u0219\u0069","\u0066\u0075\u0074\u0103","\u0066\u0075\u0074\u0061\u0073\u0065","\u0066\u0075\u0074\u0103\u006D","\u0066\u0075\u0074\u0061\u0072\u0103\u006D","\u0066\u0075\u0074\u0061\u0073\u0065\u0072\u0103\u006D","\u0066\u0075\u0074\u0061\u0072\u0103\u021B\u0069","\u0066\u0075\u0074\u0061\u0073\u0065\u0072\u0103\u021B\u0069","\u0066\u0075\u0074\u0061\u0073\u0065\u021B\u0069","\u0066\u0075\u0074\u0061\u0075","\u0066\u0075\u0074\u0061\u0072\u0103","\u0066\u0075\u0074\u0061\u0073\u0065\u0072\u0103","\u006D\u0075\u0069\u0065","\u006D\u0075\u0069\u0061","\u006D\u0075\u0069","\u006D\u0075\u0069\u006C\u0065","\u006D\u0075\u0069\u0069","\u006D\u0075\u0069\u006C\u006F\u0072","\u0070\u0075\u006C\u0103","\u0070\u0075\u006C\u0065","\u0070\u0075\u006C\u0061","\u0070\u0075\u006C\u0065\u006C\u0065","\u0070\u0075\u006C\u0065\u0069","\u0070\u0075\u006C\u0065\u006C\u006F\u0072","\u0070\u0075\u006C\u006F\u0073","\u0070\u0075\u021B\u0103","\u0070\u0075\u021B\u0061","\u0070\u0075\u021B\u0065","\u0070\u0075\u021B\u0065\u006C\u0065","\u0070\u0075\u021B\u0065\u0069","\u0070\u0075\u021B\u0065\u006C\u006F\u0072"]};

    //


    let prepPC = function ()
    {
        if( Impl.Dictionar.PC === undefined ) return;

        for( let prefix in Impl.Dictionar.PC )
        {
            // adaugă cratima între prefix și rădăcină
            Impl.Dictionar.PC[prefix] |= 1 << ( prefix.length - 1 );
        }
    }

    let prepFS = function ()
    {
        if( Impl.Dictionar.FS === undefined ) return undefined;

        let fsd = {};

        for( let fs in Impl.Dictionar.FS )
        {
            let e = [];

            if( Impl.Dictionar.CE !== undefined )
            {
                for( let ce in Impl.Dictionar.CE )
                {
                    for( let p = 0; ; ++p )
                    {
                        p = ce.indexOf( fs, p );
                        if( p < 0 ) break;

                        e.push( [p, ce] );
                    }
                }
            }

            if( fsd[fs[0]] === undefined ) fsd[fs[0]] = [];

            fsd[fs[0]].push( [fs, Impl.Dictionar.FS[fs], e] );
        }

        delete Impl.Dictionar.FS;

        return fsd;
    }

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

    prepPC();

    Impl.Date =
    {
        PC: prep( Impl.Dictionar.PC ),
        PI: prep( Impl.Dictionar.PI ),
        SC: prep( Impl.Dictionar.SC ),
        SI: prep( Impl.Dictionar.SI ),
        CE: prep( Impl.Dictionar.CE ),
        FS: prepFS(),
        FX: prep( Impl.Dictionar.FX )
    };

    Impl.OptiuniImplicite = { EvitaSecventeNeelegante: true, TrateazaFuziuni: false };
    Impl.OptiuniImpliciteSecundare = { Secundar: true, PrefixeMultiple: false, TrateazaFuziuni: false };


    const modul =
    {
        /**
         * Desparte în silabe un cuvînt.
         * 
         * @param {string} cuvint - cuvîntul de despărțit în silabe
         * @typedef {object} Rezultat
         * @property {number} cratime - număr întreg ale cărui biți egali cu „1” denotă pozițiile de segmentare
         * @property {string} cuvint - cuvînt cu cratime inserate între silabe
         * @returns {Rezultat} Obiect cu rezultatul segmentării
         */
        Desparte: function ( cuvint )
        {
            let impl = new Impl( cuvint, Impl.OptiuniImplicite );

            impl.Desparte();

            return { cratime: impl.cratime, cuvint: impl.CuvintCuCratime() };
        },


        /**
         * Desparte în silabe toate cuvintele.
         * 
         * @param {string} text - textul de intrare
         * @returns {string} Textul despărțit în silabe (textul dat la intrare, cu cratime inserate între silabe)
         */
        DesparteTot: function ( text )
        {
            let rezultat = "";

            Impl.RegexSpl.lastIndex = 0;

            for( ; ; )
            {
                let a = Impl.RegexSpl.exec( text );

                if( a === null ) break;

                if( a[1] !== undefined )
                {
                    let impl = new Impl( a[1], Impl.OptiuniImplicite );

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

