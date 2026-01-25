import { Composition, Folder } from "remotion"

import { FullVideo } from "./FullVideo"
import { calculateMetadata } from "./metadata"
import { IntroScene } from "./scenes/IntroScene"
import { OutroScene } from "./scenes/OutroScene"

export const RemotionRoot = () => {
  return (
    <>
      <Folder name="OpsKings">
        <Composition
          id="FullVideo"
          component={FullVideo}
          durationInFrames={300}
          fps={30}
          width={1280}
          height={720}
          defaultProps={{
            manifestPath: "captures/manifest.json",
            useStills: true,
          }}
          calculateMetadata={calculateMetadata}
        />
        <Composition id="Intro" component={IntroScene} durationInFrames={60} fps={30} width={1280} height={720} />
        <Composition id="Outro" component={OutroScene} durationInFrames={60} fps={30} width={1280} height={720} />
      </Folder>
    </>
  )
}
