<div align="center">

<img src="assets/collabor8r.webp" alt="Collabor8r logo" width="120" />

# Collabor8r Mobile

**Version 2.0**

*One workspace for every team, every issue, every sprint - right in your pocket.*

![Version](https://img.shields.io/badge/version-2.0-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)

</div>

---

## Overview

**Collabor8r Mobile** is the native iOS and Android client of Collabor8r v2.0, a Jira-style work management suite. It covers multi-organization workspaces, projects, issues, kanban boards, sprints and backlogs, calendar, reports, automation, forms, a service desk, a wiki, and **Jerry**, the built-in AI assistant. It talks to the **Collabor8r-Server** API and complements the **Collabor8r web client**, so you can triage, plan and ship from anywhere.

## Why Collabor8r?

Jira is powerful but heavy, with many add-ons and a mobile app that often feels like a shrunken desktop. Trello is simple but quickly outgrown. Asana, ClickUp and Linear each cover part of the picture. Collabor8r takes a different approach.

- **Unified everything.** Issues, boards, sprints, wiki, forms, service desk, automation, budgets, goals, risks, test management and reports ship in one app, with no marketplace plugins and no separate subscriptions.
- **Native mobile experience.** Built with React Native and Expo Router rather than a wrapped web view. It has bottom navigation, bottom sheets, gesture-driven interactions and automatic light and dark themes.
- **Multi-org by design.** Switch organizations and projects from the header, with roles and permissions managed per project.
- **AI included.** Jerry is built in, so there is no third-party add-on to install.
- **Same data as the web.** One server, one account. Start on the desktop and finish on your phone.

## Tech Stack

Collabor8r Mobile connects to **Collabor8r-Server** over REST and complements the **Collabor8r web client**.

| Layer | Technology |
| --- | --- |
| Framework | ![Expo](https://img.shields.io/badge/Expo-~57.0.33-000020?logo=expo&logoColor=white) ![React Native](https://img.shields.io/badge/React%20Native-0.86.3-61DAFB?logo=react&logoColor=black) ![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react&logoColor=black) |
| Navigation | ![Expo Router](https://img.shields.io/badge/Expo%20Router-~57.0.31-000020?logo=expo&logoColor=white) ![Screens](https://img.shields.io/badge/Screens-~4.26.0-444) |
| Styling | ![Uniwind](https://img.shields.io/badge/Uniwind-%5E1.13.2-38bdf8) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%5E4-06B6D4?logo=tailwindcss&logoColor=white) |
| Animation and gestures | ![Reanimated](https://img.shields.io/badge/Reanimated-4.5.1-6c47ff) ![Gesture Handler](https://img.shields.io/badge/Gesture%20Handler-~2.32.0-444) ![Worklets](https://img.shields.io/badge/Worklets-0.10.1-444) |
| Graphics | ![SVG](https://img.shields.io/badge/react--native--svg-15.15.4-ffb13b) |
| Networking | ![Axios](https://img.shields.io/badge/Axios-%5E1.21.1-5A29E4?logo=axios&logoColor=white) |
| Storage and security | ![SecureStore](https://img.shields.io/badge/expo--secure--store-~57.0.4-000020?logo=expo&logoColor=white) ![AsyncStorage](https://img.shields.io/badge/AsyncStorage-2.2.0-444) |
| Typography | ![Manrope](https://img.shields.io/badge/Manrope-0.4.3-444) ![Bricolage](https://img.shields.io/badge/Bricolage%20Grotesque-0.4.1-444) |
| Backend | Collabor8r-Server (REST API) |

## Features

**Workspace**
- Authentication: login, registration and invite acceptance (organization and project invites)
- Multi-organization support with an org switcher, members, groups, org settings and org audit log
- Project list, project creation and a project switcher with theme picker
- Dashboard, My Work and in-app notifications

**Issues**
- Issue list with filters, saved filters and bulk actions
- Issue detail with fields, comments, history, attachments, linked issues, external links and approvals
- Work logging and a timesheet

**Planning and delivery**
- Backlog with sprint panels and a complete-sprint flow
- Kanban boards with custom columns and board settings
- Calendar with month grid and agenda views
- Releases, goals and risks
- Budget tracking with budget lines and actuals
- Test management with test runs

**Reports and dashboards**
- Reports with bar and donut charts
- Custom project dashboards

**Automation and integrations**
- Automation rules with a rule editor and run history
- Integrations and webhooks, including delivery logs

**Forms, service desk and wiki**
- Form builder, form renderer and submissions
- Service desk with its own settings
- Wiki with page creation and editing

**Project settings**
- Custom fields, labels, workflows and transitions
- Roles and a permission matrix, people management
- Project audit log

**Jerry AI assistant**
- AI panel, draft previews and a usage meter

**Experience**
- Light and dark themes, plus appearance, profile, security and notification settings
- In-app help guides

## Functionalities

| Technology | What it does | Why it is better |
| --- | --- | --- |
| Expo (SDK 57) and React Native 0.86 with the New Architecture | Runs one codebase as native iOS and Android apps | Real native views and fast startup, without maintaining two apps |
| Expo Router | File-based routing under `app/`, with route groups for public and authenticated areas and dynamic routes such as `p/[projectId]/issues/[issueKey]` | Deep links via the `collabr8r` scheme work out of the box, and the structure mirrors the product |
| Uniwind and Tailwind CSS 4 | Utility-class styling for React Native | Consistent design tokens and theming, with less style boilerplate |
| Reanimated, Worklets and Gesture Handler | Smooth sheets, drawers and touch interactions | Animations run on the UI thread, so lists and boards stay responsive |
| react-native-svg | Renders the report charts (bar, donut) | Lightweight and sharp at any density, with no heavy chart library |
| Axios | Calls the Collabor8r-Server REST API | One configured client keeps auth handling in one place |
| Expo SecureStore and AsyncStorage | Keeps session data and local preferences | Credentials live in the device keychain or keystore rather than plain storage |
| Expo Document Picker, Image, Clipboard, Web Browser, Linking | Attachments, cached images, copy actions, external links and invites | Uses native device capabilities instead of web workarounds |
| Expo Font with Manrope and Bricolage Grotesque | Custom typography | Readable on small screens and consistent across platforms |

## Comparison

| Capability | Collabor8r Mobile v2.0 | Collabor8r v1 | Jira mobile | Trello / Asana / ClickUp / Linear |
| --- | --- | --- | --- | --- |
| Multi-org workspaces | Yes | Limited | Yes | Varies |
| Issues, boards and sprints in one app | Yes | Partial | Yes | Varies by tool |
| Wiki, forms and service desk built in | Yes | No | Add-ons or separate products | Mostly separate or paid tiers |
| Automation and webhooks | Yes | No | Limited on mobile | Varies |
| Test management, budgets, goals and risks | Yes | No | Add-ons | Rarely |
| Built-in AI assistant | Yes (Jerry) | No | Paid tier | Varies |
| Native mobile UI | Yes | Web-first | Yes | Yes |
| Light and dark themes | Yes | Partial | Yes | Varies |
| Open source (MIT) | Yes | Yes | No | No |

The comparison reflects the project's design goals and general market positioning. Other products change over time.

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 BazilSuhail.

## About the Author

Built by **BazilSuhail** - [github.com/BazilSuhail](https://github.com/BazilSuhail)
