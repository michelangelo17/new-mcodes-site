---
title: "The Agent Stack in 2026: Which Layer Is Actually Worth Standing On"
date: 2026-05-27
tags: ["agents", "architecture", "mcp", "a2a", "harness"]
summary: "The model is swappable, the harness is rentable, the protocols are open. The value doesn't sit on any one layer — it leaks upward, faster than anyone is building businesses on it. A field guide to where it's heading next."
---

The most serious conversation about AI infrastructure is the one about where the value accrues, and it's the question every market map and every "is this just a thin wrapper" argument is really asking. One camp says the model is the moat: whoever has the best model wins and the layer on top is a commodity. The other says the reverse, that models are commoditizing and the durable value is in the application, the workflow, the distribution, everything the model doesn't hand you for free. This is a real debate between people who have thought about it carefully, and it has produced a great many confident stack diagrams.

It is also asking the wrong question. It asks where the value sits, and the defining property of this stack is that the value does not sit anywhere. It moves. It leaks upward, and it leaks faster than anyone is building businesses on it.

That's the part I keep coming back to. "Which layer is valuable" is a static question about a system whose entire behaviour is migration. You can answer it correctly today and be wrong by the next release cycle, not because you misjudged the layer but because the value walked out of it. The only question with a stable answer is a different one: which layer are you standing on, and is it about to become someone else's product.

## The stack, in plain terms

Three layers, and most of the confusion in these conversations comes from people arguing across them without noticing.

At the bottom is the model. The raw capability. This is the layer everyone fixated on for two years, and it's the layer that matters least to your architecture now, because the model is not the lock-in. Open weights are good enough for most agent work, there are several frontier providers at rough parity, and swapping between them is increasingly a config change. If your moat is "we use the best model," you don't have a moat, you have a vendor relationship that expires at the next release.

