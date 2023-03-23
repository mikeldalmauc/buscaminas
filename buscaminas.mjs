
const sizes =       [10, 40, 99, 150, 1000];
const dimensionsR = [9, 16, 16, 30, 100];
const dimensionsC = [9, 16, 30, 30, 100];

let model;
let oldModel;
let styles;
let timerInterval;

export function init(){

    /*
    * Casilla estados posibles 
    *      Agua AguaCubierta  Mina MinaCubierta  
    * 
    */
    model = {
        // Esto se reemplaza pero se deja a modo de ejemplo visual
        tablero : 
            [[ {class:"Suelo", type:"Agua", vec:1, row:0, col:0}, {class:"Losa",   type:"Agua",   vec:1, row:0, col:1} ]
            ,[ {class:"Losa", type:"Mina", vec:2, row:1, col:0}, {class:"Losa",  type:"Mina",   vec:2, row:1, col:1}]]
        , aguas : 71
        , descubiertas : 0
        // Victoria Derrota Juego
        , estado: "Juego"
        , size: 0
        , rows: 9
        , cols: 9
        , minas: 10
        , horaInicio: "SinInicio"
        };
        
    // oldModel = JSON.parse(JSON.stringify(model));
    
    update(null, "", "", "Increase");
}


let randomInt = max => Math.floor(Math.random() * max);
let randCoordsGen = (rows, cols) => ({col: (randomInt(cols)), row: (randomInt(rows))});
let encode = coord => (coord.row + "." + coord.col);
let vecinos  = (r, c) => [];


function initTablero(){

    model.estado = "Juego";
    model.horaInicio = "SinInicio";
    model.aguas = model.rows * model.cols - model.minas;
    clearInterval(timerInterval);
    
    let appeared = {};

    // Crear las posiciones de las minas
    Array(model.minas).fill().map(() =>  {

        let coords = randCoordsGen(model.rows, model.cols);
        let code = encode(coords);
        while(appeared[code] != undefined && appeared[code] != null){
            coords = randCoordsGen(model.rows, model.cols);
            code = encode(coords);
        }

        appeared[code] = coords;

        return code; 
    });
    
    // Añadimos las minas
    let tablero = [];
    for(let i=0; i<model.rows; i++){

        let row = [];
        for(let j=0; j<model.cols; j++){
            let mine = appeared[encode({row:i, col:j})];

            if(mine != undefined && mine != null)
                row.push({class:"Losa", type:"Mina", vec:0, row:i, col:j});
            else
                row.push({class:"Losa", type:"Agua", vec:0, row:i, col:j});
            
        }

        tablero.push(row);
    }
      
    // calcular vecinos
    let vecinos = (r, c) => {
        
        let vecinos = 0;
        
        const rows = (r>0?[r-1, r]:[r]).concat(r<model.rows-1?[r+1]:[]);
        const cols = (c>0?[c-1, c]:[c]).concat(c<model.cols-1?[c+1]:[]);

        rows.forEach(row => {
            cols.forEach(col => {
                if(!(row==r && col==c) && tablero[row][col].type == "Mina")
                    vecinos++;

            });
        });
        
        return vecinos;
    }

    tablero = tablero.map((row, i) => row.map((casilla, j) => { casilla.vec=vecinos(i, j); return casilla;}));

    return tablero;
}


