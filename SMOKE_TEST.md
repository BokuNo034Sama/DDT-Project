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

## 7. V4 Report Bot
### Happy Path
- [ ] Open project at report_done status.
- [ ] Click "Generate Report Draft" button in pipeline or panel.
- [ ] Verify the Concrete Grade Modal appears.
- [ ] Select "No structural drawing" to confirm the default 25N/mm² concrete grade.
- [ ] Verify the Rebar Form appears with pre-filled default settings (e.g. Columns: 16/10/300/45).
- [ ] Click "Next" to navigate to the Excel Upload Panel.
- [ ] Upload a scientific observations Excel sheet (.xlsx format).
- [ ] Click "Generate Report" and observe the cycling progress status updates.
- [ ] Verify that upon completion, the file automatically downloads as `SKAAP_NDT_{ndtCode}_Draft.docx` and the project status advances to `report_bot_draft`.

### Content Checks
- [ ] Open the downloaded document in Microsoft Word.
- [ ] Verify Front Page details match the project metadata (Reference, Client, Address, Date).
- [ ] Verify Executive Summary contains exactly 3 bullets and the visual test placeholder.
- [ ] Verify Introduction references correct concrete grade (e.g., 25N/MM2 assumed).
- [ ] Verify Literature Review lists the names and designations of scheduled site-visit staff.
- [ ] Verify the Rebar table matches the form inputs.
- [ ] Verify UPV analysis tables are formatted properly, with "GOOD" remarks colored green and "POOR" remarks colored red.
- [ ] Verify Conclusion references the correct concrete grade and appropriate corrective measures statement.
- [ ] Verify MD and Field Staff signature blocks are present at the bottom.

### Pipeline Connection
- [ ] Upload a revised report via the standard staff upload interface.
- [ ] Verify the project status advances to `proof_ready`.
- [ ] In the pipeline bar, verify the "Send to Proofread Bot" button is visible and successfully triggers the V3 Proofread review scanning window.