In the middle is the harness. This is the operational structure around the model that turns a capability into something that actually ships work: the execution loop, context management, tool integration, verification, and the observability and cost controls around all of it. Anthropic frames a harness as what lets a model work reliably across [long-running, multi-step tasks](https://platform.claude.com/docs/en/managed-agents/overview), which is a precise way of saying it's everything between "the model can answer" and "the system can be trusted to do the job." This is the layer that quietly does the work, and it's worth understanding what just happened to it.

At the top is everything above the harness: fleets of agents, multi-agent coordination, the protocols that let agents find each other and call each other's tools. This is the unsettled layer. It's where the interesting problems are and where almost nothing has consolidated.

## What happened to the harness, and how fast

"Harness" wasn't a word anyone used eighteen months ago. The discipline of building these, [harness engineering](https://addyosmani.com/blog/agent-harness-engineering/), only crystallized as a named thing over the last year, mostly off the back of how Claude Code and OpenAI's Codex work were built. The shape has settled enough that people now draw roughly the same diagram: a model wrapped in a handful of layers, an execution loop, context management, tools, verification, and the operational plumbing around all of it. The exact labels still vary writeup to writeup, which is normal for something this young. The components people reach for do not, and that convergence is the tell that the concept has stopped moving.

Here is the part worth sitting with. The concept crystallized, and then it became a managed product, in about a year.

AWS made [Amazon Bedrock AgentCore generally available](https://aws.amazon.com/blogs/aws/introducing-amazon-bedrock-agentcore-securely-deploy-and-operate-ai-agents-at-any-scale) in October 2025: a managed runtime that runs an agent built in [any framework you like](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available) (LangGraph, CrewAI, its own Strands SDK, or your own code) and takes over the runtime, memory, identity, gateway, and observability. Anthropic followed in April 2026 with [Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview) in public beta, a hosted runtime that takes the sandboxing, state, and recovery you used to build yourself and runs it as infrastructure, with multi-agent coordination still in research preview. OpenAI shipped its [Agents SDK](https://openai.github.io/openai-agents-python/) with handoffs and tracing built in. Two of the three will now rent you the runtime outright; the third packaged the harness as a library you import. Either way, three of the largest companies in the space took the layer the field had just finished naming and turned it into something you no longer have to build.

How completely did it commoditize? AWS's own API now has a `CreateHarness` call. The word the field coined a year earlier is a resource type you provision.

That is a stunningly short distance from "new idea" to "commodity." And it tells you exactly where not to plant a flag.

## The value leaks upward

Step back and the pattern is clean. Each layer commoditizes from below as the layer above it matures.

The model layer commoditized first: multiple providers, open weights, swappability. The harness layer is commoditizing right now, in real time, via the managed services above. And the connective layer above the harness, the protocols, is being commoditized on purpose. Both of the protocols that matter are open and now sit under the Linux Foundation: MCP for how an agent talks to tools and data, A2A for how agents talk to each other across organizational boundaries.

A2A is the cleaner illustration. It went from a Google project to [a Linux Foundation project in June 2025](https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/), shipped its [first stable spec, v1.0, in early 2026](https://a2a-protocol.org/latest/announcing-1.0/), and crossed [more than 150 supporting organizations at its one-year mark](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year). MCP took the same road a few months later, and the way it took it is the giveaway: in December 2025 Anthropic [donated MCP to the Agentic AI Foundation](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation), a directed fund it set up inside the Linux Foundation jointly with Block and OpenAI. Competitors do not co-found a neutral foundation for a layer they expect to compete on. They do it for plumbing. The connective tissue of the agent layer is being deliberately turned into exactly that.

This is the same shape the web went through. HTTP is open, and the cloud market consolidated to three companies anyway. SMTP is open, and email consolidated to two inboxes. Open protocols don't prevent consolidation, they relocate it. They commoditize the wire and push the value to whatever the wire doesn't carry.

So where does the value actually sit, if the model is swappable, the harness is rentable, and the protocols are open? It sits at the top, and the top keeps moving. Right now it's moving to the things none of those layers solve: who an agent is, what it's allowed to do, who's liable when it acts, and what happens at the boundaries where one agent hands off to another. Identity, trust, and the seams between agents. That's the layer that isn't open, isn't managed, and isn't settled.

## How to tell which layer you're betting on

The practical version of all this is a single diagnostic, asked honestly. If your differentiation lives at the model layer, you don't have differentiation, you have a bill. If it lives at the harness layer, you have something real today and a depreciating asset on a roughly twelve-month clock, because the managed versions are coming for exactly what you built, and the dates above show how fast they arrive. If it lives above the harness, in how a fleet coordinates, how trust propagates across a handoff, how you'd even know an agent misbehaved at a boundary, you're betting on the layer that's still finding its top. That's the uncomfortable bet and it's the only one with room left in it.

None of which means don't build a harness. It means know that the harness you build is a tool, not a moat, and spend your scarce attention on the layer above it.

## The seam is where it gets interesting

The thing the managed harnesses don't do, the thing the open protocols deliberately leave to you, is the boundary. Watch what A2A v1.0 actually shipped to make decentralized agent discovery safe: [Signed Agent Cards](https://stellagent.ai/insights/a2a-protocol-google-agent-to-agent), cryptographic proof that a capability card came from the domain that claims it, so a stranger can't stand up a forged card and redirect your agent. That is a real fix, and it quietly proves the larger point. Identity is not trust. Knowing who an agent says it is tells you nothing about whether you should believe what it hands back across a delegation, or whether the instructions riding along with that handoff are safe to act on. A2A defines how agents talk once they've found each other and now lets them verify each other's names; it does not tell you whether to trust what came across. The managed runtimes give you a clean single agent; the moment two of them hand off to each other, you're in territory none of the convenient layers cover.

That seam, where one agent trusts another, is where I think the unsolved problems actually live, and it's where I'm spending the next stretch of work: measuring what breaks at the boundaries when agents start trusting each other, across the managed runtimes everyone is rushing to adopt.

More on that soon. For now the point is narrower and worth saying plainly. The agent stack has layers, the value evaporates upward through them faster than it has anywhere I've watched, and if you're building, the only durable question is whether you're standing on a layer that's about to become someone else's product.
