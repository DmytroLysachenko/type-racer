# Version shared passages with their room

> Historical record. For current guidance, see the [product roadmap](../../../roadmap.md).

Shared race text is selected from an ordered bundled passage set, so changing that order can make two deployed clients type different text in the same round. Version 2 clients therefore use `presence-round-v2-{roundId}` while the authorization route continues to accept legacy `presence-round-{roundId}` rooms. This temporarily divides room populations during rollout, but it prevents mismatched passages from appearing in one standing. Future passage changes must publish a new version and room name rather than editing an existing set in place.
