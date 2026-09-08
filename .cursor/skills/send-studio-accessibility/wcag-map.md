# WCAG 2.1 mapping for Send Studio

| Criterion | Area | Status to verify |
|-----------|------|------------------|
| 1.1.1 Non-text Content | Image blocks, icons | Alt text in block props; icon buttons need labels |
| 1.3.1 Info and Relationships | Editor zones | Headings, lists, form labels |
| 1.4.3 Contrast (Minimum) | All UI | Muted text, badges, dark mode |
| 2.1.1 Keyboard | Editor, campaigns | Full keyboard path |
| 2.4.3 Focus Order | Multi-column layout | Logical tab order |
| 2.4.7 Focus Visible | Buttons, inputs | Tailwind focus rings |
| 4.1.2 Name, Role, Value | Custom buttons | Channel picker, contact toggle |

## dnd-kit accessibility

Project uses:
```tsx
useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
```

Document keyboard instructions for users:
- Focus drag handle → Space to pick up → Arrow keys to move → Space to drop

Consider adding visible hint in editor empty state.

## Email preview iframe

Not accessible content for screen readers of the admin UI — the iframe previews **recipient** email. Admin should use channel tabs + text preview for accessible review, or provide plain-text summary alongside iframe.
