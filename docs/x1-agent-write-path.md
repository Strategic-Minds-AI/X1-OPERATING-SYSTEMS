# X1 agent write path

Agents in the X1 Operating System can now change systems, not only read them. Every change is judged before it runs and recorded after.

## What agents can do

| System | Capability |
|---|---|
| GitHub | Commit a file to the working branch; open a pull request |
| Supabase | Apply one change statement (INSERT, UPDATE, DELETE or DDL) |

## What is refused, and why

- A commit to `main`. Production is only reached through a pull request.
- A change to workflow files: how the repository builds is not an agent decision.
- On Supabase: a read on the write path, a statement touching the `auth` or `storage` schemas, an UPDATE or DELETE with no filter, and more than one statement in a call.
- A statement that destroys data, until it is confirmed.

## Where the record lives

Every attempt, allowed or refused, is written to X1ActionLog with the verdict, the risk, whether it can be undone, and how.
