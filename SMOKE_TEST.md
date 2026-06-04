# DDT Structure - Smoke Test Checklist

Before any major deployment, please verify the following critical paths.

## 1. Auth & Onboarding
- [ ] Sign up as a new user with a new lab.
- [ ] Verify you are redirected to the success screen, which correctly identifies your role.
- [ ] Verify you are taken to the dashboard, and a "Sample Project" is visible.
- [ ] Log out and verify you can log back in.

## 2. JIT Lab Prefix
- [ ] As a new lab owner, click "New Project".
- [ ] Verify the "Set Lab Code Prefix" modal appears and blocks progress.
- [ ] Enter a prefix (e.g. `TST`) and submit.
- [ ] Verify the modal closes and the standard project creation form is accessible.

## 3. Project Creation & Pipeline
- [ ] Create a new project.
- [ ] Verify the project appears on the Projects list.
- [ ] Open the project and assign the "Analysis" stage to yourself or a staff member.
- [ ] Verify the staff member sees the task on their "My Tasks" dashboard.

## 4. Notifications
- [ ] Complete a stage (e.g. move from WIP to Proof Ready).
- [ ] Verify the lab owner or ops manager receives a notification in the top-right bell icon.

## 5. Offline Capabilities
- [ ] Turn off the network in browser DevTools.
- [ ] View the dashboard. The Offline Banner should appear.
- [ ] Refresh the page. The app should still load from the service worker cache.
- [ ] Turn network back on and verify sync completes.

## 6. Super Admin
- [ ] Log in as a `super_admin` user.
- [ ] Navigate to `/admin`.
- [ ] Verify the cross-tenant dashboard loads and allows status changes.
