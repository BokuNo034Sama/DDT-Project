import { router } from "../trpc";
import { projectsRouter } from "./projects";
import { stagesRouter } from "./stages";
import { proofReviewRouter } from "./proofReview";
import { siteVisitsRouter } from "./siteVisits";
import { staffRouter } from "./staff";
import { notificationsRouter } from "./notifications";
import { performanceRouter } from "./performance";
import { searchRouter } from "./search";
import { adminRouter } from "./admin";
import { settingsRouter } from "./settings";
import { tasksRouter } from "./tasks";
import { reportBotRouter } from "./reportBot";
import { equipmentRouter } from "./equipment";

export const appRouter = router({
  projects: projectsRouter,
  stages: stagesRouter,
  proofReview: proofReviewRouter,
  siteVisits: siteVisitsRouter,
  staff: staffRouter,
  notifications: notificationsRouter,
  performance: performanceRouter,
  search: searchRouter,
  admin: adminRouter,
  settings: settingsRouter,
  tasks: tasksRouter,
  reportBot: reportBotRouter,
  equipment: equipmentRouter,
});

export type AppRouter = typeof appRouter;
