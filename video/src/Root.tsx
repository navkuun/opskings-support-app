import { Composition, Folder } from "remotion"

import { FullVideo } from "./FullVideo"
import { calculateMetadata, calculateStackedMetadata } from "./metadata"
import { IntroScene } from "./scenes/IntroScene"
import { OutroScene } from "./scenes/OutroScene"
import { TextScene } from "./scenes/TextScene"
import { StackedStillsScene } from "./scenes/StackedStillsScene"

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
          }}
          calculateMetadata={calculateMetadata}
        />
        <Composition id="Intro" component={IntroScene} durationInFrames={60} fps={30} width={1280} height={720} />
        <Composition id="Text" component={TextScene} durationInFrames={180} fps={30} width={1280} height={720} />
        <Composition
          id="StackedStills"
          component={StackedStillsScene}
          durationInFrames={120}
          fps={30}
          width={1280}
          height={720}
          defaultProps={{
            manifestPath: "captures/manifest.json",
          }}
          calculateMetadata={calculateStackedMetadata}
        />
        <Composition id="Outro" component={OutroScene} durationInFrames={60} fps={30} width={1280} height={720} />
      </Folder>
    </>
  )
}
