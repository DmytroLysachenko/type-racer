# TypeArena language

TypeArena is a shared, timed typing race. These terms distinguish the shared event from one visitor's attempt and from data supplied by peers.

## Language

**Round**:
A shared 31-second cycle with a lobby, race, and results phase. Everyone in a round receives the same passage and phase times.
_Avoid_: Session, test

**Race attempt**:
One player's input during a round. An attempt starts with the first accepted character and ends when the passage is completed or the round ends.
_Avoid_: Round, session

**Practice attempt**:
A private typing test chosen by one visitor, ending after a selected duration or completion of its passage. Word-count and focused modes choose different passages; custom text remains in the current tab.
_Avoid_: Round, race attempt

**Passage**:
The text assigned to a round for players to type.
_Avoid_: Quote, sentence (a passage need not be either)

**Character**:
One visible Unicode grapheme cluster in the passage or input. Speed and accuracy count these units; canonically equivalent accents compare equal.
_Avoid_: UTF-16 code unit, Unicode code point

**Guest**:
A visitor with a temporary signed room identity and a display name, without an account.
_Avoid_: Account, authenticated user

**Standing**:
A room position calculated from peer-submitted progress. It is social feedback and does not verify human typing.
_Avoid_: Verified score, leaderboard rank

**Progress update**:
A guest's self-reported snapshot of their current race attempt, sent through the room after input changes. Updates are throttled while typing; the first input and completion are sent immediately. Peers use the latest accepted update for standings and passage markers.
_Avoid_: Verified event, server-measured keystroke

**Peer marker**:
A visual indication of an active guest's position above a character in the shared passage. It reflects the latest accepted progress update and may lag behind that guest's actual input. Exact room positions remain available in the standings table.
_Avoid_: Cursor, verified position

**Personal result**:
A completed race or practice attempt saved on the player's device. It is not shared across devices.
_Avoid_: Account history, global score
