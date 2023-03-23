module Confetti exposing (Confetti(..), burst, view)

import Random exposing (Generator)
import Random.Extra
import Random.Float exposing (normal)
import Particle exposing (Particle)
import Svg exposing (Svg)
import Svg.Attributes as SAttrs
-- Generators!


{-| So, let's break down what we've got: this emoji is a cone bursting stuff
towards the upper right (you can see it at `tada.png` in the repo.) We have:

  - little brightly-colored squares. Looks like they can spin!
  - longer, wavy, brightly-colored streamers (but we'll just use rectangles here)

Let's model those as a custom type!

-}
type Confetti
    = Square
        { color : Color
        , rotations : Float

        -- we add a rotation offset to our rotations when rendering. It looks
        -- pretty odd if all the particles start or end in the same place, so
        -- this is part of our random generation.
        , rotationOffset : Float
        }
    | Streamer
        { color : Color
        , length : Int
        }


type Color
    = Red
    | Pink
    | Yellow
    | Green
    | Blue

{-| Generate a confetti square, using the color ratios seen in Mutant Standard.
-}
genSquare : Generator Confetti
genSquare =
    Random.map3
        (\color rotations rotationOffset ->
            Square
                { color = color
                , rotations = rotations
                , rotationOffset = rotationOffset
                }
        )
        (Random.weighted
            ( 1 / 5, Red )
            [ ( 1 / 5, Pink )
            , ( 1 / 5, Yellow )
            , ( 2 / 5, Green )
            ]
        )
        (normal 1 1)
        (Random.float 0 1)


{-| Generate a streamer, again using those color ratios
-}
genStreamer : Generator Confetti
genStreamer =
    Random.map2
        (\color length ->
            Streamer
                { color = color
                , length = round (abs length)
                }
        )
        (Random.uniform Pink [ Yellow, Blue ])
        (normal 25 10 |> Random.map (max 10))


{-| Generate confetti according to the ratios in Mutant Standard's tada emoji.
-}
genConfetti : Generator Confetti
genConfetti =
    Random.Extra.frequency
        ( 5 / 8, genSquare )
        [ ( 3 / 8, genStreamer ) ]


view : Particle Confetti -> Svg msg
view particle =
    let
        lifetime =
            Particle.lifetimePercent particle

        -- turns out that opacity is pretty expensive for browsers to calculate,
        -- and will slow down our framerate if we change it too much. So while
        -- we *could* do this with, like, a bezier curve or something, we
        -- actually want to just keep it as stable as possible until we actually
        -- need to fade out at the end.
        opacity =
            if lifetime < 0.1 then
                lifetime * 10

            else
                1
    in
    case Particle.data particle of
        Square { color, rotationOffset, rotations } ->
            Svg.rect
                [ SAttrs.width "10px"
                , SAttrs.height "10px"
                , SAttrs.x "-5px"
                , SAttrs.y "-5px"
                , SAttrs.rx "2px"
                , SAttrs.ry "2px"
                , SAttrs.fill (fill color)
                , SAttrs.stroke "black"
                , SAttrs.strokeWidth "4px"
                , SAttrs.opacity <| String.fromFloat opacity
                , SAttrs.transform <|
                    "rotate("
                        ++ String.fromFloat ((rotations * lifetime + rotationOffset) * 360)
                        ++ ")"
                ]
                []

        Streamer { color, length } ->
            Svg.rect
                [ SAttrs.height "10px"
                , SAttrs.width <| String.fromInt length ++ "px"
                , SAttrs.y "-5px"
                , SAttrs.rx "2px"
                , SAttrs.ry "2px"
                , SAttrs.fill (fill color)
                , SAttrs.stroke "black"
                , SAttrs.strokeWidth "4px"
                , SAttrs.opacity <| String.fromFloat opacity
                , SAttrs.transform <|
                    "rotate("
                        ++ String.fromFloat (Particle.directionDegrees particle)
                        ++ ")"
                ]
                []



fill : Color -> String
fill color =
    case color of
        Red ->
            "#D72D35"

        Pink ->
            "#F2298A"

        Yellow ->
            "#F2C618"

        Green ->
            "#2ACC42"

        Blue ->
            "#37CBE8"


burst : ( Float, Float ) -> Float -> Generator (List (Particle Confetti))
burst (x, y) direction = 
        (Random.list 100 (particleAt x y direction))


{-| We're going to emit particles at the mouse location, so we pass those
parameters in here and use them without modification.
-}
particleAt : Float -> Float -> Float -> Generator (Particle Confetti)
particleAt x y direction =
    Particle.init genConfetti
        |> Particle.withLifetime (normal 1.5 0.25)
        |> Particle.withDelay (normal 0 0.1)
        |> Particle.withLocation (Random.constant { x = x, y = y })
        -- our direction is determined by the angle of the party popper cone
        -- (about 47°) as well as it's width (about 60°). We use a normal
        -- distribution here so that most of the confetti will come out in the
        -- same place, with falloff to the sides. We want most of the confetti
        -- to show up in the center 30°, so the standard deviation of the
        -- distribution should be 15°.
        |> Particle.withDirection (normal (degrees direction) (degrees 15))
        |> Particle.withSpeed (normal 600 100)
        |> Particle.withGravity 980
        |> Particle.withDrag
            (\confetti ->
                { density = 0.001226
                , coefficient =
                    case confetti of
                        Square _ ->
                            1.15

                        Streamer _ ->
                            0.85
                , area =
                    case confetti of
                        Square _ ->
                            1

                        Streamer { length } ->
                            toFloat length / 10
                }
            )
