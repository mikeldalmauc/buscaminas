 
# Instalar y guia de el
 https://guide.elm-lang.org/install/elm.html

 # Compilar el código

 ```
 elm make src/Main.elm --output build/main.js
 ```

elm make elm/src/Main.elm --output --optimize build/confeti.js

uglifyjs build/confeti.js --compress "pure_funcs=[F2,F3,F4,F5,F6,F7,F8,F9,A2,A3,A4,A5,A6,A7,A8,A9],pure_getters,keep_fargs=false,unsafe_comps,unsafe" | uglifyjs --mangle --output build/confeti.min.js
uglifyjs src/buscaminas.mjs --compress "pure_funcs=[F2,F3,F4,F5,F6,F7,F8,F9,A2,A3,A4,A5,A6,A7,A8,A9],pure_getters,keep_fargs=false,unsafe_comps,unsafe" | uglifyjs --mangle --output build/buscaminas.min.js

Si uglify no está disponible
npm install uglify-js --global

Para optimizar codigo para producción Leer: https://github.com/elm/compiler/blob/master/hints/optimize.md

# Arrancar la web
Live server sobre app.html 

# Librería de particulas

https://package.elm-lang.org/packages/BrianHicks/elm-particle/latest/


# Create elm app useful info
https://github.com/halfzebra/create-elm-app/blob/master/template/README.md

# Subscriptions
https://elmprogramming.com/subscriptions.html


# Scaling elm app

https://rchavesferna.medium.com/child-parent-communication-in-elm-outmsg-vs-translator-vs-nomap-patterns-f51b2a25ecb1

https://www.reddit.com/r/elm/comments/65s0g4/resources_regarding_scaling_elm_apps/?utm_content=title&utm_medium=post_embed&utm_name=21a4975359fb4c6588e457d88c3a43c7&utm_source=embedly&utm_term=65s0g4