function update(event, numeroFila, numeroColumna, action){
    
    oldModel = JSON.parse(JSON.stringify(model));


    if(action == "Increase"){

        model.size++;
        if(model.size == sizes.length)
            model.size = 0;

        model.minas = sizes[model.size];
        model.rows = dimensionsR[model.size];
        model.cols = dimensionsC[model.size];

        model.tablero = initTablero();

        view();
    } else if(action == "Restart") {

        model.minas = sizes[model.size];
        model.tablero = initTablero();
        view();
        
    } else if(action == "Timer") {
        
        let timer = document.getElementById("ms-temp");
        let parent = document.getElementsByClassName("ms-top-panel")[0];
        parent.removeChild(timer);
        parent.appendChild(viewTemporizador());

    } else if(action == "Suelo"){

        if(event.detail === 2){
            let casilla = model.tablero[numeroFila][numeroColumna];
        }

    } else{
        
        // Es el primer click?
        if(model.horaInicio  == "SinInicio"){
            model.horaInicio = new Date();
    
            timerInterval = setInterval(() => {
                update(null, null, null, "Timer");
            }, 1000);
        }

        let rightClick = false;
        let casilla = model.tablero[numeroFila][numeroColumna];
    
        // Click derecho? prevenimos el menu contextual
        if (event.which === 3){
            rightClick = true;
            event.preventDefault();
        }
    
    
        // Se añaden marcas a las minas
        if(rightClick){
            
            switch (casilla.class) {
                case "Losa":
                    casilla.class="maybeMina"; 
                    model.minas -= 1;
                    break;
                case "maybeMina":
                    casilla.class="Losa"; 
                    model.minas += 1;
                    break;
                default:
                    break;
            }
    
            view();
        } else{
            
            // Solo se pueden descubrir casillas cubiertas, y no marcadas
            if(casilla.class == "Losa"){
                
                // Se pone a Agua o Mina segun lo que tubiera en el tipo la casilla
                casilla.class = casilla.type;
                model.descubiertas++;
    
                if(casilla.type == "Agua"){
                    if(casilla.vec == 0){
                        propagar(numeroFila, numeroColumna);
                    }
                    
                    if(model.descubiertas == model.agua){
                        model.estado = "Victoria";

                        // Hacer algo txo
                    }

                }else if(casilla.type == "Mina"){
                    model.estado = "Derrota";
                    casilla.class = "Expl";
                }
    
                  // Descubrimos todas las casillas
                if(model.estado != "Juego"){
                    model.tablero = model.tablero.map(fila => fila.map(casilla => {
                        casilla.class = casilla.type;
                        return casilla;
                    }));
                }
    
                view();
            }
        }
    }
}

// Cambia el tipo de varios elementos
function propagar(r, c){
    const rows = (r>0?[r-1, r]:[r]).concat(r<model.rows-1?[r+1]:[]);
    const cols = (c>0?[c-1, c]:[c]).concat(c<model.cols-1?[c+1]:[]);

    rows.forEach(row => {
        cols.forEach(col => {
            let el = model.tablero[row][col]
            if(!(row==r && col==c) &&  el.type == "Agua" && el.class != "Agua"){

                el.class = el.type;

                if(el.vec == 0)
                    propagar(row, col);
            }

        });
    });
}

function view(){    

    let app = document.getElementById("app");
    
    app.innerHTML = '';

    // Add styles
    if(!oldModel || model.rows != oldModel.rows || model.cols != oldModel.cols)
        viewStyles();

    // Top panel
    app.appendChild(viewTopPanel());
        
    // Tablero
    app.appendChild(viewTablero());
}

function viewStyles(){

    if(styles != null)
        document.head.removeChild(styles);
    
    styles = document.createElement('style');
    styles.innerHTML = css();

    document.head.appendChild(styles);
}

function viewTopPanel(){
    
    let topPanel = document.createElement("section");
    topPanel.className = "ms-top-panel"
    
    // Contador
    topPanel.appendChild(viewContador());

    // Botones
    topPanel.appendChild(viewBotonIncrease());
    topPanel.appendChild(viewBotonRestart());

    // Contador
    topPanel.appendChild(viewTemporizador());

    return topPanel;
}

function viewTemporizador(){

    let contador = viewPanelNumerico();
    contador.style.minWidth = "300px";
    contador.id = "ms-temp";

    if(model.horaInicio  == "SinInicio"){
        contador.innerHTML = 
            [ 0, 0, ":", 0, 0, ":", 0, 0].map((d) => d == ":" ? "<div class='divider sec'>:</div>" : viewDigito(d)).join("");

    }else {

        let duration = new Date() - model.horaInicio;

        let secs = Math.floor((duration / 1000)) % 60;
        let mins = Math.floor((duration / (1000 * 60))) % 60;
        let hors = Math.floor((duration / (1000 * 60 * 60))) % 24;

        let dig1 = num => num < 10 ? 0 : Math.floor(num/10); 
        let dig2 = num => num < 10 ? num : num % 10;
    
        contador.innerHTML = 
            [ dig1(hors)
            , dig2(hors)
            ,  ":"
            , dig1(mins)
            , dig2(mins)
            ,  ":"
            , dig1(secs)
            , dig2(secs)
            ].map((d) => d == ":" ? "<div class='divider sec'>:</div>" : viewDigito(d)).join("");
    }

    return contador;
}

