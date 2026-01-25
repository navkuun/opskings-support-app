import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"

export function IntroScene() {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()

  const crownStart = fps * 0.05
  const crownEnd = fps * 0.75
  const textStart = fps * 0.32
  const textEnd = fps * 1.0

  const slideStart = fps * 1.1
  const slideEnd = fps * 1.35

  const exampleInStart = fps * 1.25
  const exampleInEnd = fps * 1.7

  const xInStart = fps * 1.2
  const xInEnd = fps * 1.6

  const exampleIn = interpolate(frame, [exampleInStart, exampleInEnd], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const exampleOpacity = exampleIn
  const exampleScale = interpolate(frame, [exampleInStart, exampleInEnd], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })

  const xProgress = interpolate(frame, [xInStart, xInEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const xOpacity = xProgress
  const xScale = interpolate(xProgress, [0, 1], [0.6, 1])
  const xRotate = interpolate(xProgress, [0, 1], [-12, 0])

  const rowGap = Math.min(width * 0.045, 56)
  const exampleWidth = Math.min(width * 0.24, 320)
  const xSize = Math.min(width * 0.085, 82)
  const logoWidth = Math.min(width * 0.36, 460)
  const logoHeight = (logoWidth * 44) / 304
  const rowWidth = exampleWidth + xSize + logoWidth + rowGap * 2
  const rowLeft = (width - rowWidth) / 2
  const rowLeftStart = (width - logoWidth) / 2
  const rowTop = height * 0.5 - logoHeight / 2

  const crownProgress = interpolate(frame, [crownStart, crownEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  })
  const crownFinalCenterX = logoWidth * 0.5603
  const crownFinalTop = logoHeight * 0.015
  const crownFinalHeight = logoHeight * 0.1815
  const crownStartCenterX = logoWidth * 0.5
  const crownStartCenterY = logoHeight * 0.5
  const crownFinalCenterY = crownFinalTop + crownFinalHeight / 2
  const crownTranslateX = interpolate(
    crownProgress,
    [0, 1],
    [crownStartCenterX - crownFinalCenterX, 0],
  )
  const crownTranslateY = interpolate(
    crownProgress,
    [0, 1],
    [crownStartCenterY - crownFinalCenterY, 0],
  )
  const crownScale = interpolate(crownProgress, [0, 0.85, 1], [4.8, 1.05, 1], {
    easing: Easing.out(Easing.cubic),
  })

  const crownFadeIn = interpolate(frame, [crownStart, crownStart + fps * 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const crownFadeOut = interpolate(frame, [textStart + fps * 0.1, textStart + fps * 0.22], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const crownOpacity = Math.min(crownFadeIn, crownFadeOut)

  const textProgress = interpolate(frame, [textStart, textEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const textOpacity = textProgress
  const opsOffset = interpolate(textProgress, [0, 1], [-logoWidth * 0.18, 0])
  const kingsOffset = interpolate(textProgress, [0, 1], [logoWidth * 0.18, 0])
  const splitPercent = 40.4

  const slideProgress = interpolate(frame, [slideStart, slideEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const rowTranslateX = interpolate(slideProgress, [0, 1], [rowLeftStart - rowLeft, 0])
  const rightSlideIn = interpolate(slideProgress, [0, 1], [24, 0])

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: rowLeft,
          top: rowTop,
          width: rowWidth,
          display: "flex",
          alignItems: "center",
          gap: rowGap,
          transform: `translateX(${rowTranslateX}px)`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: logoWidth,
            height: logoHeight,
            overflow: "visible",
          }}
        >
          <Img
            src={staticFile("logo.webp")}
            alt="OpsKings crown"
            style={{
              position: "absolute",
              left: crownFinalCenterX,
              top: crownFinalTop,
              height: crownFinalHeight,
              width: "auto",
              opacity: crownOpacity,
              transform: `translate(-50%, 0) translate(${crownTranslateX}px, ${crownTranslateY}px) scale(${crownScale})`,
              transformOrigin: "center center",
            }}
          />

          <Img
            src={staticFile("opskings-full-black.svg")}
            alt="OpsKings logo"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: textOpacity,
              clipPath: `inset(0 ${100 - splitPercent}% 0 0)`,
              transform: `translateX(${opsOffset}px)`,
            }}
          />
          <Img
            src={staticFile("opskings-full-black.svg")}
            alt="OpsKings logo"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: textOpacity,
              clipPath: `inset(0 0 0 ${splitPercent}%)`,
              transform: `translateX(${kingsOffset}px)`,
            }}
          />
        </div>

        <div
          style={{
            opacity: xOpacity,
            transform: `translateX(${rightSlideIn}px) scale(${xScale}) rotate(${xRotate}deg)`,
            width: xSize,
            height: xSize,
          }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <line x1="12" y1="12" x2="88" y2="88" stroke="#111111" strokeWidth="6" strokeLinecap="butt" />
            <line x1="88" y1="12" x2="12" y2="88" stroke="#111111" strokeWidth="6" strokeLinecap="butt" />
          </svg>
        </div>

        <Img
          src={staticFile("example-logo.svg")}
          alt="Example logo"
          style={{
            width: exampleWidth,
            height: "auto",
            opacity: exampleOpacity,
            transform: `translateX(${rightSlideIn}px) scale(${exampleScale})`,
          }}
        />
      </div>
    </AbsoluteFill>
  )
}
