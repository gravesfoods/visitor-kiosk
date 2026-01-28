# Project structure

> Generated from: `C:\Applications\visitor-kiosk`
> Excluding: `node_modules`

```text
visitor-kiosk/
├── .git/
│   ├── hooks/
│   │   ├── applypatch-msg.sample
│   │   ├── commit-msg.sample
│   │   ├── fsmonitor-watchman.sample
│   │   ├── post-update.sample
│   │   ├── pre-applypatch.sample
│   │   ├── pre-commit.sample
│   │   ├── pre-merge-commit.sample
│   │   ├── pre-push.sample
│   │   ├── pre-rebase.sample
│   │   ├── pre-receive.sample
│   │   ├── prepare-commit-msg.sample
│   │   ├── push-to-checkout.sample
│   │   ├── sendemail-validate.sample
│   │   └── update.sample
│   ├── info/
│   │   └── exclude
│   ├── objects/
│   │   ├── info/
│   │   └── pack/
│   ├── refs/
│   │   ├── heads/
│   │   └── tags/
│   ├── config
│   ├── description
│   ├── FETCH_HEAD
│   └── HEAD
├── be/
│   ├── .git/
│   │   ├── hooks/
│   │   │   ├── applypatch-msg.sample
│   │   │   ├── commit-msg.sample
│   │   │   ├── fsmonitor-watchman.sample
│   │   │   ├── post-update.sample
│   │   │   ├── pre-applypatch.sample
│   │   │   ├── pre-commit.sample
│   │   │   ├── pre-merge-commit.sample
│   │   │   ├── pre-push.sample
│   │   │   ├── pre-rebase.sample
│   │   │   ├── pre-receive.sample
│   │   │   ├── prepare-commit-msg.sample
│   │   │   ├── push-to-checkout.sample
│   │   │   ├── sendemail-validate.sample
│   │   │   └── update.sample
│   │   ├── info/
│   │   │   └── exclude
│   │   ├── objects/
│   │   │   ├── info/
│   │   │   └── pack/
│   │   ├── refs/
│   │   │   ├── heads/
│   │   │   └── tags/
│   │   ├── config
│   │   ├── description
│   │   └── HEAD
│   ├── dist/
│   │   ├── admin/
│   │   │   ├── dto/
│   │   │   │   ├── host-upsert.dto.d.ts
│   │   │   │   ├── host-upsert.dto.js
│   │   │   │   └── host-upsert.dto.js.map
│   │   │   ├── admin.controller.d.ts
│   │   │   ├── admin.controller.js
│   │   │   ├── admin.controller.js.map
│   │   │   ├── admin.module.d.ts
│   │   │   ├── admin.module.js
│   │   │   ├── admin.module.js.map
│   │   │   ├── admin.service.d.ts
│   │   │   ├── admin.service.js
│   │   │   └── admin.service.js.map
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.d.ts
│   │   │   │   ├── login.dto.js
│   │   │   │   ├── login.dto.js.map
│   │   │   │   ├── signup.dto.d.ts
│   │   │   │   ├── signup.dto.js
│   │   │   │   └── signup.dto.js.map
│   │   │   ├── auth.controller.d.ts
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.controller.js.map
│   │   │   ├── auth.module.d.ts
│   │   │   ├── auth.module.js
│   │   │   ├── auth.module.js.map
│   │   │   ├── auth.service.d.ts
│   │   │   ├── auth.service.js
│   │   │   ├── auth.service.js.map
│   │   │   ├── jwt.strategy.d.ts
│   │   │   ├── jwt.strategy.js
│   │   │   └── jwt.strategy.js.map
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── roles.decorator.d.ts
│   │   │   │   ├── roles.decorator.js
│   │   │   │   └── roles.decorator.js.map
│   │   │   └── guards/
│   │   │       ├── jwt-auth.guard.d.ts
│   │   │       ├── jwt-auth.guard.js
│   │   │       ├── jwt-auth.guard.js.map
│   │   │       ├── kiosk-key.guard.d.ts
│   │   │       ├── kiosk-key.guard.js
│   │   │       ├── kiosk-key.guard.js.map
│   │   │       ├── roles.guard.d.ts
│   │   │       ├── roles.guard.js
│   │   │       └── roles.guard.js.map
│   │   ├── entities/
│   │   │   ├── host.entity.d.ts
│   │   │   ├── host.entity.js
│   │   │   ├── host.entity.js.map
│   │   │   ├── user-role.entity.d.ts
│   │   │   ├── user-role.entity.js
│   │   │   ├── user-role.entity.js.map
│   │   │   ├── user.entity.d.ts
│   │   │   ├── user.entity.js
│   │   │   ├── user.entity.js.map
│   │   │   ├── visitor-log.entity.d.ts
│   │   │   ├── visitor-log.entity.js
│   │   │   └── visitor-log.entity.js.map
│   │   ├── kiosk/
│   │   │   ├── dto/
│   │   │   │   ├── print-badge.dto.d.ts
│   │   │   │   ├── print-badge.dto.js
│   │   │   │   └── print-badge.dto.js.map
│   │   │   ├── kiosk.controller.d.ts
│   │   │   ├── kiosk.controller.js
│   │   │   ├── kiosk.controller.js.map
│   │   │   ├── kiosk.module.d.ts
│   │   │   ├── kiosk.module.js
│   │   │   ├── kiosk.module.js.map
│   │   │   ├── kiosk.service.d.ts
│   │   │   ├── kiosk.service.js
│   │   │   └── kiosk.service.js.map
│   │   ├── notifications/
│   │   │   ├── notifications.module.d.ts
│   │   │   ├── notifications.module.js
│   │   │   ├── notifications.module.js.map
│   │   │   ├── notifications.service.d.ts
│   │   │   ├── notifications.service.js
│   │   │   └── notifications.service.js.map
│   │   ├── app.controller.d.ts
│   │   ├── app.controller.js
│   │   ├── app.controller.js.map
│   │   ├── app.module.d.ts
│   │   ├── app.module.js
│   │   ├── app.module.js.map
│   │   ├── app.service.d.ts
│   │   ├── app.service.js
│   │   ├── app.service.js.map
│   │   ├── main.d.ts
│   │   ├── main.js
│   │   ├── main.js.map
│   │   └── tsconfig.build.tsbuildinfo
│   ├── src/
│   │   ├── admin/
│   │   │   ├── dto/
│   │   │   │   └── host-upsert.dto.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.module.ts
│   │   │   └── admin.service.ts
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── signup.dto.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   └── roles.decorator.ts
│   │   │   └── guards/
│   │   │       ├── jwt-auth.guard.ts
│   │   │       ├── kiosk-key.guard.ts
│   │   │       └── roles.guard.ts
│   │   ├── entities/
│   │   │   ├── host.entity.ts
│   │   │   ├── user-role.entity.ts
│   │   │   ├── user.entity.ts
│   │   │   └── visitor-log.entity.ts
│   │   ├── kiosk/
│   │   │   ├── dto/
│   │   │   │   └── print-badge.dto.ts
│   │   │   ├── kiosk.controller.ts
│   │   │   ├── kiosk.module.ts
│   │   │   └── kiosk.service.ts
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   └── notifications.service.ts
│   │   ├── app.controller.spec.ts
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   ├── test/
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   ├── .env
│   ├── .gitignore
│   ├── .prettierrc
│   ├── eslint.config.mjs
│   ├── nest-cli.json
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.build.json
│   └── tsconfig.json
├── fe/
│   ├── bin/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   └── supabasedir/
│   │       ├── functions/
│   │       │   ├── print-badge/
│   │       │   │   └── index.ts
│   │       │   └── send-notification/
│   │       │       └── index.ts
│   │       ├── migrations/
│   │       │   └── 20260127183108_827ae65c-38e8-4853-a0ef-22ea98314358.sql
│   │       └── config.toml
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── HostsManagement.tsx
│   │   │   │   └── VisitorLogsTable.tsx
│   │   │   ├── ui/
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── aspect-ratio.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── breadcrumb.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── carousel.tsx
│   │   │   │   ├── chart.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── collapsible.tsx
│   │   │   │   ├── command.tsx
│   │   │   │   ├── context-menu.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── drawer.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── hover-card.tsx
│   │   │   │   ├── input-otp.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── menubar.tsx
│   │   │   │   ├── navigation-menu.tsx
│   │   │   │   ├── pagination.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── radio-group.tsx
│   │   │   │   ├── resizable.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── slider.tsx
│   │   │   │   ├── sonner.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   ├── toggle-group.tsx
│   │   │   │   ├── toggle.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── use-toast.ts
│   │   │   ├── BadgePreview.tsx
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── NavLink.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   └── VisitorForm.tsx
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-toast.ts
│   │   │   └── useAuth.tsx
│   │   ├── integrations/
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── AdminAuth.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Index.tsx
│   │   │   └── NotFound.tsx
│   │   ├── services/
│   │   │   ├── adminApi.ts
│   │   │   ├── apiClient.ts
│   │   │   ├── authApi.ts
│   │   │   └── kioskApi.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env
│   ├── .gitignore
│   ├── bun.lockb
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── scripts/
│   └── generateProjectStructure.tsx
├── PROJECT_STRUCTURE.md
└── VisitorKiosk.code-workspace
```