function viewContador(){

    let contador = viewPanelNumerico();
    contador.id = "ms-count";
    contador.style.minWidth = "180px";

    const unidades = model.minas % 10;
    const decenas = ((model.minas-unidades) % 100)/10;
    const centenas = ((model.minas-unidades-decenas*10) % 1000)/100;
    const millares = ((model.minas-unidades-decenas*10-centenas*100) % 10000)/1000;
    
    contador.innerHTML = 
        [unidades
        ,decenas 
        ,centenas
        ,millares
        ].reverse().map(viewDigito).join("");

    return contador;
}

function viewPanelNumerico(){
    let panel = document.createElement("section");
    panel.className = "ms-panel";
    panel.style.backgroundColor = "#111111";
    panel.style.width = "fit-content";
    panel.style.borderRadius = "4px";
    panel.style.borderColor = "aliceblue";
    panel.style.borderWidth = "revert";
    panel.style.borderStyle = "double";
    return panel;
}

function viewDigito(digito){
    const numname = ['zero', 
        'one', 
        'two', 
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine'];

    return `    
            <div class='digit ${numname[digito]}'>
            <div class='unit'></div>
            <div class='unit'></div>
            <div class='unit'></div>
            <div class='unit'></div>
            <div class='unit'></div>
            <div class='unit'></div>
            <div class='unit'></div>
            </div>
        `;

}


function viewBotonIncrease(){

    let boton = document.createElement("input");
    boton.value = "Increase";
    buttonStyle(boton);

    boton.onclick = () => update(null, null, null, "Increase");

    return boton;
}

function viewBotonRestart(){

    let boton = document.createElement("input");
    boton.value = "Restart";
    buttonStyle(boton);

    boton.onclick = () => update(null, null, null, "Restart");

    return boton;
}

function buttonStyle(b){
    b.style.width = "80px";
    b.style.height ="50px";
    b.style.margin = "10px";
    b.style.color = "black";
    b.type = "button";
    b.style.backgroundColor = "#77777";
}

function viewTablero(){

    let tablero = document.createElement("section");
    tablero.className = "ms-tablero"
    
    model.tablero.forEach((fila, numeroFila) => {
        tablero.appendChild(viewFila(fila, numeroFila));    
    });

    return tablero;
}

function viewFila(fila, numeroFila){

    let ul = document.createElement("ul");
    ul.className = "ms-fila";

    fila.forEach((casilla, numeroColumna) => {
        ul.appendChild(viewCasilla(casilla, numeroFila, numeroColumna));
    });

    return ul;
}

function viewCasilla(casilla, numeroFila, numeroColumna){
    
    let li = document.createElement("li");

    
    // Clase básica
    li.classList =  "ms-" + (losa(casilla)?"Losa":"Suelo") ;
    
    // Si es losa sin icono se activa el hover
    if(losa(casilla) && !esIcono(casilla)){
        li.classList  += " ms-Losa_hover"
    }

    // Si agua y tiene vecino bomba poner numero
    if(!losa(casilla) && esAgua(casilla) && casilla.vec > 0){
        li.classList += " ms-" + casilla.vec
        li.innerText = casilla.vec;
    }
    
    // Iconos si toca
    if(esIcono(casilla)){
        let icon = document.createElement("div");
        icon.className = "ms-"+casilla.class;
        li.appendChild(icon);
    }

    // Eventos si toca, solo las losas se pueden pulsar
    if(losa(casilla)){

        li.addEventListener("mouseup", ev => {
            update(ev, numeroFila, numeroColumna);
        })
        
        li.addEventListener('contextmenu', ev => {
            ev.preventDefault();
            return false;
        }, false);
    }

    if("Suelo"){
        li.addEventListener("mouseup", ev => {
            update(ev, numeroFila, numeroColumna, "Suelo");
        })

        li.addEventListener("onmousedown", ev => {
            update(ev, numeroFila, numeroColumna, "Suelo");
        })

    }

    return li;
}

function esAgua(casilla){
   return ["Mina","Expl"].indexOf(casilla.class) < 0;
};
function esIcono(casilla){
    return ["Mina","Expl", "maybeMina"].indexOf(casilla.class) > -1;
}

function losa(casilla){
    return ["Losa", "maybeMina"].indexOf(casilla.class) > -1;
}

function css(){

    let heightMina = 50;
    let widthMina = 50;

    let heightTablero = model.rows*heightMina+ 60;
    let widthTablero = model.cols*widthMina + 60;

    return `
*,
*:before,
*:after {
    position: relative;
    box-sizing: border-box;
}

.ms-top-panel{
    display: flex;
    align-items: left;
    width: ${widthTablero}px;
    min-width: px;
    flex-direction: row;
}
.ms-tablero {
    user-select: none; 
    display: flex;
    flex-direction: column;
    margin: unset;

    max-height:  ${heightTablero}px;
    max-width:  ${widthTablero}px;

    background-size: cover; 
    overflow: hidden;
    background-repeat: no-repeat;
    background-position: center center;
    background-image: url('/assets/cats.jpg');

    border-style: groove;
    border-width: 15px;
    padding: 15px;
}

.ms-tablero > ul {
    list-style-type: none;
    padding-inline-start: unset;
    margin: unset;
}

.ms-fila{
    display: flex;
    flex-direction: row;
    margin: unset;

}

.ms-Losa, .ms-Suelo {
    min-height:  ${heightMina}px;
    min-width:  ${widthMina}px;
    font-size: 1.5em;
    text-align: center;
    background-size: contain;
    background-position: center center;
}

.ms-Losa {
    background-image: url( '/assets/casillavacia.svg' );
    /* background-image: url( '/assets/casillavacia.svg' ); */
}

.ms-Losa_hover {
    background-image: url( '/assets/casillavacia.svg' );
    transition: 0s background-image;
}

.ms-Losa_hover:hover {
    background-image: url( '/assets/casillavaciaPulsada.svg' );
    transition-delay:0.3s;
}

.ms-Losa_pulsada{
    background-image: url( '/assets/casillavaciaPulsada.svg' );
    transition-delay:0.3s;
}

.ms-Suelo {
    background-image: url( '/assets/casillavaciadw.svg' );
    /* background-image: url( '/assets/casillavaciadw.svg' ); */
} 

.ms-Mina, .ms-Expl, .ms-maybeMina{
    height:  100%;
    width:  100%;
    font-size: 1.5em;
    text-align: center;
    background-size: contain;
    background-position: center center;
    z-index: 10;
    position: absolute;
}

.ms-Mina {
    background-image: url( '/assets/bomba.svg' );
} 

.ms-Expl {
    background-image: url( '/assets/bombaExpl.svg' );
} 

.ms-maybeMina {
    background-image: url( '/assets/maybeBomba.svg' );
} 

.ms-1, .ms-2, .ms-3, .ms-4 ,.ms-5, .ms-6,.ms-7,.ms-8{
    padding-top: 0;
}
.ms-1{
    color:rgb(41, 41, 212);
}
.ms-2{
    color:darkgreen;
}
.ms-3{
    color: red;
}
.ms-4{
    color:rgb(3, 3, 90);
}
.ms-5{
   color: darkmagenta
}
.ms-6{
    filter: darkorchid;
}
.ms-7{
    color: greenyellow;
}
.ms-8{
    color: coral;
}
    ` + 
     `
      
      button {
        border: 0;
        background: #369;
        color: #FFF;
        border-radius: 0.25em;
        padding: 0.5em 1em;
        font-size: 1.2em;
      }
      button:hover {
        background: #264d73;
      }
      button:active {
        background: #996633;
      }
      
      .unit::after, .unit::before, .icon-expand, .triangle-nw, .triangle-sw, .triangle-se, .triangle-ne, .triangle-w, .triangle-s, .triangle-e, .triangle-n, .triangle-n-equal {
        display: inline-block;
        height: 0;
        width: 0;
        padding: 0;
        overflow: hidden;
        text-indent: 100%;
        border-style: solid;
        border-color: transparent;
      }
      
      /*\
       * NOTE: height and width are that of the bounding box, not the triangle!
      \*/
      .triangle-n-equal {
        border-width: 0 3em 5.196em;
        border-bottom-color: #333;
      }
      
      .triangle-n {
        border-width: 0 0.5em 1em;
        border-bottom-color: #f00;
      }
      
      .triangle-e {
        border-width: 0.5em 0 0.5em 1em;
        border-left-color: #f00;
      }
      
      .triangle-s {
        border-width: 1em 0.5em 0;
        border-top-color: #f00;
      }
      
      .triangle-w {
        border-width: 0.5em 1em 0.5em 0;
        border-right-color: #f00;
      }
      
      .triangle-ne {
        border-width: 1em 0 0 1em;
        border-top-color: #f00;
      }
      
      .triangle-se {
        border-width: 0 0 1em 1em;
        border-bottom-color: #f00;
      }
      
      .triangle-sw {
        border-width: 0 1em 1em 0;
        border-bottom-color: #f00;
      }
      
      .triangle-nw {
        border-width: 1em 1em 0 0;
        border-top-color: #f00;
      }
      
      .icon-expand {
        border-width: 0.375em 0 0.375em 0.5em;
        border-left-color: #fff;
        transition: all 0.5s;
      }
      button:active .icon-expand {
        transform: rotateZ(90deg);
      }
      
      html {
        background: #666;
      }
      
      #debug {
        color: #0f0;
      }
      
      .divider {
        color: #0f0;
        font-size: 1.2em;
        float: left;
        margin-top: 10px;
        margin-left: 0;
        margin-right: 0;
        /*
        Tried pulsing the divider on the corresponding time interval but didn't like it.
        &.sec {
          animation: pulse .5s ease-out infinite both alternate;
        }
        &.min {
          animation: pulse 30s ease-out infinite both alternate;
        }
        */
      }
      
      @keyframes pulse {
        from {
          opacity: 1;
        }
        to {
          opacity: 0.1;
        }
      }
      .digit {
        margin: 0.5em 0.3em 0.3em 0.4em;
        position: relative;
        float: left;
        width: 1.1em;
        height: 1.9em;
      }
      .digit .unit:nth-child(2n) {
        transform: rotateZ(90deg);
        left: 0.4em;
      }
      .digit .unit:nth-child(1) {
        top: 0.05em;
        left: 0;
      }
      .digit .unit:nth-child(7) {
        top: 0.05em;
        left: 0.8em;
      }
      .digit .unit:nth-child(3) {
        top: 0.85em;
        left: 0;
      }
      .digit .unit:nth-child(5) {
        top: 0.85em;
        left: 0.8em;
      }
      .digit .unit:nth-child(2) {
        top: -0.35em;
      }
      .digit .unit:nth-child(4) {
        top: 0.45em;
      }
      .digit .unit:nth-child(6) {
        top: 1.25em;
      }
      .digit.zero .unit:nth-child(4n), .digit.one .unit:nth-child(1),
      .digit.one .unit:nth-child(3),
      .digit.one .unit:nth-child(2),
      .digit.one .unit:nth-child(4),
      .digit.one .unit:nth-child(6), .digit.two .unit:nth-child(4n+1), .digit.three .unit:nth-child(1),
      .digit.three .unit:nth-child(3), .digit.four .unit:nth-child(2),
      .digit.four .unit:nth-child(3),
      .digit.four .unit:nth-child(6), .digit.five .unit:nth-child(4n+3), .digit.six .unit:nth-child(7n), .digit.seven .unit:nth-child(1),
      .digit.seven .unit:nth-child(3),
      .digit.seven .unit:nth-child(4),
      .digit.seven .unit:nth-child(6), .digit.nine .unit:nth-child(3n) {
        background: rgba(0, 255, 0, 0.1);
        color: rgba(0, 255, 0, 0.1);
        box-shadow: none;
      }
      
      .unit {
        position: absolute;
        top: 0;
        left: 0;
        width: 0.1em;
        height: 0.6em;
        background: #0f0;
        color: #0f0;
        box-shadow: 0 0 1em #0f0;
      }
      .unit::before {
        border-width: 0 0.05em 0.05em;
        border-bottom-color: inherit;
        content: "";
        position: absolute;
        top: -0.05em;
        left: 0;
      }
      .unit::after {
        border-width: 0.05em 0.05em 0;
        border-top-color: inherit;
        content: "";
        position: absolute;
        bottom: -0.05em;
        left: 0;
      }
      `;



}

