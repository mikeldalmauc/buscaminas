
let model;
let oldModel;

let styles;

function init(){

    /*
    * Casilla estados posibles 
    *      Agua AguaCubierta AguaBandera Mina MinaCubierta MinaBandera 
    * 
    */
    model = {
        tablero : 
            [[ {class:"Suelo", type:"Agua", vec:1}, {class:"Losa",   type:"Agua",   vec:1},  {class:"Losa",type:"Agua", vec:3}, {class:"Bandera"  ,type:"Mina", vec:1} ]
            ,[ {class:"Losa", type:"Mina", vec:2}, {class:"Losa",  type:"Mina",   vec:2},  {class:"maybeMina",type:"Agua", vec:5}, {class:"Losa" ,type:"Mina", vec:1} ]
            ,[ {class:"Losa", type:"Agua", vec:3}, {class:"Losa",  type:"Mina",   vec:2},  {class:"Losa",type:"Agua", vec:4}, {class:"Losa" ,type:"Mina", vec:1} ]
            ,[ {class:"Losa", type:"Agua", vec:2}, {class:"Losa",type:"Agua",   vec:1},  {class:"Losa",type:"Agua", vec:2}, {class:"Losa"  ,type:"Agua", vec:1} 
            ]
            ]
        , aguas : 10
        , descubiertas : 0
        // Victoria Derrota Juego
        , estado: "Juego"
        , rows: 2
        , cols: 2
        , minas: 1
        };
        
    // oldModel = JSON.parse(JSON.stringify(model));
    
    update(null, "", "", "Increase");
}


let randomInt = max => Math.floor(Math.random() * max);
let randCoordsGen = (rows, cols) => ({col: (randomInt(cols)), row: (randomInt(rows))});
let encode = coord => (coord.row + "." + coord.col);

function initTablero(){

    model.aguas = model.rows * model.cols - model.minas;

    let appeared = {
    };

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
    
    let tablero = [];
    for(let i=0; i<model.rows; i++){

        let row = [];
        for(let j=0; j<model.cols; j++){
            let mine = appeared[encode({row:i, col:j})];

            if(mine != undefined && mine != null)
                row.push({class:"Losa", type:"Mina", vec:0});
            else
                row.push({class:"Losa", type:"Agua", vec:0});
            
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
        const sizes = [10, 20, 35, 50, 300, 800];
        const dimensionsR = [5, 10, 15, 20, 50, 100]
        const dimensionsC = [5, 10, 19, 40, 60, 120]
        let i = sizes.indexOf(model.minas);

        i++;
        if(i > 5)
            i = 0;

        model.minas = sizes[i];
        model.rows = dimensionsR[i];
        model.cols = dimensionsC[i];

        
        model.tablero = initTablero();
        model.estado = "Juego";

        view();
    }else{

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
                    model.minas += 1;
                    break;
                case "maybeMina":
                    casilla.class="Bandera"; 
                    model.minas -= 1;
                    break;
                case "Bandera":
                    casilla.class="Losa"; break;
                default:
                    break;
            }
    
            view();
        }else{
            
            // Solo se pueden descubrir casillas cubiertas, y no marcadas
            if(casilla.class == "Losa"){
                
                // Se pone a Agua o Mina segun lo que tubiera en el tipo la casilla
                casilla.class = casilla.type;
                model.descubiertas++;
    
                if(casilla.type == "Agua"){
                    if(casilla.vec == 0)
                        propagar(numeroFila, numeroColumna);
                        
                    if(model.descubiertas == model.agua){
                        model.estado = "Victoria";
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
                    casilla.class = "Expl";
                }
    
                view();
            }
        }
    }
}

function propagar(r, c){
       
    // calcular vecinos
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

    // Boton tamaño
    topPanel.appendChild(viewBotonIncrease());

    return topPanel;
}

function viewContador(){

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

    let contador = document.createElement("section");
    contador.style.backgroundColor = "#111111";
    contador.style.width = "fit-content";
    contador.style.borderRadius = "4px";
    contador.style.borderColor = "aliceblue";
    contador.style.borderWidth = "revert";
    contador.style.borderStyle = "double";

    const unidades = model.minas % 10;
    const decenas = ((model.minas-unidades) % 100)/10;
    const centenas = ((model.minas-unidades-decenas*10) % 1000)/100;
    const millares = ((model.minas-unidades-decenas*10-centenas*100) % 10000)/1000;
    
    contador.innerHTML = 
        [unidades
        ,decenas 
        ,centenas
        ,millares
        ].reverse().map(val => {
            return `    
                <div class='digit ${numname[val]}' id='second--ones'>
                <div class='unit'></div>
                <div class='unit'></div>
                <div class='unit'></div>
                <div class='unit'></div>
                <div class='unit'></div>
                <div class='unit'></div>
                <div class='unit'></div>
                </div>
            `;
        }).join("");

    return contador;
}

function viewBotonIncrease(){

    let boton = document.createElement("input");
    boton.value = "Increase";
    boton.style.color = "black";
    boton.type = "button";
    boton.style.minWidth = "200px";
    boton.style.backgroundColor = "#77777";

    boton.onclick = () => update(null, null, null, "Increase");

    return boton;
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
    
    // Vecino 
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

    return li;
}

function esAgua(casilla){
   return ["Mina","Expl"].indexOf(casilla.class) < 0;
};
function esIcono(casilla){
    return ["Mina","Bandera","Expl", "maybeMina"].indexOf(casilla.class) > -1;
}

function losa(casilla){
    return ["Losa","Bandera", "maybeMina"].indexOf(casilla.class) > -1;
}

function css(){

    let heightTablero = model.rows*100;
    let widthTablero = model.cols*100;

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
    flex-direction: column;
}
.ms-tablero {
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
    min-height:  100px;
    min-width:  100px;
    font-size: 3em;
    text-align: center;
    background-size: contain;
    background-position: center center;
}

.ms-Losa {
    background-image: url( '/assets/casillavacia.svg' );
    /* background-image: url( '/assets/casillavacia.svg' ); */
    transition: 0s background-image;
}


.ms-Losa:hover {
    background-image: url( '/assets/casillavaciadw.svg' );
    /* background-image: url( '/assets/casillavaciadw.svg' ); */
    transition-delay:0.5s;
}

.ms-Suelo {
    background-image: url( '/assets/casillavaciadw.svg' );
    /* background-image: url( '/assets/casillavaciadw.svg' ); */
} 

.ms-Mina,.ms-Bandera, .ms-Expl, .ms-maybeMina{
    height:  100%;
    width:  100%;
    font-size: 3em;
    text-align: center;
    background-size: contain;
    background-position: center center;
    z-index: 10;
    position: absolute;
}

.ms-Mina {
    background-image: url( '/assets/bomba.svg' );
} 

.ms-Bandera {
    background-image: url( '/assets/bandera.svg' );
}

.ms-Expl {
    background-image: url( '/assets/bombaExpl.svg' );
} 

.ms-maybeMina {
    background-image: url( '/assets/maybeBomba.svg' );
} 

.ms-1, .ms-2, .ms-3, .ms-4 ,.ms-5, .ms-6,.ms-7,.ms-8{
    padding-top: 0.09em;
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

