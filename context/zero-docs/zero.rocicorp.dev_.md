---
url: "https://zero.rocicorp.dev/"
title: "Zero Docs"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

[GitHub](https://github.com/rocicorp/mono#zero) [Docs](https://zero.rocicorp.dev/docs)

Developing web applications has gotten insanely complex.

You need a tall pile of tech to build a "modern" web app: client-side code, server-side code, APIs to tie them together, data fetching, state management, hydration, websockets for reactivity, and a whole lot more. And once you're done, the resulting app still isn't very good.

It's time for a rethink.

We're building an open-source, general-purpose sync engine for the web. You put Zero in front of your database and web server, and we distribute your backend all the way to main thread of the UI.

![How Zero Works](https://zero.rocicorp.dev/images/how-it-works.svg)

You get a client-side API that _looks_ like an embedded db, but to which you can issue arbitrary _hybrid queries_ that span the entire database, including the server.

Behind the scenes, we synchronize queries results continuously to a client-side persistent cache. This cache is used automatically for future queries whenever possible.

```
Copyfunction Playlist({id}: {id: string}) {
  // This usually resolves *instantly*, and updates reactively
  // as server data changes. Just wire it directly to your UI –
  // no HTTP APIs, no state management no realtime goop.
  const [playlist] = useQuery(
    zero.query.playlist
      .related('tracks', track => track
        .related('album')
        .related('artist')
        .orderBy('playcount', 'asc'))
      .where('id', id)
      .one()
  );

  const onStar = (id: string, starred: boolean) => {
    zero.mutate.track.update({
      id,
      starred,
    });
  }

  if (!playlist) return null;

  return (
    <>
      <div>{playlist.name}</div>
      <div>
        {playlist.tracks.map(track => (
          <TrackRow key={track.id} track={track} onStar={onStar}/>
        ))}
      </div>
    </>
  );
}
```

This architecture provides:

- **Instant** (zero milliseconds) response for almost all user interactions – the user taps a button and the UI instantly updates, in the next frame.
- **Automatic reactivity** – a user changes something and all other users see the change live.
- **Dramatically faster** development velocity – almost all features can be built completely client-side, with no need for new server-side APIs to be built and deployed.
- **Scalability** – Zero can work with any amount of backend data. It doesn't require syncing all data to the client up-front, or knowing which data you'll need ahead of time. If the app needs data which hasn't already been synced, it is synced on demand.

Where Zero really shines is complex, highly-interactive applications like Linear and Superhuman. With Zero, these apps can be built in a fraction of the time it would take to build even an old-fashioned server-rendered web app.

Zero is currently in public alpha. It's got a few rough edges, and you have to deploy it yourself, but it's already remarkably fun. We're using it ourselves for Zero's [official bug tracker](https://bugs.rocicorp.dev/) and we find it much more productive than alternatives.

Ready to start? You can have your first app in production in about 20 minutes.

[Get Started Now](https://zero.rocicorp.dev/docs)