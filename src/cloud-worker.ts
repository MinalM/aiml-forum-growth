/**
 * 24/7 Cloud Background Worker for Antigravity Agents
 * Runs continuously on Render, Railway, Fly.io, or AWS ECS
 */

import { GrowthOrchestrator } from './agents/growth-orchestrator';
import { ContentCuratorAgent } from './agents/content-curator';
import { OutreachScoutAgent } from './agents/outreach-scout';
import { CommunityNurtureAgent } from './agents/community-nurture';

const ORCHESTRATION_INTERVAL_MS = 6 * 60 * 60 * 1000; // Run every 6 hours

async function executeCloudGrowthCycle() {
  console.log(`\n======================================================`);
  console.log(`[CloudWorker] Starting Growth Execution Cycle at ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  try {
    // 1. Run Master Orchestrator
    const orchestrator = new GrowthOrchestrator();
    const tasks = await orchestrator.scheduleDailyTasks();
    console.log(`[CloudWorker] Orchestrated ${tasks.length} subagent tasks.`);

    // 2. Run Content Curator
    const curator = new ContentCuratorAgent();
    const guide = curator.generateAnchorGuide('Full-Stack to LLM Engineer');
    console.log(`[CloudWorker] Content Curator generated guide: "${guide.title}"`);

    // 3. Run Outreach Scout
    const scout = new OutreachScoutAgent();
    const outreach = scout.draftOutreach({
      platform: 'DeveloperForum',
      userQuery: 'How do I transition to AI engineering?',
      queryUrl: 'https://cerulean-marshmallow-003d16.netlify.app/#discussion',
    });
    console.log(`[CloudWorker] Outreach Scout drafted reply for ${outreach.prospectQueryUrl}`);

    // 4. Run Community Nurture
    const nurture = new CommunityNurtureAgent();
    const welcome = nurture.generateWelcomePackage({
      userId: 'usr_cloud_1',
      email: 'cloud_user@example.com',
      background: 'Full-Stack',
      targetRole: 'LLM Application Engineer',
    });
    console.log(`[CloudWorker] Community Nurture dispatched welcome package for ${welcome.userId}`);

  } catch (error) {
    console.error('[CloudWorker] Error during execution cycle:', error);
  }

  console.log(`\n[CloudWorker] Cycle complete. Sleeping until next run in 6 hours...`);
}

// Immediately run once on container boot
executeCloudGrowthCycle();

// Keep process alive & trigger on interval
setInterval(executeCloudGrowthCycle, ORCHESTRATION_INTERVAL_MS);
