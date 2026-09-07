# Visaflow Dashboard UI Package

This package contains React + Tailwind CSS page implementations matching the Visaflow dashboard UI concepts generated in this conversation:

- Explore Visas
- Visa Details
- My Documents
- Messages
- Wallet
- Payments

It also contains a Codex implementation prompt for the Apply Now → application draft → application steps flow.

## Notes

- The UI uses reusable components and inline SVG icons so it does not require an icon package.
- Replace mock data and placeholder image URLs with your real API/data layer.
- The layouts are desktop-first and should be made responsive against your existing Visaflow breakpoints.
- The generated screenshots are design references; the code recreates the structure, spacing, cards, typography, colors, and interactions rather than embedding the screenshots.
- If your project already has a design system, preserve its existing primitives and tokens instead of duplicating them.

## Suggested integration

Copy `src/components` and `src/pages` into the relevant frontend package of the Visaflow Turborepo and adapt imports/routes to your existing app-router structure.
