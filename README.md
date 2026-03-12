# Claude Agent SDK Demos

> ⚠️ **IMPORTANT**: These are demo applications by Anthropic. They are intended for local development only and should NOT be deployed to production or used at scale.

This repository contains multiple demonstrations of the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview), showcasing different ways to build AI-powered applications with Claude.

## Available Demos

### 📧 [Email Agent](./email-agent)
An in-development IMAP email assistant that can:
- Display your inbox
- Perform agentic search to find emails
- Provide AI-powered email assistance

### 📊 [Excel Demo](./excel-demo)
Demonstrations of working with spreadsheets and Excel files using Claude.

### 👋 [Hello World](./hello-world)
A simple getting-started example to help you understand the basics of the Claude Agent SDK.

### 👋 [Hello World V2](./hello-world-v2)
Examples for the V2 Session API (`unstable_v2_*`), demonstrating multi-turn conversations, session persistence, and the differences between the V1 `query()` and V2 Session APIs.

### 💬 [Simple Chat App](./simple-chatapp)
A full-stack demo chat application using the Claude Agent SDK with a React frontend and Express backend, demonstrating real-time WebSocket communication and multi-session management.

### 📄 [Resume Generator](./resume-generator)
Generates professional resumes by researching a person using web search (LinkedIn, GitHub, company pages) and producing a formatted `.docx` file via the Claude Agent SDK.

### 📈 [Varicent Planning Agent](./varicent-planning-agent)
A multi-agent sales planning tool for Varicent consultants. Reads a Technical Design Document and sales data CSVs, then runs three specialized subagents in parallel to produce territory assignments, quota targets, individual quota letters, and a full planning cycle specification with Varicent setup checklist.

### 🔬 [Research Agent](./research-agent)
A multi-agent research system that coordinates specialized subagents to research topics and generate comprehensive reports:
- Breaks research requests into subtopics
- Spawns parallel researcher agents to search the web
- Synthesizes findings into detailed reports
- Demonstrates detailed subagent activity tracking

## Quick Start

Each demo has its own directory with dedicated setup instructions. Navigate to the specific demo folder and follow its README for setup and usage details.


## Prerequisites

- [Bun](https://bun.sh) runtime (or Node.js 18+)
- An Anthropic API key ([get one here](https://console.anthropic.com))

## Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/anthropics/claude-agent-sdk-demos.git
cd claude-agent-sdk-demos
```

2. **Choose a demo and navigate to its directory**
```bash
cd email-agent  # or excel-demo, or hello-world
```

3. **Follow the demo-specific README** for setup and usage instructions

## Resources

- [Claude Agent SDK Documentation](https://docs.anthropic.com/en/docs/claude-code/sdk/sdk-overview)
- [API Reference](https://docs.anthropic.com/claude)
- [GitHub Issues](https://github.com/anthropics/claude-agent-sdk-demos/issues)

## Support

These are demo applications provided as-is. For issues related to:
- **Claude Agent SDK**: [SDK Documentation](https://docs.anthropic.com/claude-code)
- **Demo Issues**: [GitHub Issues](https://github.com/anthropics/sdk-demos/issues)
- **API Questions**: [Anthropic Support](https://support.anthropic.com)

## License

MIT - This is sample code for demonstration purposes.
