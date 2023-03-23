
port module Main exposing (main)

{-| HEADS UP! You can view this example alongside the running code at


We're going to make confetti come out of the party popper emoji: 🎉
([emojipedia](https://emojipedia.org/party-popper/)) Specifically, we're going
to lift our style from [Mutant Standard][ms], a wonderful alternate emoji set,
which is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike
4.0 International License.

[ms]: https://mutant.tech/

-}

import Browser
import Html exposing (Html)
import Html.Attributes as Attrs exposing (style)
import Particle.System as System exposing (System)
import Random exposing (Generator)
import Json.Decode exposing (Decoder, map4, field, int, string, float, succeed, decodeString )


import Confetti exposing (Confetti)


type alias Model =
    { systemConfetti : System Confetti
    }

type Msg
    =  ParticleConfettiMsg (System.Msg Confetti)
    | RequestAnimation String



update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        
        RequestAnimation requestAnimationStr -> 
            let
                requestAnimationMsg = (decodeString requestAnimationMsgDecoder requestAnimationStr)
            in
                case requestAnimationMsg of
                    Ok data -> 
                        case data.action of
                            "Victory" -> 
                                (burst model ((toFloat data.x), (toFloat data.y)) (toFloat data.direction), Cmd.none )
                            
                            _ -> 
                                ( model, Cmd.none )
                    Err _ ->
                        (burst model (0, 0) 0, Cmd.none )
                            


        ParticleConfettiMsg particleMsg ->
            ( { model | systemConfetti = System.update particleMsg model.systemConfetti }
            , Cmd.none
            )


-- BURSTS

burst : Model -> (Float, Float) -> Float -> Model
burst model (x, y) direction = 
    { model | systemConfetti = System.burst (Confetti.burst (x, y) direction) model.systemConfetti }


-- views


view : Model -> Html msg
view model =
    let
        props = [ style "width" "100%"
                , style "height" "100vh"
                -- , style "z-index" "1"
                , style "position" "absolute"
                , style "pointer-events" "none"
                ]

        particleView =  System.view Confetti.view props model.systemConfetti
        
    in
    Html.main_
        [Attrs.id "myapp"
        , style "z-index" "100"
        ]
        [ particleView ]


-- PORTS

port messageReceiver : (String -> msg) -> Sub msg

type alias RequestAnimationMsg = {
        x : Int
        , y : Int
        , direction : Int
        , action: String
    }

requestAnimationMsgDecoder : Decoder RequestAnimationMsg
requestAnimationMsgDecoder = 
    map4 RequestAnimationMsg
        (field "x" int)
        (field "y" int)
        (field "direction" int)
        (field "action" string)

-- tie it all together!

-- SUBSCRIPTIONS


-- Subscribe to the `messageReceiver` port to hear about messages coming in
-- from JS. Check out the index.html file to see how this is hooked up to a
-- WebSocket.
--
subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ System.sub [] ParticleConfettiMsg model.systemConfetti
        , messageReceiver RequestAnimation
        ]


init :() -> (Model, Cmd Msg)
init =
    \_ -> (   { 
          systemConfetti = System.init (Random.initialSeed 0)
        }
    , Cmd.none
    )

main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
        