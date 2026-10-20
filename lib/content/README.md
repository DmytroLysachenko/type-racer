# Passage set

`passages.ts` contains original text written for TypeArena. It is not scraped or copied from another typing site or quotation collection.

The `v2` array order is part of the shared-round protocol. Do not edit or reorder it after deployment: old and new clients can otherwise receive different passages for the same round. Publish a new version and room namespace, retain authorization for the previous namespace during rollout, and test both clients before retiring the old namespace. Personal practice may reuse the current set but does not join a presence room.

`practice-material.ts` contains additional original short thoughts, numbers, punctuation, gentle/challenge and Polish exercises. It does not affect shared-room identity, so this material can evolve independently. Custom practice text is supplied by the visitor and is not bundled, uploaded or saved in local history.
